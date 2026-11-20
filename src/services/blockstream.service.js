const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

class BlockstreamService {
  constructor() {
    this.defaultBaseUrl = config.blockstreamApiUrl;
    this.defaultNetwork = config.bitcoinNetwork;
  }

  /**
   * Determine base URL for a given network
   */
  getBaseUrl(network = this.defaultNetwork) {
    if (network === 'mainnet') {
      return 'https://blockstream.info/api';
    }
    return 'https://blockstream.info/testnet/api';
  }

  /**
   * Create configured Axios instance
   */
  getClient(network) {
    const baseURL = this.getBaseUrl(network);
    return axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Handle Axios error and return standardized error
   */
  handleError(err, context = '') {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      logger.error(`Blockstream API Error [${status}] on ${context}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      
      const message = typeof data === 'string' && data.trim().length > 0 && data.length < 200 
        ? `Blockstream API error (${status}): ${data.trim()}`
        : `Blockstream API request failed with status ${status}`;

      const errorObj = new Error(message);
      errorObj.statusCode = status;
      throw errorObj;
    } else if (err.request) {
      logger.error(`Blockstream API No Response on ${context}: ${err.message}`);
      const errorObj = new Error('Blockstream API service unreachable or timed out');
      errorObj.statusCode = 504;
      throw errorObj;
    } else {
      logger.error(`Blockstream API Setup Error on ${context}: ${err.message}`);
      const errorObj = new Error(err.message || 'Blockstream API request configuration error');
      errorObj.statusCode = 500;
      throw errorObj;
    }
  }

  /**
   * Get the current blockchain tip block height
   * Endpoint: GET /blocks/tip/height
   */
  async getCurrentBlockHeight(network) {
    try {
      const client = this.getClient(network);
      const response = await client.get('/blocks/tip/height');
      const height = parseInt(response.data, 10);
      return height;
    } catch (err) {
      this.handleError(err, 'getCurrentBlockHeight');
    }
  }

  /**
   * Get basic address stats (chain_stats, mempool_stats)
   * Endpoint: GET /address/:address
   */
  async getAddressInfo(address, network) {
    try {
      const client = this.getClient(network);
      const response = await client.get(`/address/${address}`);
      return response.data;
    } catch (err) {
      this.handleError(err, `getAddressInfo(${address})`);
    }
  }

  /**
   * Get recent transactions for an address
   * Endpoint: GET /address/:address/txs
   */
  async getAddressTransactions(address, network) {
    try {
      const client = this.getClient(network);
      const response = await client.get(`/address/${address}/txs`);
      return response.data;
    } catch (err) {
      this.handleError(err, `getAddressTransactions(${address})`);
    }
  }

  /**
   * Get UTXOs for an address
   * Endpoint: GET /address/:address/utxo
   */
  async getAddressUtxos(address, network) {
    try {
      const client = this.getClient(network);
      const response = await client.get(`/address/${address}/utxo`);
      return response.data;
    } catch (err) {
      this.handleError(err, `getAddressUtxos(${address})`);
    }
  }

  /**
   * Get full details of a specific transaction
   * Endpoint: GET /tx/:txid
   */
  async getTransaction(txid, network) {
    try {
      const client = this.getClient(network);
      const response = await client.get(`/tx/${txid}`);
      return response.data;
    } catch (err) {
      this.handleError(err, `getTransaction(${txid})`);
    }
  }
}

module.exports = new BlockstreamService();
