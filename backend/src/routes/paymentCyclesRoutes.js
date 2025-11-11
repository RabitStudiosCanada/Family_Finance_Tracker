const { Router } = require('express');

const paymentCyclesController = require('../controllers/paymentCyclesController');
const validateRequest = require('../middleware/validateRequest');
const {
  listPaymentCyclesSchema,
  recordPaymentSchema,
} = require('../schemas/paymentCycleSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listPaymentCyclesSchema),
  paymentCyclesController.listPaymentCycles
);

router.post(
  '/:id/record-payment',
  validateRequest(recordPaymentSchema),
  paymentCyclesController.recordPayment
);

module.exports = router;
