import mongoose from 'mongoose';

/**
 * Variant Sub-schema for Products
 */
const VariantSchema = new mongoose.Schema(
  {
    variantId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: null,
    },
    size: {
      type: String,
      trim: true,
      default: null,
    },
    storage: {
      type: String,
      trim: true,
      default: null,
    },
    image: {
      type: String,
      trim: true,
      default: null,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

/**
 * Retailer-specific Identifier Sub-schema
 */
const RetailerSpecificIdSchema = new mongoose.Schema(
  {
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Retailer',
      required: true,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Product Schema Definition for HL²
 * Canonical product entity aggregating offers and cross-retailer listings
 */
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [300, 'Product name cannot exceed 300 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Product brand is required'],
      trim: true,
      index: true,
    },
    model: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Primary product image is required'],
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    identifiers: {
      sku: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        index: true,
      },
      asin: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        index: true,
      },
      gtin: {
        type: String,
        trim: true,
        sparse: true,
        index: true,
      },
      mpn: {
        type: String,
        trim: true,
      },
      retailerSpecificIds: [RetailerSpecificIdSchema],
    },
    variants: [VariantSchema],
    specifications: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    lowestRecordedPrice: {
      type: Number,
      default: null,
    },
    highestRecordedPrice: {
      type: Number,
      default: null,
    },
    currentLowestOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductOffer',
      default: null,
    },
    isActive: {
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

// Virtual for real-time offers across all retailers
ProductSchema.virtual('offers', {
  ref: 'ProductOffer',
  localField: '_id',
  foreignField: 'product',
});

// Virtual for price history records
ProductSchema.virtual('priceHistory', {
  ref: 'PriceHistory',
  localField: '_id',
  foreignField: 'product',
});

// Compound Indexes for fast category browsing & brand filtering
ProductSchema.index({ category: 1, brand: 1 });
ProductSchema.index({ brand: 1, model: 1 });
ProductSchema.index({ 'identifiers.retailerSpecificIds.identifier': 1 });
ProductSchema.index({ 'identifiers.retailerSpecificIds.retailer': 1, 'identifiers.retailerSpecificIds.identifier': 1 });

// Full-text search index for smart search bar queries
ProductSchema.index(
  {
    name: 'text',
    brand: 'text',
    model: 'text',
    category: 'text',
    description: 'text',
  },
  {
    weights: {
      name: 10,
      brand: 5,
      model: 4,
      category: 2,
      description: 1,
    },
    name: 'ProductTextSearchIndex',
  }
);

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;
