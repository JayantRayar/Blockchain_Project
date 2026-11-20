const logger = require('../utils/logger');
const { error } = require('../utils/responseFormatter');

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.originalUrl} - Error: ${err.message}`, err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Handle Prisma Specific Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'fields';
        message = `Unique constraint violation. A record with this ${target} already exists.`;
        break;
      case 'P2025':
        statusCode = 404;
        message = err.meta?.cause || 'Requested record was not found.';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed on the field.';
        break;
      case 'P1001':
      case 'P1002':
        statusCode = 503;
        message = 'Cannot reach database server. Please check your PostgreSQL connection string.';
        break;
      default:
        if (err.code.startsWith('P')) {
          message = `Database operation error: ${err.code}`;
        }
    }
  }

  // Handle JSON Syntax Errors in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }

  // Handle Axios / Blockstream Network Errors
  if (err.isAxiosError) {
    if (err.response) {
      statusCode = err.response.status;
      message = typeof err.response.data === 'string'
        ? err.response.data
        : `Blockstream API responded with status ${err.response.status}`;
    } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      statusCode = 504;
      message = 'External blockchain API request timed out.';
    } else {
      statusCode = 502;
      message = 'Failed to connect to external blockchain service.';
    }
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    details = err.stack;
  }

  return error(res, message, statusCode, details);
};

module.exports = errorHandler;
