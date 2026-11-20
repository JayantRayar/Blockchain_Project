const blockstreamService = require('../services/blockstream.service');
const config = require('../config/env');
const { success } = require('../utils/responseFormatter');
const { isValidTxid } = require('../utils/bitcoinValidator');
const { satoshisToBtc } = require('../utils/responseFormatter');

class BlockchainController {
  /**
   * Get current blockchain status and block tip height
   * GET /api/blockchain/status
   */
  async getStatus(req, res, next) {
    try {
      const network = req.query.network || config.bitcoinNetwork;
      const height = await blockstreamService.getCurrentBlockHeight(network);

      return success(res, {
        network,
        currentBlockHeight: height,
        apiUrl: blockstreamService.getBaseUrl(network),
        timestamp: new Date().toISOString()
      }, 'Current blockchain status retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get transaction details directly from the blockchain
   * GET /api/blockchain/transactions/:txid
   */
  async getTransaction(req, res, next) {
    try {
      const { txid } = req.params;
      const network = req.query.network || config.bitcoinNetwork;

      if (!isValidTxid(txid)) {
        const error = new Error(`Invalid Bitcoin transaction ID (txid): ${txid}`);
        error.statusCode = 400;
        throw error;
      }

      const [tx, currentBlockHeight] = await Promise.all([
        blockstreamService.getTransaction(txid, network),
        blockstreamService.getCurrentBlockHeight(network)
      ]);

      const confirmations = tx.status && tx.status.confirmed && tx.status.block_height
        ? Math.max(1, currentBlockHeight - tx.status.block_height + 1)
        : 0;

      const responseData = {
        txid: tx.txid,
        network,
        currentBlockHeight,
        confirmations,
        isConfirmed: Boolean(tx.status && tx.status.confirmed),
        blockHeight: tx.status ? tx.status.block_height : null,
        blockHash: tx.status ? tx.status.block_hash : null,
        blockTime: tx.status && tx.status.block_time ? new Date(tx.status.block_time * 1000) : null,
        feeSatoshis: tx.fee,
        feeBtc: satoshisToBtc(tx.fee),
        size: tx.size,
        weight: tx.weight,
        vinCount: tx.vin ? tx.vin.length : 0,
        voutCount: tx.vout ? tx.vout.length : 0,
        inputs: tx.vin,
        outputs: tx.vout
      };

      return success(res, responseData, 'Transaction details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BlockchainController();
