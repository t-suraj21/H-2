import mongoose from 'mongoose';

/**
 * PriceAlert Schema Definition for HL²
 * Triggers instant notifications when a product reaches or dips below the user's target threshold
 */
const PriceAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    targetPrice: {
      type: Number,
      required: [true, 'Target price threshold is required'],
      min: [0, 'Target price cannot be negative'],
    },
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Retailer',
      default: null, // Optional: if null, alerts on ANY retailer reaching the target
    },
    notificationChannels: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      emailAddress: { type: String, lowercase: true, trim: true },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIGGERED', 'DISMISSED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    triggered: {
      type: Boolean,
      default: false,
      index: true,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    triggeredPrice: {
      type: Number,
      default: null,
    },
    triggeredOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductOffer',
      default: null,
    },
    autoDeactivateAfterTrigger: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optimized compound indexes for background price checker worker
PriceAlertSchema.index({ active: 1, triggered: 1, product: 1, targetPrice: 1 });
PriceAlertSchema.index({ user: 1, active: 1, createdAt: -1 });
PriceAlertSchema.index({ product: 1, active: 1 });

export const PriceAlert = mongoose.models.PriceAlert || mongoose.model('PriceAlert', PriceAlertSchema);
export default PriceAlert;
