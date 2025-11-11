const projectedExpensesService = require('../services/projectedExpensesService');
const response = require('../utils/response');

const listProjectedExpenses = async (req, res) => {
  const projectedExpenses =
    await projectedExpensesService.listProjectedExpenses(req.user, req.query);

  return response.ok(res, { data: { projectedExpenses } });
};

const getProjectedExpense = async (req, res) => {
  const projectedExpense = await projectedExpensesService.getProjectedExpense(
    req.user,
    req.params.id
  );

  return response.ok(res, { data: { projectedExpense } });
};

const createProjectedExpense = async (req, res) => {
  const projectedExpense =
    await projectedExpensesService.createProjectedExpense(req.user, req.body);

  return response.created(res, { data: { projectedExpense } });
};

const updateProjectedExpense = async (req, res) => {
  const projectedExpense =
    await projectedExpensesService.updateProjectedExpense(
      req.user,
      req.params.id,
      req.body
    );

  return response.ok(res, { data: { projectedExpense } });
};

const commitProjectedExpense = async (req, res) => {
  const projectedExpense =
    await projectedExpensesService.commitProjectedExpense(
      req.user,
      req.params.id
    );

  return response.ok(res, { data: { projectedExpense } });
};

const markProjectedExpensePaid = async (req, res) => {
  const projectedExpense =
    await projectedExpensesService.markProjectedExpensePaid(
      req.user,
      req.params.id,
      req.body
    );

  return response.ok(res, { data: { projectedExpense } });
};

const cancelProjectedExpense = async (req, res) => {
  const projectedExpense =
    await projectedExpensesService.cancelProjectedExpense(
      req.user,
      req.params.id,
      req.body
    );

  return response.ok(res, { data: { projectedExpense } });
};

const deleteProjectedExpense = async (req, res) => {
  await projectedExpensesService.deleteProjectedExpense(
    req.user,
    req.params.id
  );

  return response.noContent(res);
};

module.exports = {
  listProjectedExpenses,
  getProjectedExpense,
  createProjectedExpense,
  updateProjectedExpense,
  commitProjectedExpense,
  markProjectedExpensePaid,
  cancelProjectedExpense,
  deleteProjectedExpense,
};
