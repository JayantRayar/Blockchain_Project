/**
 * Helper to convert satoshis to BTC
 * 1 BTC = 100,000,000 satoshis
 */
const satoshisToBtc = (satoshis) => {
  if (satoshis === null || satoshis === undefined) return 0;
  const sats = typeof satoshis === 'bigint' ? Number(satoshis) : Number(satoshis);
  return Number((sats / 100000000).toFixed(8));
};

/**
 * Format a single transaction object for API response
 */
const formatTransaction = (tx) => {
  if (!tx) return null;
  const amountSats = typeof tx.amountSatoshis === 'bigint' 
    ? tx.amountSatoshis.toString() 
    : String(tx.amountSatoshis || 0);
  const feeSats = tx.feeSatoshis !== null && tx.feeSatoshis !== undefined
    ? (typeof tx.feeSatoshis === 'bigint' ? tx.feeSatoshis.toString() : String(tx.feeSatoshis))
    : null;

  return {
    ...tx,
    amountSatoshis: amountSats,
    amountBtc: satoshisToBtc(amountSats),
    feeSatoshis: feeSats,
    feeBtc: feeSats !== null ? satoshisToBtc(feeSats) : null
  };
};

/**
 * Format standard success response
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Format paginated response
 */
const paginated = (res, items, pagination, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount: pagination.totalCount,
      totalPages: Math.ceil(pagination.totalCount / pagination.limit) || 1,
      hasNextPage: pagination.page < Math.ceil(pagination.totalCount / pagination.limit),
      hasPrevPage: pagination.page > 1
    }
  });
};

/**
 * Format error response
 */
const error = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  satoshisToBtc,
  formatTransaction,
  success,
  paginated,
  error
};
