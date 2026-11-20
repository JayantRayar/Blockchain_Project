/**
 * Bitcoin Address & Transaction Hash Validation Utility
 */

// Regex patterns for Bitcoin addresses
const MAINNET_LEGACY_P2PKH = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/;
const MAINNET_SCRIPT_P2SH = /^3[1-9A-HJ-NP-Za-km-z]{25,34}$/;
const MAINNET_SEGWIT_BECH32 = /^bc1[ac-hj-np-z02-9]{11,71}$/i;

const TESTNET_LEGACY_P2PKH = /^[mn][1-9A-HJ-NP-Za-km-z]{25,34}$/;
const TESTNET_SCRIPT_P2SH = /^2[1-9A-HJ-NP-Za-km-z]{25,34}$/;
const TESTNET_SEGWIT_BECH32 = /^tb1[ac-hj-np-z02-9]{11,71}$/i;

const TXID_REGEX = /^[a-fA-F0-9]{64}$/;

/**
 * Identify network of a Bitcoin address
 * @param {string} address
 * @returns {'mainnet' | 'testnet' | null}
 */
const getAddressNetwork = (address) => {
  if (typeof address !== 'string') return null;
  const trimmed = address.trim();

  if (MAINNET_LEGACY_P2PKH.test(trimmed) || MAINNET_SCRIPT_P2SH.test(trimmed) || MAINNET_SEGWIT_BECH32.test(trimmed)) {
    return 'mainnet';
  }
  if (TESTNET_LEGACY_P2PKH.test(trimmed) || TESTNET_SCRIPT_P2SH.test(trimmed) || TESTNET_SEGWIT_BECH32.test(trimmed)) {
    return 'testnet';
  }
  return null;
};

/**
 * Validate Bitcoin address for a specified network or any valid network
 * @param {string} address
 * @param {string} [expectedNetwork] - 'mainnet' or 'testnet'
 * @returns {boolean}
 */
const isValidBitcoinAddress = (address, expectedNetwork = null) => {
  if (typeof address !== 'string' || !address.trim()) return false;
  const trimmed = address.trim();
  const detectedNetwork = getAddressNetwork(trimmed);

  if (!detectedNetwork) return false;
  if (expectedNetwork && detectedNetwork !== expectedNetwork.toLowerCase()) {
    return false;
  }
  return true;
};

/**
 * Validate Bitcoin Transaction ID (txid)
 * @param {string} txid
 * @returns {boolean}
 */
const isValidTxid = (txid) => {
  if (typeof txid !== 'string') return false;
  return TXID_REGEX.test(txid.trim());
};

module.exports = {
  isValidBitcoinAddress,
  getAddressNetwork,
  isValidTxid
};
