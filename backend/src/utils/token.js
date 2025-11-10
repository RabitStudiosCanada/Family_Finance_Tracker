const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, config.auth.jwt.accessSecret, {
    expiresIn: config.auth.jwt.accessExpiresIn,
    ...options,
  });

const signRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, config.auth.jwt.refreshSecret, {
    expiresIn: config.auth.jwt.refreshExpiresIn,
    ...options,
  });

const verifyAccessToken = (token) => jwt.verify(token, config.auth.jwt.accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, config.auth.jwt.refreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
