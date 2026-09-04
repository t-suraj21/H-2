import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import productRoutes from './product.routes.js';
import watchlistRoutes from './watchlist.routes.js';
import alertRoutes from './alert.routes.js';
import notificationRoutes from './notification.routes.js';
import searchHistoryRoutes from './searchHistory.routes.js';

const router = Router();

// Mount health routes under /api/health
router.use('/', healthRoutes);

// Mount users routes under /api/users
router.use('/users', usersRoutes);

// Mount auth routes under /api/auth
router.use('/auth', authRoutes);

// Mount product routes under /api/products
router.use('/products', productRoutes);

// Mount watchlist routes under /api/watchlist
router.use('/watchlist', watchlistRoutes);

// Mount alert routes under /api/alerts
router.use('/alerts', alertRoutes);

// Mount notification routes under /api/notifications
router.use('/notifications', notificationRoutes);

// Mount search history routes under /api/search-history
router.use('/search-history', searchHistoryRoutes);

export default router;
