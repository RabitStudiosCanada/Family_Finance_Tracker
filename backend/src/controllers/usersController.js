const usersService = require('../services/usersService');
const response = require('../utils/response');

const listUsers = async (req, res) => {
  const users = await usersService.listUsers({ includeArchived: req.query.includeArchived });

  return response.ok(res, { data: { users } });
};

const getUser = async (req, res) => {
  const user = await usersService.getUserById(req.params.id);

  return response.ok(res, { data: { user } });
};

const createUser = async (req, res) => {
  const user = await usersService.createUser(req.body);

  return response.created(res, { data: { user } });
};

const updateUser = async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body);

  return response.ok(res, { data: { user } });
};

const archiveUser = async (req, res) => {
  await usersService.archiveUser(req.params.id);

  return response.noContent(res);
};

const resetPassword = async (req, res) => {
  await usersService.resetPassword(req.params.id, req.body.password);

  return response.noContent(res);
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  archiveUser,
  resetPassword,
};
