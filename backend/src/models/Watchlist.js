import mongoose from 'mongoose';

/**
 * Watchlist Schema Definition for HL²
 * Links users to products they are actively tracking
 */
const WatchlistSchema = new mongoose.Schema(
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
      min: [0, 'Target price cannot be negative'],
      default: null,
    },
    initialPrice: {
      type: Number,
      min: [0, 'Initial price cannot be negative'],
      default: null,
    },
    lowestPriceSinceAdded: {
      type: Number,
      min: [0, 'Lowest price cannot be negative'],
      default: null,
    },
    notifyOnPriceDrop: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: a user can only have one watchlist entry per product
WatchlistSchema.index({ user: 1, product: 1 }, { unique: true });
WatchlistSchema.index({ user: 1, createdAt: -1 });

export const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist', WatchlistSchema);
export default Watchlist;
