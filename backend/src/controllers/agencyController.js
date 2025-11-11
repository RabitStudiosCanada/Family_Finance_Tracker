const agencyService = require('../services/agencyService');
const response = require('../utils/response');

const listSnapshots = async (req, res) => {
  const snapshots = await agencyService.listSnapshots(req.user, req.query);

  return response.ok(res, { data: { snapshots } });
};

const getSnapshot = async (req, res) => {
  const snapshot = await agencyService.getSnapshotByDate(
    req.user,
    req.params.date,
    req.query
  );

  return response.ok(res, { data: { snapshot } });
};

const recalculateSnapshot = async (req, res) => {
  const snapshot = await agencyService.recalculateSnapshot(req.user, req.body);

  return response.created(res, { data: { snapshot } });
};

module.exports = {
  listSnapshots,
  getSnapshot,
  recalculateSnapshot,
};
