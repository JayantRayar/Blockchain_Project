const cron = require('node-cron');
const config = require('../config/env');
const monitoringService = require('../services/monitoring.service');
const logger = require('../utils/logger');

class MonitorJob {
  constructor() {
    this.cronTask = null;
    this.isJobRunning = false;
    this.intervalSeconds = config.monitoringIntervalSeconds;
  }

  /**
   * Start the monitoring cron job
   */
  start() {
    if (this.cronTask) {
      logger.warn('Monitoring job is already running');
      return;
    }

    // Cron expression for running every N seconds
    // Standard cron format for every N seconds: `*/N * * * * *`
    const cronExpression = `*/${this.intervalSeconds} * * * * *`;

    logger.info(`Initializing Bitcoin Wallet Monitoring Job (Interval: every ${this.intervalSeconds}s)...`);

    this.cronTask = cron.schedule(cronExpression, async () => {
      // Overlap prevention guard
      if (this.isJobRunning) {
        logger.warn('Previous monitoring cycle is still executing. Skipping this interval to avoid overlap.');
        return;
      }

      this.isJobRunning = true;
      const startTime = Date.now();

      try {
        logger.info('--- [MONITORING JOB RUN START] ---');
        const results = await monitoringService.syncAllActiveWallets();
        const durationMs = Date.now() - startTime;
        logger.info(`--- [MONITORING JOB RUN FINISHED] Processed ${results.length} wallets in ${durationMs}ms ---`);
      } catch (err) {
        logger.error(`Unhandled error during monitoring job cycle: ${err.message}`, err.stack);
      } finally {
        this.isJobRunning = false;
      }
    });

    logger.info(`Bitcoin Wallet Monitoring Job successfully scheduled with pattern: "${cronExpression}"`);
  }

  /**
   * Stop the monitoring cron job
   */
  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      logger.info('Bitcoin Wallet Monitoring Job stopped.');
    }
  }

  /**
   * Get current job status
   */
  getStatus() {
    return {
      isScheduled: Boolean(this.cronTask),
      isJobRunning: this.isJobRunning,
      intervalSeconds: this.intervalSeconds
    };
  }
}

module.exports = new MonitorJob();
