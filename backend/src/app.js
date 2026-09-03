import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { sanitizeInputs } from './middleware/sanitize.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();

  // 1. Security Headers Middleware (Helmet)
  app.use(helmet());

  // 2. CORS Middleware with restricted origins
  app.use(
    cors({
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Test-RateLimit'],
    })
  );

  // 3. Body Parsing Middleware with payload size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. NoSQL Injection Protection
  app.use(sanitizeInputs);

  // 5. Global API Rate Limiter
  app.use('/api', apiLimiter);

  // 6. Request Logging Middleware
  app.use(requestLogger);

  // Root Welcome Endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'HL² API',
      tagline: 'Compare. Analyze. Buy Smarter.',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        health: '/api/health',
      },
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // 404 Not Found Middleware
  app.use(notFoundHandler);

  // Global Error Handler Middleware
  app.use(errorHandler);

  return app;
};
