import mongoose from 'mongoose';

/**
 * ProductOffer Schema Definition for HL²
 * Represents an active product listing on a specific retailer with price, stock, and deal scoring
 */
const ProductOfferSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: [400, 'Title cannot exceed 400 characters'],
    },
    url: {
      type: String,
      required: [true, 'Product offer URL is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Current selling price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      default: null,
    },
    discount: {
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    deliveryFee: {
      type: Number,
      min: [0, 'Delivery fee cannot be negative'],
      default: 0,
    },
    isFreeDelivery: {
      type: Boolean,
      default: false,
    },
    effectivePrice: {
      type: Number,
      min: [0, 'Effective price cannot be negative'],
      default: function () {
        return (this.price || 0) + (this.deliveryFee || 0);
      },
      index: true,
    },
    seller: {
      name: {
        type: String,
        trim: true,
        default: 'Direct Retailer',
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: null,
      },
      isAuthorized: {
        type: Boolean,
        default: true,
      },
      isFulfilledByRetailer: {
        type: Boolean,
        default: true,
      },
    },
    availability: {
      status: {
        type: String,
        enum: ['IN_STOCK', 'OUT_OF_STOCK', 'PREORDER', 'BACKORDER', 'UNKNOWN'],
        default: 'IN_STOCK',
        index: true,
      },
      stockQuantity: {
        type: Number,
        default: null,
      },
      shippingEstimate: {
        type: String,
        default: 'Standard Shipping',
        trim: true,
      },
    },
    returnPolicy: {
      returnDays: {
        type: Number,
        default: 30,
      },
      isFreeReturn: {
        type: Boolean,
        default: true,
      },
    },
    coupon: {
      code: { type: String, trim: true, default: null },
      discountAmount: { type: Number, default: 0 },
      isApplied: { type: Boolean, default: false },
    },
    isVerifiedDeal: {
      type: Boolean,
      default: false,
      index: true,
    },
    dealScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    lastChecked: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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

// Pre-save middleware to auto-calculate discount and effectivePrice reliably
ProductOfferSchema.pre('save', function (next) {
  // Compute effective price = price + delivery fee - coupon discount
  const couponDiscount = this.coupon?.isApplied ? (this.coupon.discountAmount || 0) : 0;
  const delivery = this.deliveryFee || 0;
  this.effectivePrice = Math.max(0, this.price + delivery - couponDiscount);

  // Compute discount percentage if MRP is set and greater than price
  if (this.mrp && this.mrp > this.price) {
    this.discount.amount = parseFloat((this.mrp - this.price).toFixed(2));
    this.discount.percentage = parseFloat((((this.mrp - this.price) / this.mrp) * 100).toFixed(1));
  }

  // Free delivery flag
  if (delivery === 0) {
    this.isFreeDelivery = true;
  }

  next();
});

// Compound Indexes for fast queries
ProductOfferSchema.index({ product: 1, retailer: 1 }, { unique: true });
ProductOfferSchema.index({ product: 1, price: 1 });
ProductOfferSchema.index({ product: 1, effectivePrice: 1 });
ProductOfferSchema.index({ retailer: 1, 'availability.status': 1 });
ProductOfferSchema.index({ lastChecked: -1 });

export const ProductOffer = mongoose.models.ProductOffer || mongoose.model('ProductOffer', ProductOfferSchema);
export default ProductOffer;
