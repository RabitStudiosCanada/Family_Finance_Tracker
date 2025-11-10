const createError = require('http-errors');

const config = require('../config');

const notFoundHandler = (req, _res, next) => {
  next(createError(404, `Route ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;
  const shouldExposeMessage = err.expose ?? statusCode < 500;

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const payload = {
    status: 'error',
    message: shouldExposeMessage ? err.message : 'Internal server error',
  };

  if (err.details && Array.isArray(err.details)) {
    payload.details = err.details;
  }

  if (!config.isProduction && err.stack) {
    payload.trace = err.stack.split('\n');
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
