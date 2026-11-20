const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchain.controller');
const { validateTxidParam } = require('../middleware/validator');

/**
 * @openapi
 * /api/blockchain/status:
 *   get:
 *     summary: Get current blockchain block height and network info
 *     tags: [Blockchain]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [testnet, mainnet]
 *     responses:
 *       200:
 *         description: Current blockchain tip height
 */
router.get('/status', blockchainController.getStatus);

/**
 * @openapi
 * /api/blockchain/transactions/{txid}:
 *   get:
 *     summary: Get detailed transaction info directly from the blockchain
 *     tags: [Blockchain]
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
 *         description: Detailed blockchain transaction info
 *       400:
 *         description: Invalid txid
 *       404:
 *         description: Transaction not found on blockchain
 */
router.get('/transactions/:txid', validateTxidParam, blockchainController.getTransaction);

module.exports = router;
