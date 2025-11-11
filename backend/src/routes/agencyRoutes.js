const { Router } = require('express');

const agencyController = require('../controllers/agencyController');
const validateRequest = require('../middleware/validateRequest');
const {
  listSnapshotsSchema,
  getSnapshotSchema,
  recalculateSnapshotSchema,
} = require('../schemas/agencySchemas');

const router = Router();

router.get(
  '/snapshots',
  validateRequest(listSnapshotsSchema),
  agencyController.listSnapshots
);
router.get(
  '/snapshots/:date',
  validateRequest(getSnapshotSchema),
  agencyController.getSnapshot
);
router.post(
  '/recalculate',
  validateRequest(recalculateSnapshotSchema),
  agencyController.recalculateSnapshot
);

module.exports = router;
