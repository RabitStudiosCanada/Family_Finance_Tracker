const createError = require('http-errors');

const usersRepository = require('../repositories/usersRepository');
const { verifyPassword } = require('../utils/password');
const { serializeUser } = require('../utils/serializers');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');

const buildTokens = (user) => ({
  accessToken: signAccessToken({ sub: user.id, role: user.role_code }),
  refreshToken: signRefreshToken({ sub: user.id, role: user.role_code }),
});

const login = async ({ email, password }) => {
  const user = await usersRepository.findByEmail(email);

  if (!user) {
    throw createError(401, 'Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw createError(401, 'Invalid email or password');
  }

  await usersRepository.recordSuccessfulLogin(user.id);

  const tokens = buildTokens(user);

  return {
    user: serializeUser(user),
    tokens,
  };
};

const getCurrentUser = async (userId) => {
  const user = await usersRepository.findById(userId);

  if (!user) {
    throw createError(404, 'User not found');
  }

  return serializeUser(user);
};

const refreshSession = async (token) => {
  if (!token) {
    throw createError(400, 'Refresh token is required');
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw createError(401, 'Invalid refresh token');
  }

  const user = await usersRepository.findById(payload.sub);

  if (!user) {
    throw createError(401, 'User no longer exists');
  }

  const tokens = buildTokens(user);

  return {
    user: serializeUser(user),
    tokens,
  };
};

module.exports = {
  login,
  getCurrentUser,
  refreshSession,
};
