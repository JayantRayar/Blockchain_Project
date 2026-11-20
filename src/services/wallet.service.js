const prisma = require('../config/prisma');
const config = require('../config/env');
const { isValidBitcoinAddress, getAddressNetwork } = require('../utils/bitcoinValidator');
const logger = require('../utils/logger');

class WalletService {
  /**
   * Register a new Bitcoin wallet
   */
  async registerWallet({ address, network }) {
    const trimmedAddress = address ? address.trim() : '';
    const targetNetwork = network ? network.toLowerCase().trim() : (getAddressNetwork(trimmedAddress) || config.bitcoinNetwork);

    // Validate Bitcoin address
    if (!isValidBitcoinAddress(trimmedAddress, targetNetwork)) {
      const error = new Error(`Invalid Bitcoin ${targetNetwork} address: ${trimmedAddress}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if wallet already registered on this network
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        address_network: {
          address: trimmedAddress,
          network: targetNetwork
        }
      }
    });

    if (existingWallet) {
      const error = new Error(`Wallet ${trimmedAddress} is already registered on ${targetNetwork}`);
      error.statusCode = 409;
      throw error;
    }

    const wallet = await prisma.wallet.create({
      data: {
        address: trimmedAddress,
        network: targetNetwork,
        isActive: true
      }
    });

    logger.info(`Registered wallet ${wallet.address} [${wallet.network}] (ID: ${wallet.id})`);
    return wallet;
  }

  /**
   * List wallets with filtering and pagination
   */
  async getWallets({ page = 1, limit = 10, isActive, network }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    } else if (isActive === 'true' || isActive === 'false') {
      where.isActive = isActive === 'true';
    }

    if (network) {
      where.network = network.toLowerCase().trim();
    }

    const [wallets, totalCount] = await Promise.all([
      prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      }),
      prisma.wallet.count({ where })
    ]);

    const formattedWallets = wallets.map(wallet => ({
      ...wallet,
      transactionCount: wallet._count.transactions,
      _count: undefined
    }));

    return {
      wallets: formattedWallets,
      totalCount,
      page,
      limit
    };
  }

  /**
   * Get wallet details by ID
   */
  async getWalletById(id) {
    const wallet = await prisma.wallet.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!wallet) {
      const error = new Error(`Wallet not found with ID: ${id}`);
      error.statusCode = 404;
      throw error;
    }

    return {
      ...wallet,
      transactionCount: wallet._count.transactions,
      _count: undefined
    };
  }

  /**
   * Get wallet by address and optional network
   */
  async getWalletByAddress(address, network = null) {
    const targetNetwork = network ? network.toLowerCase().trim() : config.bitcoinNetwork;
    return prisma.wallet.findFirst({
      where: {
        address: address.trim(),
        ...(network ? { network: targetNetwork } : {})
      }
    });
  }

  /**
   * Delete wallet by ID
   */
  async deleteWallet(id) {
    // Check existence first
    const wallet = await prisma.wallet.findUnique({
      where: { id }
    });

    if (!wallet) {
      const error = new Error(`Wallet not found with ID: ${id}`);
      error.statusCode = 404;
      throw error;
    }

    await prisma.wallet.delete({
      where: { id }
    });

    logger.info(`Deleted wallet ${wallet.address} (ID: ${id})`);
    return wallet;
  }

  /**
   * Activate / Deactivate wallet monitoring
   */
  async updateWalletStatus(id, isActive) {
    const wallet = await prisma.wallet.findUnique({
      where: { id }
    });

    if (!wallet) {
      const error = new Error(`Wallet not found with ID: ${id}`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.wallet.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    logger.info(`Updated wallet ${updated.address} monitoring status to: ${updated.isActive}`);
    return updated;
  }

  /**
   * Get all active wallets for monitoring
   */
  async getActiveWallets() {
    return prisma.wallet.findMany({
      where: { isActive: true }
    });
  }
}

module.exports = new WalletService();
