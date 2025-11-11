const { Router } = require('express');

const projectedExpensesController = require('../controllers/projectedExpensesController');
const validateRequest = require('../middleware/validateRequest');
const {
  listProjectedExpensesSchema,
  getProjectedExpenseSchema,
  createProjectedExpenseSchema,
  updateProjectedExpenseSchema,
  commitProjectedExpenseSchema,
  markProjectedExpensePaidSchema,
  cancelProjectedExpenseSchema,
  deleteProjectedExpenseSchema,
} = require('../schemas/planningSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listProjectedExpensesSchema),
  projectedExpensesController.listProjectedExpenses
);
router.post(
  '/',
  validateRequest(createProjectedExpenseSchema),
  projectedExpensesController.createProjectedExpense
);
router.get(
  '/:id',
  validateRequest(getProjectedExpenseSchema),
  projectedExpensesController.getProjectedExpense
);
router.patch(
  '/:id',
  validateRequest(updateProjectedExpenseSchema),
  projectedExpensesController.updateProjectedExpense
);
router.post(
  '/:id/commit',
  validateRequest(commitProjectedExpenseSchema),
  projectedExpensesController.commitProjectedExpense
);
router.post(
  '/:id/mark-paid',
  validateRequest(markProjectedExpensePaidSchema),
  projectedExpensesController.markProjectedExpensePaid
);
router.post(
  '/:id/cancel',
  validateRequest(cancelProjectedExpenseSchema),
  projectedExpensesController.cancelProjectedExpense
);
router.delete(
  '/:id',
  validateRequest(deleteProjectedExpenseSchema),
  projectedExpensesController.deleteProjectedExpense
);

module.exports = router;
