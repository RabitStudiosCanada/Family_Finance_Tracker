const { Router } = require('express');

const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', requireAuth, requireRole('admin'), usersRoutes);

module.exports = router;
