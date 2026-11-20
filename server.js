const app = require('./src/app');
const config = require('./src/config/env');
const monitorJob = require('./src/jobs/monitor.job');
const logger = require('./src/utils/logger');
const prisma = require('./src/config/prisma');

const PORT = config.port;

// Gentle database connection test
const checkDatabase = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established successfully.');
  } catch (err) {
    logger.warn('Database is not yet connected or reachable.');
    logger.warn('Please configure your DATABASE_URL in .env and run migrations when ready.');
    logger.warn(`Current connection attempt details: ${err.message}`);
  }
};

const server = app.listen(PORT, async () => {
  logger.info(`================================================================`);
  logger.info(`🚀 Bitcoin Monitoring System Server running on port ${PORT}`);
  logger.info(`🌐 Network: ${config.bitcoinNetwork}`);
  logger.info(`🔗 Blockstream API: ${config.blockstreamApiUrl}`);
  logger.info(`⏱️  Monitoring Interval: Every ${config.monitoringIntervalSeconds} seconds`);
  logger.info(`📖 API Documentation available at: http://localhost:${PORT}/api-docs`);
  logger.info(`================================================================`);

  // Check database connectivity
  await checkDatabase();

  // Start automated monitoring job
  monitorJob.start();
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  monitorJob.stop();

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
    } catch (err) {
      logger.error('Error disconnecting from database:', err.message);
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
});
