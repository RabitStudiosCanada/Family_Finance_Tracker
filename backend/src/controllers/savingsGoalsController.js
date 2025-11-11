const savingsGoalsService = require('../services/savingsGoalsService');
const response = require('../utils/response');

const listSavingsGoals = async (req, res) => {
  const savingsGoals = await savingsGoalsService.listSavingsGoals(
    req.user,
    req.query
  );

  return response.ok(res, { data: { savingsGoals } });
};

const getSavingsGoal = async (req, res) => {
  const savingsGoal = await savingsGoalsService.getSavingsGoal(
    req.user,
    req.params.id
  );

  return response.ok(res, { data: { savingsGoal } });
};

const createSavingsGoal = async (req, res) => {
  const savingsGoal = await savingsGoalsService.createSavingsGoal(
    req.user,
    req.body
  );

  return response.created(res, { data: { savingsGoal } });
};

const updateSavingsGoal = async (req, res) => {
  const savingsGoal = await savingsGoalsService.updateSavingsGoal(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { savingsGoal } });
};

const completeSavingsGoal = async (req, res) => {
  const savingsGoal = await savingsGoalsService.completeSavingsGoal(
    req.user,
    req.params.id
  );

  return response.ok(res, { data: { savingsGoal } });
};

const abandonSavingsGoal = async (req, res) => {
  const savingsGoal = await savingsGoalsService.abandonSavingsGoal(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { savingsGoal } });
};

const addContribution = async (req, res) => {
  const { goal, contribution } = await savingsGoalsService.addContribution(
    req.user,
    req.params.id,
    req.body
  );

  return response.created(res, { data: { savingsGoal: goal, contribution } });
};

const deleteContribution = async (req, res) => {
  const savingsGoal = await savingsGoalsService.deleteContribution(
    req.user,
    req.params.id,
    req.params.contributionId
  );

  return response.ok(res, { data: { savingsGoal } });
};

module.exports = {
  listSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  completeSavingsGoal,
  abandonSavingsGoal,
  addContribution,
  deleteContribution,
};
