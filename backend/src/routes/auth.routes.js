import { Router } from 'express';
import { register, login, getMe, googleAuth, updateProfile, syncPlatforms } from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new HL² account
 * @access  Public (Rate limited)
 */
router.post('/register', authLimiter, validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Log in to an existing HL² account
 * @access  Public (Rate limited)
 */
router.post('/login', authLimiter, validateLogin, login);

/**
 * @route   POST /api/auth/google
 * @desc    Sign in or register with Google / Firebase
 * @access  Public (Rate limited)
 */
router.post('/google', authLimiter, googleAuth);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Private (Bearer Token required)
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update authenticated user profile (name, phone, address, gender, etc.)
 * @access  Private (Bearer Token required)
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   POST /api/auth/sync-platforms
 * @desc    Synchronize master profile across shopping platforms
 * @access  Private (Bearer Token required)
 */
router.post('/sync-platforms', authenticate, syncPlatforms);

export default router;
