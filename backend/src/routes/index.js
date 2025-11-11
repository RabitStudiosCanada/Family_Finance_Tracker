const { Router } = require('express');

const authRoutes = require('./authRoutes');
const agencyRoutes = require('./agencyRoutes');
const creditCardsRoutes = require('./creditCardsRoutes');
const incomeStreamsRoutes = require('./incomeStreamsRoutes');
const transactionsRoutes = require('./transactionsRoutes');
const usersRoutes = require('./usersRoutes');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', requireAuth, requireRole('admin'), usersRoutes);
router.use('/agency', requireAuth, agencyRoutes);
router.use('/credit-cards', requireAuth, creditCardsRoutes);
router.use('/income-streams', requireAuth, incomeStreamsRoutes);
router.use('/transactions', requireAuth, transactionsRoutes);

module.exports = router;
