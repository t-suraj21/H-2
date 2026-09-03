import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // Connect to Database
  await connectDatabase();

  // Create Express App
  const app = createApp();

  // Create HTTP Server
  const server = http.createServer(app);

  // Listen on configured port
  server.listen(config.PORT, () => {
    logger.info(`HL² API server running at http://localhost:${config.PORT}`);
    logger.info(`Health check available at http://localhost:${config.PORT}/api/health`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  });

  // Graceful Shutdown Handlers
  const handleShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Cleanup complete. Process exiting.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
