const express = require('express');
const router = express.Router();

const walletRoutes = require('./wallet.routes');
const blockchainRoutes = require('./blockchain.routes');
const monitoringRoutes = require('./monitoring.routes');
const config = require('../config/env');
const monitorJob = require('../jobs/monitor.job');

// System Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Blockchain-Based Bitcoin Monitoring System',
    timestamp: new Date().toISOString(),
    network: config.bitcoinNetwork,
    monitoringJob: monitorJob.getStatus()
  });
});

// Mount modular sub-routers
router.use('/wallets', walletRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/monitoring', monitoringRoutes);

module.exports = router;
