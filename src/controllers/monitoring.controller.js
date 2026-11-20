const monitoringService = require('../services/monitoring.service');
const { success, paginated } = require('../utils/responseFormatter');
const { isValidBitcoinAddress, isValidTxid } = require('../utils/bitcoinValidator');

class MonitoringController {
  /**
   * Get wallet information (monitoring status, balance summary, block height)
   * GET /api/monitoring/wallet/:address
   */
  async getWalletInfo(req, res, next) {
    try {
      const { address } = req.params;
      const network = req.query.network || null;

      if (!isValidBitcoinAddress(address)) {
        const error = new Error(`Invalid Bitcoin address: ${address}`);
        error.statusCode = 400;
        throw error;
      }

      const info = await monitoringService.getWalletInformation(address, network);
      return success(res, info, 'Wallet information retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get live wallet balance (confirmed, unconfirmed, total in sats and BTC)
   * GET /api/monitoring/wallet/:address/balance
   */
  async getWalletBalance(req, res, next) {
    try {
      const { address } = req.params;
      const network = req.query.network || null;

      if (!isValidBitcoinAddress(address)) {
        const error = new Error(`Invalid Bitcoin address: ${address}`);
        error.statusCode = 400;
        throw error;
      }

      const balance = await monitoringService.getWalletBalance(address, network);
      return success(res, balance, 'Wallet balance retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get wallet transaction history
   * GET /api/monitoring/wallet/:address/transactions
   */
  async getWalletTransactions(req, res, next) {
    try {
      const { address } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
      const { direction, status, network } = req.query;

      if (!isValidBitcoinAddress(address)) {
        const error = new Error(`Invalid Bitcoin address: ${address}`);
        error.statusCode = 400;
        throw error;
      }

      const result = await monitoringService.getWalletTransactions(address, {
        page,
        limit,
        direction,
        status,
        network
      });

      return paginated(res, result.transactions, {
        page: result.page,
        limit: result.limit,
        totalCount: result.totalCount
      }, 'Wallet transactions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all monitored transactions across wallets
   * GET /api/monitoring/transactions
   */
  async getAllTransactions(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
      const { walletId, direction, status, txid } = req.query;

      const result = await monitoringService.getAllMonitoredTransactions({
        page,
        limit,
        walletId,
        direction,
        status,
        txid
      });

      return paginated(res, result.transactions, {
        page: result.page,
        limit: result.limit,
        totalCount: result.totalCount
      }, 'Monitored transactions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get transaction details by txid
   * GET /api/monitoring/transactions/:txid
   */
  async getTransactionDetails(req, res, next) {
    try {
      const { txid } = req.params;
      const network = req.query.network || null;

      if (!isValidTxid(txid)) {
        const error = new Error(`Invalid Bitcoin transaction ID (txid): ${txid}`);
        error.statusCode = 400;
        throw error;
      }

      const details = await monitoringService.getTransactionDetails(txid, network);
      return success(res, details, 'Transaction details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually trigger monitoring sync
   * POST /api/monitoring/sync
   */
  async triggerSync(req, res, next) {
    try {
      const syncResults = await monitoringService.syncAllActiveWallets();
      return success(res, syncResults, 'Monitoring sync completed');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MonitoringController();
