const walletService = require('../services/wallet.service');
const monitoringService = require('../services/monitoring.service');
const { success, paginated } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

class WalletController {
  /**
   * Register a new wallet
   * POST /api/wallets
   */
  async registerWallet(req, res, next) {
    try {
      const { address, network } = req.body;
      const wallet = await walletService.registerWallet({ address, network });

      // Trigger asynchronous background initial sync
      monitoringService.syncWalletTransactions(wallet).catch(err => {
        logger.warn(`Initial sync for wallet ${wallet.address} scheduled/pending: ${err.message}`);
      });

      return success(res, wallet, 'Wallet registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List wallets with pagination and filtering
   * GET /api/wallets
   */
  async listWallets(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
      const { isActive, network } = req.query;

      const result = await walletService.getWallets({ page, limit, isActive, network });
      return paginated(res, result.wallets, {
        page: result.page,
        limit: result.limit,
        totalCount: result.totalCount
      }, 'Wallets retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get wallet details by ID
   * GET /api/wallets/:id
   */
  async getWalletById(req, res, next) {
    try {
      const { id } = req.params;
      const wallet = await walletService.getWalletById(id);
      return success(res, wallet, 'Wallet details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete wallet by ID
   * DELETE /api/wallets/:id
   */
  async deleteWallet(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await walletService.deleteWallet(id);
      return success(res, deleted, 'Wallet deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update wallet monitoring status (activate / deactivate)
   * PATCH /api/wallets/:id/status
   */
  async updateWalletStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        const error = new Error('Field "isActive" must be a boolean (true or false)');
        error.statusCode = 400;
        throw error;
      }

      const updated = await walletService.updateWalletStatus(id, isActive);
      const statusText = isActive ? 'activated' : 'deactivated';
      return success(res, updated, `Wallet monitoring ${statusText} successfully`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WalletController();
