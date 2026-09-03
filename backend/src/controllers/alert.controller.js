import { alertEvaluationService } from '../services/alert/AlertEvaluationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Create a new price drop alert
 * POST /api/alerts
 */
export const createAlert = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, targetPrice, retailerId, notificationChannels, productData } = req.body;

    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      return sendError(res, 'Valid target price greater than 0 is required', 400);
    }

    const result = await alertEvaluationService.createAlert(userId, {
      productId,
      targetPrice,
      retailerId,
      notificationChannels,
      productData,
    });

    return sendSuccess(
      res,
      result.message,
      result.alert,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all price alerts for the authenticated user
 * GET /api/alerts
 */
export const getAlerts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const alerts = await alertEvaluationService.getUserAlerts(userId);

    return sendSuccess(
      res,
      'Price alerts retrieved successfully',
      alerts,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a price alert
 * DELETE /api/alerts/:id
 */
export const deleteAlert = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'Alert ID is required', 400);
    }

    const removed = await alertEvaluationService.deleteAlert(userId, id);

    if (!removed) {
      return sendError(res, 'Alert not found', 404);
    }

    return sendSuccess(
      res,
      'Price alert deleted successfully',
      { id, deleted: true },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Evaluate price alerts for a product on-demand (e.g. after price observation)
 * POST /api/alerts/evaluate
 */
export const evaluateAlerts = async (req, res, next) => {
  try {
    const { productId, currentPrice } = req.body;

    if (!productId || currentPrice === undefined) {
      return sendError(res, 'productId and currentPrice are required', 400);
    }

    const result = await alertEvaluationService.evaluateAlertsForProduct(
      productId,
      Number(currentPrice)
    );

    return sendSuccess(
      res,
      `Evaluated ${result.evaluatedCount} alerts, triggered ${result.triggeredCount}`,
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};
