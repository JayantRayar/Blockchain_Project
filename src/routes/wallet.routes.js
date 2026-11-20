const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { validateRegisterWallet } = require('../middleware/validator');

/**
 * @openapi
 * /api/wallets:
 *   post:
 *     summary: Register a new Bitcoin wallet address
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 example: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
 *               network:
 *                 type: string
 *                 enum: [testnet, mainnet]
 *                 default: testnet
 *     responses:
 *       201:
 *         description: Wallet registered successfully
 *       400:
 *         description: Invalid Bitcoin address or bad request
 *       409:
 *         description: Wallet already registered on network
 */
router.post('/', validateRegisterWallet, walletController.registerWallet);

/**
 * @openapi
 * /api/wallets:
 *   get:
 *     summary: List all registered wallets with pagination and filters
 *     tags: [Wallets]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [testnet, mainnet]
 *     responses:
 *       200:
 *         description: List of registered wallets
 */
router.get('/', walletController.listWallets);

/**
 * @openapi
 * /api/wallets/{id}:
 *   get:
 *     summary: Get wallet details and recent transactions
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet details
 *       404:
 *         description: Wallet not found
 */
router.get('/:id', walletController.getWalletById);

/**
 * @openapi
 * /api/wallets/{id}:
 *   delete:
 *     summary: Delete a wallet and its monitored transactions
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *       404:
 *         description: Wallet not found
 */
router.delete('/:id', walletController.deleteWallet);

/**
 * @openapi
 * /api/wallets/{id}/status:
 *   patch:
 *     summary: Activate or deactivate monitoring for a wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Wallet status updated
 *       400:
 *         description: Invalid body
 *       404:
 *         description: Wallet not found
 */
router.patch('/:id/status', walletController.updateWalletStatus);

module.exports = router;
