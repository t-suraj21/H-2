import mongoose from 'mongoose';

/**
 * Retailer Schema Definition for HL²
 * Represents supported e-commerce platforms (Amazon, Walmart, Best Buy, Target, Flipkart, etc.)
 */
const RetailerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Retailer name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Retailer name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Retailer slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    websiteUrl: {
      type: String,
      required: [true, 'Retailer website URL is required'],
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
        'Please provide a valid website URL',
      ],
    },
    logoUrl: {
      type: String,
      default: null,
      trim: true,
    },
    affiliateParam: {
      type: String,
      default: null,
      trim: true,
    },
    countryCode: {
      type: String,
      default: 'US',
      uppercase: true,
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    reliabilityRating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5.0'],
      default: 4.5,
    },
    isScrapable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    scrapingConfig: {
      rateLimitRequestsPerMin: { type: Number, default: 30 },
      headers: { type: Map, of: String, default: {} },
      selectorEngine: { type: String, default: 'cheerio' },
      supportsLiveStock: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for offers linked to this retailer
RetailerSchema.virtual('offers', {
  ref: 'ProductOffer',
  localField: '_id',
  foreignField: 'retailer',
});

// Indexes for fast querying
RetailerSchema.index({ slug: 1, isActive: 1 });
RetailerSchema.index({ countryCode: 1, isActive: 1 });

export const Retailer = mongoose.models.Retailer || mongoose.model('Retailer', RetailerSchema);
export default Retailer;
