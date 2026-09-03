import { Router } from 'express';
import {
  createAlert,
  getAlerts,
  deleteAlert,
  evaluateAlerts,
} from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All alert endpoints require authentication
router.use(authenticate);

/**
 * @route   POST /api/alerts
 * @desc    Create a new price drop alert
 * @access  Private
 */
router.post('/', createAlert);

/**
 * @route   GET /api/alerts
 * @desc    Get all price alerts for current user
 * @access  Private
 */
router.get('/', getAlerts);

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete a price alert
 * @access  Private
 */
router.delete('/:id', deleteAlert);

/**
 * @route   POST /api/alerts/evaluate
 * @desc    Trigger price alert evaluation for a product on-demand
 * @access  Private
 */
router.post('/evaluate', evaluateAlerts);

export default router;
