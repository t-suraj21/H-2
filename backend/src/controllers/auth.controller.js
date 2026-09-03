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
    const { name, email, password, role, preferences } = req.body;

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
