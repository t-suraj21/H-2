import mongoose from 'mongoose';

/**
 * NotificationLog Schema Definition for HL²
 * Tracks all dispatched price drop notifications to prevent duplicate alerts
 */
const NotificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriceAlert',
      required: [true, 'PriceAlert reference is required'],
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    retailerName: {
      type: String,
      default: 'Amazon',
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'in_app'],
      default: 'push',
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'expo',
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SUPPRESSED_DUPLICATE'],
      default: 'SENT',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for instant deduplication checks: (user + alert + currentPrice)
NotificationLogSchema.index({ user: 1, alert: 1, currentPrice: 1, status: 1 });
NotificationLogSchema.index({ user: 1, createdAt: -1 });

export const NotificationLog =
  mongoose.models.NotificationLog ||
  mongoose.model('NotificationLog', NotificationLogSchema);

export default NotificationLog;
