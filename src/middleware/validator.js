const { isValidBitcoinAddress, isValidTxid } = require('../utils/bitcoinValidator');
const { error } = require('../utils/responseFormatter');

/**
 * Validate wallet registration request body
 */
const validateRegisterWallet = (req, res, next) => {
  const { address, network } = req.body;

  if (!address || typeof address !== 'string' || !address.trim()) {
    return error(res, 'Field "address" is required and must be a valid Bitcoin address string.', 400);
  }

  const validNetworks = ['mainnet', 'testnet'];
  if (network && !validNetworks.includes(network.toLowerCase().trim())) {
    return error(res, 'Field "network" must be either "mainnet" or "testnet".', 400);
  }

  const targetNetwork = network ? network.toLowerCase().trim() : null;
  if (!isValidBitcoinAddress(address.trim(), targetNetwork)) {
    return error(res, `Address "${address.trim()}" is not a valid Bitcoin address${targetNetwork ? ` for network "${targetNetwork}"` : ''}.`, 400);
  }

  req.body.address = address.trim();
  if (network) req.body.network = network.toLowerCase().trim();
  next();
};

/**
 * Validate address in route params
 */
const validateAddressParam = (req, res, next) => {
  const { address } = req.params;

  if (!address || !isValidBitcoinAddress(address)) {
    return error(res, `Invalid Bitcoin address parameter: "${address}".`, 400);
  }

  next();
};

/**
 * Validate txid in route params
 */
const validateTxidParam = (req, res, next) => {
  const { txid } = req.params;

  if (!txid || !isValidTxid(txid)) {
    return error(res, `Invalid Bitcoin transaction hash (txid): "${txid}". Must be a 64-character hex string.`, 400);
  }

  next();
};

module.exports = {
  validateRegisterWallet,
  validateAddressParam,
  validateTxidParam
};
