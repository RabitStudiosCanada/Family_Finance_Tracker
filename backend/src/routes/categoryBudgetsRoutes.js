const { Router } = require('express');

const categoryBudgetsController = require('../controllers/categoryBudgetsController');
const validateRequest = require('../middleware/validateRequest');
const {
  listCategoryBudgetsSchema,
  createCategoryBudgetSchema,
  updateCategoryBudgetSchema,
  deleteCategoryBudgetSchema,
} = require('../schemas/planningSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listCategoryBudgetsSchema),
  categoryBudgetsController.listCategoryBudgets
);
router.post(
  '/',
  validateRequest(createCategoryBudgetSchema),
  categoryBudgetsController.createCategoryBudget
);
router.patch(
  '/:id',
  validateRequest(updateCategoryBudgetSchema),
  categoryBudgetsController.updateCategoryBudget
);
router.delete(
  '/:id',
  validateRequest(deleteCategoryBudgetSchema),
  categoryBudgetsController.deleteCategoryBudget
);

module.exports = router;
