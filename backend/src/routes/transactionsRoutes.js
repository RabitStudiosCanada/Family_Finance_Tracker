const { Router } = require('express');

const transactionsController = require('../controllers/transactionsController');
const validateRequest = require('../middleware/validateRequest');
const {
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionSchema,
  deleteTransactionSchema,
} = require('../schemas/financeSchemas');

const router = Router();

router.get(
  '/',
  validateRequest(listTransactionsSchema),
  transactionsController.listTransactions
);
router.post(
  '/',
  validateRequest(createTransactionSchema),
  transactionsController.createTransaction
);
router.get(
  '/:id',
  validateRequest(getTransactionSchema),
  transactionsController.getTransaction
);
router.patch(
  '/:id',
  validateRequest(updateTransactionSchema),
  transactionsController.updateTransaction
);
router.delete(
  '/:id',
  validateRequest(deleteTransactionSchema),
  transactionsController.deleteTransaction
);

module.exports = router;
