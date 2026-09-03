import mongoose from 'mongoose';

/**
 * User Schema Definition for HL²
 * Supports authentication, user tiers, currency preferences, and notification channels
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Omit password hash by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'pro', 'admin'],
        message: 'Role must be either user, pro, or admin',
      },
      default: 'user',
      index: true,
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
    preferences: {
      currency: {
        type: String,
        enum: ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'],
        default: 'USD',
      },
      countryCode: {
        type: String,
        default: 'US',
        uppercase: true,
        trim: true,
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        minPriceDropPercentage: {
          type: Number,
          default: 5,
          min: [1, 'Minimum price drop threshold is 1%'],
          max: [100, 'Maximum price drop threshold is 100%'],
        },
      },
      preferredRetailers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Retailer',
        },
      ],
    },
    pushTokens: [
      {
        token: { type: String, required: true, trim: true },
        platform: { type: String, enum: ['ios', 'android', 'web', 'unknown'], default: 'unknown' },
        deviceId: { type: String, trim: true },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for user's active price alerts
UserSchema.virtual('alerts', {
  ref: 'PriceAlert',
  localField: '_id',
  foreignField: 'user',
});

// Virtual for user's watchlist items
UserSchema.virtual('watchlist', {
  ref: 'Watchlist',
  localField: '_id',
  foreignField: 'user',
});

// Index for active users lookup
UserSchema.index({ email: 1, isActive: 1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
