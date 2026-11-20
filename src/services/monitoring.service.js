const prisma = require('../config/prisma');
const blockstreamService = require('./blockstream.service');
const walletService = require('./wallet.service');
const { satoshisToBtc, formatTransaction } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const config = require('../config/env');

class MonitoringService {
  /**
   * Parse UTXOs of a transaction to determine direction, amount, and fee relative to a wallet address.
   * 
   * UTXO Model Analysis:
   * 1. Check all inputs (vin): sum satoshis where prevout address matches the wallet address.
   * 2. Check all outputs (vout): sum satoshis where output address matches the wallet address.
   * 3. Account for change outputs: If wallet sent inputs and also received change back to the same address,
   *    the actual outgoing amount is (inputs_spent - change_received).
   */
  parseTransactionUtxo(tx, walletAddress) {
    let totalInputsFromWallet = 0n;
    let totalOutputsToWallet = 0n;

    // 1. Inspect inputs (vin)
    if (Array.isArray(tx.vin)) {
      for (const input of tx.vin) {
        if (input.prevout && input.prevout.scriptpubkey_address === walletAddress) {
          totalInputsFromWallet += BigInt(input.prevout.value || 0);
        }
      }
    }

    // 2. Inspect outputs (vout)
    if (Array.isArray(tx.vout)) {
      for (const output of tx.vout) {
        if (output.scriptpubkey_address === walletAddress) {
          totalOutputsToWallet += BigInt(output.value || 0);
        }
      }
    }

    let direction = 'INCOMING';
    let amountSatoshis = 0n;

    if (totalInputsFromWallet > 0n) {
      // The wallet address is an input sender
      if (totalInputsFromWallet >= totalOutputsToWallet) {
        // Net outgoing (amount spent minus change returned to this same address)
        direction = 'OUTGOING';
        amountSatoshis = totalInputsFromWallet - totalOutputsToWallet;
      } else {
        // Multi-party input where wallet received more than it contributed
        direction = 'INCOMING';
        amountSatoshis = totalOutputsToWallet - totalInputsFromWallet;
      }
    } else {
      // Wallet only received funds
      direction = 'INCOMING';
      amountSatoshis = totalOutputsToWallet;
    }

    // Fee in satoshis (Blockstream provides fee in tx object)
    let feeSatoshis = null;
    if (tx.fee !== undefined && tx.fee !== null) {
      feeSatoshis = BigInt(tx.fee);
    }

    return {
      direction,
      amountSatoshis,
      feeSatoshis,
      totalInputsFromWallet,
      totalOutputsToWallet
    };
  }

  /**
   * Calculate confirmations based on current tip height and transaction block height
   * Formula: confirmations = currentBlockHeight - transactionBlockHeight + 1
   */
  calculateConfirmations(currentBlockHeight, txStatus) {
    if (!txStatus || !txStatus.confirmed || !txStatus.block_height) {
      return {
        confirmations: 0,
        status: 'PENDING',
        blockHeight: null,
        transactionTimestamp: null
      };
    }

    const txBlockHeight = txStatus.block_height;
    const confirmations = Math.max(1, (currentBlockHeight - txBlockHeight + 1));
    const timestamp = txStatus.block_time ? new Date(txStatus.block_time * 1000) : new Date();

    return {
      confirmations,
      status: 'CONFIRMED',
      blockHeight: txBlockHeight,
      transactionTimestamp: timestamp
    };
  }

  /**
   * Sync transactions for a specific registered wallet from Blockstream
   */
  async syncWalletTransactions(wallet) {
    try {
      const address = wallet.address;
      const network = wallet.network;

      // 1. Fetch current tip height & recent transactions
      const [currentBlockHeight, rawTxs] = await Promise.all([
        blockstreamService.getCurrentBlockHeight(network),
        blockstreamService.getAddressTransactions(address, network)
      ]);

      if (!Array.isArray(rawTxs)) {
        logger.warn(`No transaction array returned for wallet ${address}`);
        return { added: 0, updated: 0, total: 0 };
      }

      let added = 0;
      let updated = 0;

      for (const tx of rawTxs) {
        const utxoAnalysis = this.parseTransactionUtxo(tx, address);
        const confirmationData = this.calculateConfirmations(currentBlockHeight, tx.status);

        // Check if transaction already exists for this wallet
        const existingTx = await prisma.transaction.findUnique({
          where: {
            wallet_txid: {
              walletId: wallet.id,
              txid: tx.txid
            }
          }
        });

        if (existingTx) {
          // Update confirmation count and status
          await prisma.transaction.update({
            where: { id: existingTx.id },
            data: {
              confirmations: confirmationData.confirmations,
              status: confirmationData.status,
              blockHeight: confirmationData.blockHeight,
              transactionTimestamp: confirmationData.transactionTimestamp || existingTx.transactionTimestamp
            }
          });
          updated++;
        } else {
          // Create new transaction record
          await prisma.transaction.create({
            data: {
              txid: tx.txid,
              walletId: wallet.id,
              direction: utxoAnalysis.direction,
              amountSatoshis: utxoAnalysis.amountSatoshis,
              confirmations: confirmationData.confirmations,
              blockHeight: confirmationData.blockHeight,
              status: confirmationData.status,
              feeSatoshis: utxoAnalysis.feeSatoshis,
              transactionTimestamp: confirmationData.transactionTimestamp
            }
          });
          added++;
        }
      }

      logger.info(`Synced wallet ${address}: ${added} added, ${updated} updated out of ${rawTxs.length} txs`);
      return { added, updated, total: rawTxs.length };
    } catch (err) {
      logger.error(`Error syncing wallet ${wallet.address}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Sync all active wallets (invoked by cron job)
   */
  async syncAllActiveWallets() {
    const activeWallets = await walletService.getActiveWallets();
    logger.info(`Starting sync cycle for ${activeWallets.length} active wallet(s)...`);

    const results = [];
    for (const wallet of activeWallets) {
      try {
        const result = await this.syncWalletTransactions(wallet);
        results.push({ wallet: wallet.address, success: true, ...result });
      } catch (err) {
        logger.error(`Failed to sync active wallet ${wallet.address}: ${err.message}`);
        results.push({ wallet: wallet.address, success: false, error: err.message });
      }
    }

    return results;
  }

  /**
   * Get live wallet balance (confirmed, unconfirmed, total)
   */
  async getWalletBalance(address, network = null) {
    const targetNetwork = network || config.bitcoinNetwork;
    const addressInfo = await blockstreamService.getAddressInfo(address, targetNetwork);

    const chainStats = addressInfo.chain_stats || {};
    const mempoolStats = addressInfo.mempool_stats || {};

    const fundedSats = BigInt(chainStats.funded_txo_sum || 0);
    const spentSats = BigInt(chainStats.spent_txo_sum || 0);
    const confirmedSatoshis = fundedSats - spentSats;

    const mempoolFundedSats = BigInt(mempoolStats.funded_txo_sum || 0);
    const mempoolSpentSats = BigInt(mempoolStats.spent_txo_sum || 0);
    const unconfirmedSatoshis = mempoolFundedSats - mempoolSpentSats;

    const totalSatoshis = confirmedSatoshis + unconfirmedSatoshis;

    return {
      address,
      network: targetNetwork,
      confirmed: {
        satoshis: confirmedSatoshis.toString(),
        btc: satoshisToBtc(confirmedSatoshis),
        txCount: chainStats.tx_count || 0
      },
      unconfirmed: {
        satoshis: unconfirmedSatoshis.toString(),
        btc: satoshisToBtc(unconfirmedSatoshis),
        txCount: mempoolStats.tx_count || 0
      },
      total: {
        satoshis: totalSatoshis.toString(),
        btc: satoshisToBtc(totalSatoshis),
        txCount: (chainStats.tx_count || 0) + (mempoolStats.tx_count || 0)
      }
    };
  }

  /**
   * Get wallet live information and DB monitoring status
   */
  async getWalletInformation(address, network = null) {
    const targetNetwork = network || config.bitcoinNetwork;
    
    // Check if wallet is registered in our database
    const dbWallet = await walletService.getWalletByAddress(address, targetNetwork);

    // Fetch live data from Blockstream
    const [balanceData, currentBlockHeight] = await Promise.all([
      this.getWalletBalance(address, targetNetwork),
      blockstreamService.getCurrentBlockHeight(targetNetwork).catch(() => null)
    ]);

    return {
      address,
      network: targetNetwork,
      isMonitored: Boolean(dbWallet),
      monitoringActive: dbWallet ? dbWallet.isActive : false,
      walletId: dbWallet ? dbWallet.id : null,
      currentBlockHeight,
      balance: balanceData,
      createdAt: dbWallet ? dbWallet.createdAt : null,
      updatedAt: dbWallet ? dbWallet.updatedAt : null
    };
  }

  /**
   * Get transactions for a wallet with filtering and pagination
   */
  async getWalletTransactions(address, { page = 1, limit = 10, direction, status, network = null }) {
    const targetNetwork = network || config.bitcoinNetwork;
    const wallet = await walletService.getWalletByAddress(address, targetNetwork);

    if (!wallet) {
      // If wallet is not registered in DB, fetch live transactions from Blockstream
      const [liveTxs, tipHeight] = await Promise.all([
        blockstreamService.getAddressTransactions(address, targetNetwork),
        blockstreamService.getCurrentBlockHeight(targetNetwork).catch(() => 0)
      ]);

      const formatted = liveTxs.map(tx => {
        const utxo = this.parseTransactionUtxo(tx, address);
        const conf = this.calculateConfirmations(tipHeight, tx.status);
        return formatTransaction({
          txid: tx.txid,
          walletAddress: address,
          direction: utxo.direction,
          amountSatoshis: utxo.amountSatoshis,
          confirmations: conf.confirmations,
          blockHeight: conf.blockHeight,
          status: conf.status,
          feeSatoshis: utxo.feeSatoshis,
          transactionTimestamp: conf.transactionTimestamp
        });
      });

      return {
        isMonitored: false,
        transactions: formatted.slice((page - 1) * limit, page * limit),
        totalCount: formatted.length,
        page,
        limit
      };
    }

    const skip = (page - 1) * limit;
    const where = { walletId: wallet.id };

    if (direction) {
      where.direction = direction.toUpperCase();
    }
    if (status) {
      where.status = status.toUpperCase();
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { blockHeight: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      isMonitored: true,
      walletId: wallet.id,
      transactions: transactions.map(formatTransaction),
      totalCount,
      page,
      limit
    };
  }

  /**
   * Get all monitored transactions across wallets
   */
  async getAllMonitoredTransactions({ page = 1, limit = 10, walletId, direction, status, txid }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (walletId) where.walletId = walletId;
    if (direction) where.direction = direction.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (txid) where.txid = txid;

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ],
        include: {
          wallet: {
            select: {
              address: true,
              network: true,
              isActive: true
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions: transactions.map(formatTransaction),
      totalCount,
      page,
      limit
    };
  }

  /**
   * Get transaction details by txid
   */
  async getTransactionDetails(txid, network = null) {
    const targetNetwork = network || config.bitcoinNetwork;

    // Check DB first
    const dbTransactions = await prisma.transaction.findMany({
      where: { txid },
      include: {
        wallet: true
      }
    });

    // Fetch live on-chain data from Blockstream
    let liveTx = null;
    let currentBlockHeight = null;
    try {
      [liveTx, currentBlockHeight] = await Promise.all([
        blockstreamService.getTransaction(txid, targetNetwork),
        blockstreamService.getCurrentBlockHeight(targetNetwork)
      ]);
    } catch (err) {
      logger.warn(`Could not fetch live tx ${txid} from Blockstream: ${err.message}`);
    }

    if (!dbTransactions.length && !liveTx) {
      const error = new Error(`Transaction ${txid} not found`);
      error.statusCode = 404;
      throw error;
    }

    return {
      txid,
      network: targetNetwork,
      currentBlockHeight,
      dbRecords: dbTransactions.map(formatTransaction),
      liveData: liveTx ? {
        version: liveTx.version,
        size: liveTx.size,
        weight: liveTx.weight,
        fee: liveTx.fee,
        feeBtc: satoshisToBtc(liveTx.fee),
        status: liveTx.status,
        vin: liveTx.vin,
        vout: liveTx.vout
      } : null
    };
  }
}

module.exports = new MonitoringService();
