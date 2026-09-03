import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
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
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Private (Bearer Token required)
 */
router.get('/me', authenticate, getMe);

export default router;
