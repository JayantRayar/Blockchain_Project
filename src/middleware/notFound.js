const { error } = require('../utils/responseFormatter');

const notFound = (req, res, next) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = notFound;
