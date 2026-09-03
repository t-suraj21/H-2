import mongoose from 'mongoose';
import { PriceAlert } from '../../models/PriceAlert.js';
import { Product } from '../../models/Product.js';
import { notificationService } from '../notification/NotificationService.js';
import { logger } from '../../utils/logger.js';

export class AlertEvaluationService {
  /**
   * Create a new price drop alert
   * @param {string} userId
   * @param {object} params - { productId, targetPrice, retailerId, notificationChannels, productData }
   * @returns {Promise<object>} Created alert document
   */
  async createAlert(userId, { productId, targetPrice, retailerId, notificationChannels, productData = {} }) {
    if (!userId) {
      throw new Error('User ID is required to create a price alert');
    }

    const targetPriceNum = Number(targetPrice);
    if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
      throw new Error('Valid target price greater than 0 is required');
    }

    let targetProduct = null;

    // 1. Resolve product by ObjectId or create if newly indexed
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      targetProduct = await Product.findById(productId);
    }

    if (!targetProduct) {
      const title = productData.title || productData.name || 'Alert Product';
      const brand = productData.brand || 'Generic';
      const model = productData.model || 'Standard Model';

      targetProduct = await Product.findOne({ name: title, brand });

      if (!targetProduct) {
        const basePrice = Number(productData.price || productData.currentPrice || targetPriceNum * 1.1);
        const mrp = Number(productData.mrp || basePrice * 1.2);

        targetProduct = await Product.create({
          name: title,
          brand,
          model,
          category: productData.category || 'Electronics',
          image:
            productData.image ||
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          lowestRecordedPrice: basePrice,
          highestRecordedPrice: mrp,
        });
      }
    }

    // 2. Check if current market price already meets targetPrice
    const currentPrice = targetProduct.lowestRecordedPrice || Number(productData.price || 0);
    const isImmediatelyTriggered = currentPrice > 0 && currentPrice <= targetPriceNum;

    // 3. Create PriceAlert document
    const alert = await PriceAlert.create({
      user: userId,
      product: targetProduct._id,
      targetPrice: targetPriceNum,
      retailer: retailerId && mongoose.Types.ObjectId.isValid(retailerId) ? retailerId : null,
      notificationChannels: notificationChannels || { push: true, email: true },
      status: isImmediatelyTriggered ? 'TRIGGERED' : 'ACTIVE',
      triggered: isImmediatelyTriggered,
      triggeredAt: isImmediatelyTriggered ? new Date() : null,
      triggeredPrice: isImmediatelyTriggered ? currentPrice : null,
      active: true,
    });

    await alert.populate('product');

    // 4. Dispatch notification if immediately triggered
    if (isImmediatelyTriggered) {
      try {
        await notificationService.sendPriceDropAlert({
          alertId: alert._id,
          productId: targetProduct._id,
          productName: targetProduct.name,
          currentPrice,
          targetPrice: targetPriceNum,
          retailerName: 'Amazon',
          userId,
        });
      } catch (notifErr) {
        logger.warn(`Immediate alert notification warning: ${notifErr.message}`);
      }
    }

    return {
      alert,
      isImmediatelyTriggered,
      message: isImmediatelyTriggered
        ? `Alert created: Current price (${currentPrice}) is already below your target (${targetPriceNum})!`
        : `Price alert set: You will be notified when price falls below ₹${targetPriceNum.toLocaleString('en-IN')}`,
    };
  }

  /**
   * Evaluate all active alerts for a specific product when a new price observation arrives
   * @param {string} productId
   * @param {number} currentPrice
   * @param {object} [context={}]
   * @returns {Promise<object>} Evaluation results and triggered alerts
   */
  async evaluateAlertsForProduct(productId, currentPrice, context = {}) {
    const price = Number(currentPrice);
    if (!productId || isNaN(price) || price <= 0) {
      return { evaluatedCount: 0, triggeredCount: 0, triggeredAlerts: [] };
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { evaluatedCount: 0, triggeredCount: 0, triggeredAlerts: [] };
    }

    // Find all ACTIVE alerts for this product
    const activeAlerts = await PriceAlert.find({
      product: productId,
      status: 'ACTIVE',
      active: true,
    })
      .populate('user', 'name email')
      .populate('product', 'name brand model image');

    const triggeredList = [];

    for (const alert of activeAlerts) {
      // Condition: currentPrice <= targetPrice
      if (price <= alert.targetPrice) {
        alert.status = 'TRIGGERED';
        alert.triggered = true;
        alert.triggeredAt = new Date();
        alert.triggeredPrice = price;

        if (context.offerId && mongoose.Types.ObjectId.isValid(context.offerId)) {
          alert.triggeredOffer = context.offerId;
        }

        await alert.save();

        const userId = alert.user?._id || alert.user;
        const productName = alert.product?.name || 'Tracked Product';
        const retailerName = context.retailer || 'Amazon';

        // Dispatch push notification with duplicate protection
        try {
          await notificationService.sendPriceDropAlert({
            alertId: alert._id,
            productId: alert.product?._id || productId,
            productName,
            currentPrice: price,
            targetPrice: alert.targetPrice,
            retailerName,
            userId,
          });
        } catch (notifErr) {
          logger.warn(`[AlertEvaluationService] Notification dispatch error: ${notifErr.message}`);
        }

        triggeredList.push({
          alertId: alert._id,
          userId,
          userEmail: alert.user?.email,
          productName,
          targetPrice: alert.targetPrice,
          triggeredPrice: price,
          triggeredAt: alert.triggeredAt,
          savings: alert.targetPrice - price,
        });
      }
    }

    return {
      productId,
      currentPrice: price,
      evaluatedCount: activeAlerts.length,
      triggeredCount: triggeredList.length,
      triggeredAlerts: triggeredList,
    };
  }

  /**
   * Evaluate all active alerts across all products (callable by future cron workers / schedulers)
   * @param {Record<string, number>} [productPriceMap] - Optional map of productId -> currentPrice
   * @returns {Promise<object>} Bulk evaluation summary
   */
  async evaluateAllActiveAlerts(productPriceMap = {}) {
    const activeAlerts = await PriceAlert.find({
      status: 'ACTIVE',
      active: true,
    })
      .populate('product')
      .populate('user', 'name email');

    const triggeredAlerts = [];

    for (const alert of activeAlerts) {
      const prodId = alert.product?._id?.toString();
      const currentPrice =
        productPriceMap[prodId] ??
        alert.product?.lowestRecordedPrice ??
        null;

      if (currentPrice !== null && currentPrice <= alert.targetPrice) {
        alert.status = 'TRIGGERED';
        alert.triggered = true;
        alert.triggeredAt = new Date();
        alert.triggeredPrice = currentPrice;
        await alert.save();

        const userId = alert.user?._id || alert.user;
        const productName = alert.product?.name || 'Tracked Product';

        // Dispatch notification
        try {
          await notificationService.sendPriceDropAlert({
            alertId: alert._id,
            productId: alert.product?._id,
            productName,
            currentPrice,
            targetPrice: alert.targetPrice,
            retailerName: 'Amazon',
            userId,
          });
        } catch (notifErr) {
          logger.warn(`[AlertEvaluationService] Bulk alert notification warning: ${notifErr.message}`);
        }

        triggeredAlerts.push({
          alertId: alert._id,
          userId,
          productTitle: alert.product?.name,
          targetPrice: alert.targetPrice,
          triggeredPrice: currentPrice,
          triggeredAt: alert.triggeredAt,
        });
      }
    }

    return {
      totalEvaluated: activeAlerts.length,
      totalTriggered: triggeredAlerts.length,
      triggeredAlerts,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieve all price alerts for a user
   * @param {string} userId
   * @returns {Promise<Array>} Formatted alert items
   */
  async getUserAlerts(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const alerts = await PriceAlert.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('product')
      .lean();

    return alerts.map((a) => {
      const p = a.product || {};
      const currentPrice = p.lowestRecordedPrice || a.targetPrice;
      const isMet = currentPrice <= a.targetPrice;

      return {
        id: a._id,
        productId: p._id || a.product,
        title: p.name || 'Product',
        brand: p.brand || 'Brand',
        model: p.model || 'Model',
        category: p.category || 'General',
        image: p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        targetPrice: a.targetPrice,
        currentPrice,
        status: a.status || (a.triggered ? 'TRIGGERED' : 'ACTIVE'),
        triggered: Boolean(a.triggered || a.status === 'TRIGGERED'),
        triggeredAt: a.triggeredAt,
        triggeredPrice: a.triggeredPrice,
        isTargetMet: isMet,
        notificationChannels: a.notificationChannels,
        createdAt: a.createdAt,
      };
    });
  }

  /**
   * Delete an alert
   * @param {string} userId
   * @param {string} alertId
   * @returns {Promise<boolean>} True if removed
   */
  async deleteAlert(userId, alertId) {
    if (!userId || !alertId) {
      throw new Error('User ID and alert ID are required');
    }

    const deleted = await PriceAlert.findOneAndDelete({
      _id: alertId,
      user: userId,
    });

    return Boolean(deleted);
  }
}

export const alertEvaluationService = new AlertEvaluationService();
export default alertEvaluationService;
