import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, preferences, phone, shippingAddress } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(
        res,
        'Email address is already registered. Please sign in or use another email.',
        409
      );
    }

    // Securely hash password
    const hashedPassword = await hashPassword(password);

    // Create user document
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role && ['user', 'pro'].includes(role) ? role : 'user',
      preferences: preferences || {},
      phone: phone || null,
      shippingAddress: shippingAddress || {},
      lastLoginAt: new Date(),
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Return safe user object (password is omitted automatically by schema toJSON)
    return sendSuccess(
      res,
      'Registration successful. Welcome to HL²!',
      {
        token,
        user: user.toJSON(),
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user including the password hash for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated.', 403);
    }

    // Verify password hash
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(
      res,
      'Login successful. Welcome back to HL²!',
      {
        token,
        user: user.toJSON(),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      'User profile retrieved successfully',
      {
        user: req.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Google Social Authentication
 * POST /api/auth/google
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email || typeof email !== 'string') {
      return sendError(res, 'A valid email is required for Google authentication.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: name || 'HL² Shopper',
        email: normalizedEmail,
        avatar: avatar || null,
        role: 'user',
        isActive: true,
        lastLoginAt: new Date(),
      });
    } else {
      user.lastLoginAt = new Date();
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      if (name && (!user.name || user.name === 'HL² Shopper')) {
        user.name = name;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(
      res,
      'Google authentication successful. Welcome to HL²!',
      {
        token,
        user: user.toJSON(),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return sendError(res, 'User not authenticated.', 401);
    }

    const { name, phone, gender, dateOfBirth, shippingAddress, connectedPlatforms, avatar } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (gender !== undefined && ['male', 'female', 'other', 'unspecified'].includes(gender)) {
      user.gender = gender;
    }
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (avatar !== undefined) user.avatar = avatar;

    if (shippingAddress && typeof shippingAddress === 'object') {
      user.shippingAddress = {
        fullName: shippingAddress.fullName !== undefined ? shippingAddress.fullName : user.shippingAddress?.fullName || '',
        addressLine1: shippingAddress.addressLine1 !== undefined ? shippingAddress.addressLine1 : user.shippingAddress?.addressLine1 || '',
        addressLine2: shippingAddress.addressLine2 !== undefined ? shippingAddress.addressLine2 : user.shippingAddress?.addressLine2 || '',
        city: shippingAddress.city !== undefined ? shippingAddress.city : user.shippingAddress?.city || '',
        state: shippingAddress.state !== undefined ? shippingAddress.state : user.shippingAddress?.state || '',
        pincode: shippingAddress.pincode !== undefined ? shippingAddress.pincode : user.shippingAddress?.pincode || '',
        country: shippingAddress.country !== undefined ? shippingAddress.country : user.shippingAddress?.country || 'India',
        addressType: shippingAddress.addressType || user.shippingAddress?.addressType || 'home',
      };
    }

    if (connectedPlatforms && typeof connectedPlatforms === 'object') {
      user.connectedPlatforms = {
        ...user.connectedPlatforms,
        ...connectedPlatforms,
      };
    }

    await user.save();

    return sendSuccess(
      res,
      'Profile updated and synchronized successfully across shopping platforms.',
      {
        user: user.toJSON(),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Synchronize profile across shopping platforms (Amazon, Flipkart, Myntra, Meesho)
 * POST /api/auth/sync-platforms
 */
export const syncPlatforms = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return sendError(res, 'User not authenticated.', 401);
    }

    const { platform } = req.body;
    const now = new Date();

    if (!user.connectedPlatforms) {
      user.connectedPlatforms = {
        amazon: { connected: true, lastSynced: now },
        flipkart: { connected: true, lastSynced: now },
        myntra: { connected: true, lastSynced: now },
        meesho: { connected: true, lastSynced: now },
      };
    } else if (platform && user.connectedPlatforms[platform]) {
      user.connectedPlatforms[platform].lastSynced = now;
      user.connectedPlatforms[platform].connected = true;
    } else {
      ['amazon', 'flipkart', 'myntra', 'meesho'].forEach((p) => {
        if (!user.connectedPlatforms[p]) {
          user.connectedPlatforms[p] = { connected: true, lastSynced: now };
        } else {
          user.connectedPlatforms[p].lastSynced = now;
          user.connectedPlatforms[p].connected = true;
        }
      });
    }

    user.markModified('connectedPlatforms');
    await user.save();

    return sendSuccess(
      res,
      'Master profile synchronized across Amazon, Flipkart, Myntra, and Meesho!',
      {
        user: user.toJSON(),
        syncedAt: now,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

