import mongoose from 'mongoose';

/**
 * PriceHistory Schema Definition for HL²
 * Stores point-in-time pricing observations for trend analytics, charts, and deal authenticity scoring
 */
const PriceHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Retailer',
      required: [true, 'Retailer reference is required'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price observation is required'],
      min: [0, 'Price cannot be negative'],
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      default: null,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    effectivePrice: {
      type: Number,
      min: 0,
      default: function () {
        return (this.price || 0) + (this.deliveryFee || 0);
      },
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optimized compound indexes for time-series charts and range queries
PriceHistorySchema.index({ product: 1, timestamp: -1 });
PriceHistorySchema.index({ product: 1, retailer: 1, timestamp: -1 });
PriceHistorySchema.index({ timestamp: 1 });

export const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory', PriceHistorySchema);
export default PriceHistory;
