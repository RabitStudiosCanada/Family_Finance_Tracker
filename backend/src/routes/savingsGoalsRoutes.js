const { Router } = require('express');

const savingsGoalsController = require('../controllers/savingsGoalsController');
const validateRequest = require('../middleware/validateRequest');
const {
  listSavingsGoalsSchema,
  getSavingsGoalSchema,
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  completeSavingsGoalSchema,
  abandonSavingsGoalSchema,
  addContributionSchema,
  deleteContributionSchema,
} = require('../schemas/planningSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listSavingsGoalsSchema),
  savingsGoalsController.listSavingsGoals
);
router.post(
  '/',
  validateRequest(createSavingsGoalSchema),
  savingsGoalsController.createSavingsGoal
);
router.get(
  '/:id',
  validateRequest(getSavingsGoalSchema),
  savingsGoalsController.getSavingsGoal
);
router.patch(
  '/:id',
  validateRequest(updateSavingsGoalSchema),
  savingsGoalsController.updateSavingsGoal
);
router.post(
  '/:id/complete',
  validateRequest(completeSavingsGoalSchema),
  savingsGoalsController.completeSavingsGoal
);
router.post(
  '/:id/abandon',
  validateRequest(abandonSavingsGoalSchema),
  savingsGoalsController.abandonSavingsGoal
);
router.post(
  '/:id/contributions',
  validateRequest(addContributionSchema),
  savingsGoalsController.addContribution
);
router.delete(
  '/:id/contributions/:contributionId',
  validateRequest(deleteContributionSchema),
  savingsGoalsController.deleteContribution
);

module.exports = router;
