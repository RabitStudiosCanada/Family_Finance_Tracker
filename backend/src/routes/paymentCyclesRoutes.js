const { Router } = require('express');

const paymentCyclesController = require('../controllers/paymentCyclesController');
const validateRequest = require('../middleware/validateRequest');
const { listPaymentCyclesSchema } = require('../schemas/paymentCycleSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listPaymentCyclesSchema),
  paymentCyclesController.listPaymentCycles
);

module.exports = router;
