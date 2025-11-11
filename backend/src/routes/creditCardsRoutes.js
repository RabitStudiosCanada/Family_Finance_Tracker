const { Router } = require('express');

const creditCardsController = require('../controllers/creditCardsController');
const validateRequest = require('../middleware/validateRequest');
const {
  listCreditCardsSchema,
  createCreditCardSchema,
  updateCreditCardSchema,
  getCreditCardSchema,
  archiveCreditCardSchema,
} = require('../schemas/financeSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listCreditCardsSchema),
  creditCardsController.listCreditCards
);
router.post(
  '/',
  validateRequest(createCreditCardSchema),
  creditCardsController.createCreditCard
);
router.get(
  '/:id',
  validateRequest(getCreditCardSchema),
  creditCardsController.getCreditCard
);
router.patch(
  '/:id',
  validateRequest(updateCreditCardSchema),
  creditCardsController.updateCreditCard
);
router.patch(
  '/:id/archive',
  validateRequest(archiveCreditCardSchema),
  creditCardsController.archiveCreditCard
);

module.exports = router;
