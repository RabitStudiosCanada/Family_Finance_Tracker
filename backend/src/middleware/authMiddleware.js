const createError = require('http-errors');

const { verifyAccessToken } = require('../utils/token');

const extractBearerToken = (headerValue = '') => {
  const [scheme, token] = headerValue.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const requireAuth = (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(createError(401, 'Authentication token missing'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
  } catch (error) {
    next(createError(401, 'Invalid or expired authentication token'));
    return;
  }

  next();
};

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    next(createError(500, 'User context not available'));
    return;
  }

  if (!roles.includes(req.user.role)) {
    next(createError(403, 'You do not have permission to perform this action'));
    return;
  }

  next();
};

module.exports = {
  requireAuth,
  requireRole,
};
