const authService = require('../services/authService');
const response = require('../utils/response');

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  return response.ok(res, { data: result });
};

const me = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  return response.ok(res, { data: { user } });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshSession(refreshToken);

  return response.ok(res, { data: result });
};

const logout = async (_req, res) => response.noContent(res);

module.exports = {
  login,
  me,
  refresh,
  logout,
};
