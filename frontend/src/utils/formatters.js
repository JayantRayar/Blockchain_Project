/**
 * Utility functions for Bitcoin and blockchain data formatting
 */

/**
 * Format Bitcoin amount to fixed decimal string
 * @param {number|string} btc 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatBtc = (btc, decimals = 8) => {
  if (btc === null || btc === undefined || isNaN(Number(btc))) return '0.00000000';
  return Number(btc).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: decimals
  });
};

/**
 * Format satoshis with comma separators
 * @param {number|string|bigint} sats 
 * @returns {string}
 */
export const formatSats = (sats) => {
  if (sats === null || sats === undefined || sats === '') return '0';
  const val = typeof sats === 'bigint' ? sats.toString() : String(sats);
  const num = parseInt(val, 10);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
};

/**
 * Truncate Bitcoin address for compact display
 * @param {string} address 
 * @param {number} startChars 
 * @param {number} endChars 
 * @returns {string}
 */
export const truncateAddress = (address, startChars = 6, endChars = 6) => {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Truncate Transaction Hash (txid)
 * @param {string} txid 
 * @param {number} startChars 
 * @param {number} endChars 
 * @returns {string}
 */
export const truncateTxid = (txid, startChars = 8, endChars = 8) => {
  if (!txid || typeof txid !== 'string') return '';
  if (txid.length <= startChars + endChars + 3) return txid;
  return `${txid.slice(0, startChars)}...${txid.slice(-endChars)}`;
};

/**
 * Format date string to readable localized date and time
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatTimestamp = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Relative time description (e.g. "5m ago")
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Pending';
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  } catch {
    return 'Recently';
  }
};

/**
 * Copy string to clipboard with fallback
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
};
