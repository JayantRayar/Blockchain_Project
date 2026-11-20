const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoring.controller');
const { validateAddressParam, validateTxidParam } = require('../middleware/validator');

/**
 * @openapi
 * /api/monitoring/wallet/{address}:
 *   get:
 *     summary: Get wallet monitoring status, balance summary, and registration details
 *     tags: [Monitoring]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [testnet, mainnet]
 *     responses:
 *       200:
 *         description: Wallet monitoring details
 *       400:
 *         description: Invalid address
 */
router.get('/wallet/:address', validateAddressParam, monitoringController.getWalletInfo);

/**
 * @openapi
 * /api/monitoring/wallet/{address}/balance:
 *   get:
 *     summary: Fetch real-time Bitcoin balance (confirmed, unconfirmed, total in sats & BTC)
 *     tags: [Monitoring]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [testnet, mainnet]
 *     responses:
 *       200:
 *         description: Wallet balance details
 *       400:
 *         description: Invalid address
 */
router.get('/wallet/:address/balance', validateAddressParam, monitoringController.getWalletBalance);

/**
 * @openapi
 * /api/monitoring/wallet/{address}/transactions:
 *   get:
 *     summary: Get wallet transaction history with pagination and status/direction filters
 *     tags: [Monitoring]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [INCOMING, OUTGOING]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED]
 *     responses:
 *       200:
 *         description: Transaction history
 */
router.get('/wallet/:address/transactions', validateAddressParam, monitoringController.getWalletTransactions);

/**
 * @openapi
 * /api/monitoring/transactions:
 *   get:
 *     summary: Get all monitored transactions across all wallets
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: walletId
 *         schema:
 *           type: string
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [INCOMING, OUTGOING]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED]
 *     responses:
 *       200:
 *         description: All monitored transactions
 */
router.get('/transactions', monitoringController.getAllTransactions);

/**
 * @openapi
 * /api/monitoring/transactions/{txid}:
 *   get:
 *     summary: Get transaction details from database and live blockchain data
 *     tags: [Monitoring]
 *     parameters:
 *       - in: path
 *         name: txid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [testnet, mainnet]
 *     responses:
 *       200:
 *         description: Monitored transaction details
 *       400:
 *         description: Invalid txid
 *       404:
 *         description: Transaction not found
 */
router.get('/transactions/:txid', validateTxidParam, monitoringController.getTransactionDetails);

/**
 * @openapi
 * /api/monitoring/sync:
 *   post:
 *     summary: Manually trigger an immediate monitoring cycle across all active wallets
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Sync execution summary
 */
router.post('/sync', monitoringController.triggerSync);

module.exports = router;
