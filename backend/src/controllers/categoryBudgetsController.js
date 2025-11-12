const categoryBudgetsService = require('../services/categoryBudgetsService');
const response = require('../utils/response');

const listCategoryBudgets = async (req, res) => {
  const categoryBudgets = await categoryBudgetsService.listCategoryBudgets(
    req.user,
    req.query
  );

  return response.ok(res, { data: { categoryBudgets } });
};

const listCategoryBudgetSummaries = async (req, res) => {
  const summaries = await categoryBudgetsService.listCategoryBudgetSummaries(
    req.user,
    req.query
  );

  return response.ok(res, { data: { categoryBudgets: summaries } });
};

const createCategoryBudget = async (req, res) => {
  const categoryBudget = await categoryBudgetsService.createCategoryBudget(
    req.user,
    req.body
  );

  return response.created(res, { data: { categoryBudget } });
};

const updateCategoryBudget = async (req, res) => {
  const categoryBudget = await categoryBudgetsService.updateCategoryBudget(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { categoryBudget } });
};

const deleteCategoryBudget = async (req, res) => {
  await categoryBudgetsService.deleteCategoryBudget(req.user, req.params.id);

  return response.noContent(res);
};

module.exports = {
  listCategoryBudgets,
  listCategoryBudgetSummaries,
  createCategoryBudget,
  updateCategoryBudget,
  deleteCategoryBudget,
};
