const bcrypt = require('bcryptjs');
const config = require('../config');

const hashPassword = async (password) => bcrypt.hash(password, config.auth.password.saltRounds);

const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

module.exports = {
  hashPassword,
  verifyPassword,
};
