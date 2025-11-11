const { Router } = require('express');

const incomeStreamsController = require('../controllers/incomeStreamsController');
const validateRequest = require('../middleware/validateRequest');
const {
  listIncomeStreamsSchema,
  createIncomeStreamSchema,
  updateIncomeStreamSchema,
  getIncomeStreamSchema,
  archiveIncomeStreamSchema,
} = require('../schemas/financeSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listIncomeStreamsSchema),
  incomeStreamsController.listIncomeStreams
);
router.post(
  '/',
  validateRequest(createIncomeStreamSchema),
  incomeStreamsController.createIncomeStream
);
router.get(
  '/:id',
  validateRequest(getIncomeStreamSchema),
  incomeStreamsController.getIncomeStream
);
router.patch(
  '/:id',
  validateRequest(updateIncomeStreamSchema),
  incomeStreamsController.updateIncomeStream
);
router.patch(
  '/:id/archive',
  validateRequest(archiveIncomeStreamSchema),
  incomeStreamsController.archiveIncomeStream
);

module.exports = router;
