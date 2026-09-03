import mongoose from 'mongoose';

/**
 * SearchHistory Schema Definition for HL²
 * Stores non-sensitive, recently analyzed product searches for authenticated users
 */
const SearchHistorySchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [400, 'Title cannot exceed 400 characters'],
    },
    url: {
      type: String,
      required: [true, 'Product URL is required'],
      trim: true,
    },
    retailer: {
      type: String,
      default: 'Amazon',
      trim: true,
    },
    brand: {
      type: String,
      default: 'Generic',
      trim: true,
    },
    category: {
      type: String,
      default: 'Electronics',
      trim: true,
    },
    lowestPrice: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    searchedAt: {
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

// Compound indexes for high performance and fast deduplication
SearchHistorySchema.index({ user: 1, searchedAt: -1 });
SearchHistorySchema.index({ user: 1, url: 1 });

export const SearchHistory =
  mongoose.models.SearchHistory ||
  mongoose.model('SearchHistory', SearchHistorySchema);

export default SearchHistory;
