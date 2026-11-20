const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = '') => {
    console.log(`[${formatTimestamp()}] [INFO] ${message}`, meta ? meta : '');
  },
  warn: (message, meta = '') => {
    console.warn(`[${formatTimestamp()}] [WARN] ${message}`, meta ? meta : '');
  },
  error: (message, error = '') => {
    console.error(`[${formatTimestamp()}] [ERROR] ${message}`, error ? error : '');
  },
  debug: (message, meta = '') => {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, meta ? meta : '');
    }
  }
};

module.exports = logger;
