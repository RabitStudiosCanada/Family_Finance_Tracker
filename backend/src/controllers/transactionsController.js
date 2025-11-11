const transactionsService = require('../services/transactionsService');
const response = require('../utils/response');

const listTransactions = async (req, res) => {
  const transactions = await transactionsService.listTransactions(
    req.user,
    req.query
  );

  return response.ok(res, { data: { transactions } });
};

const getTransaction = async (req, res) => {
  const transaction = await transactionsService.getTransaction(
    req.user,
    req.params.id
  );

  return response.ok(res, { data: { transaction } });
};

const createTransaction = async (req, res) => {
  const transaction = await transactionsService.createTransaction(
    req.user,
    req.body
  );

  return response.created(res, { data: { transaction } });
};

const updateTransaction = async (req, res) => {
  const transaction = await transactionsService.updateTransaction(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { transaction } });
};

const deleteTransaction = async (req, res) => {
  await transactionsService.deleteTransaction(req.user, req.params.id);

  return response.noContent(res);
};

module.exports = {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
