const incomeStreamsService = require('../services/incomeStreamsService');
const response = require('../utils/response');

const listIncomeStreams = async (req, res) => {
  const incomeStreams = await incomeStreamsService.listIncomeStreams(
    req.user,
    req.query
  );

  return response.ok(res, { data: { incomeStreams } });
};

const getIncomeStream = async (req, res) => {
  const incomeStream = await incomeStreamsService.getIncomeStream(
    req.user,
    req.params.id
  );

  return response.ok(res, { data: { incomeStream } });
};

const createIncomeStream = async (req, res) => {
  const incomeStream = await incomeStreamsService.createIncomeStream(
    req.user,
    req.body
  );

  return response.created(res, { data: { incomeStream } });
};

const updateIncomeStream = async (req, res) => {
  const incomeStream = await incomeStreamsService.updateIncomeStream(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { incomeStream } });
};

const archiveIncomeStream = async (req, res) => {
  await incomeStreamsService.archiveIncomeStream(req.user, req.params.id);

  return response.noContent(res);
};

module.exports = {
  listIncomeStreams,
  getIncomeStream,
  createIncomeStream,
  updateIncomeStream,
  archiveIncomeStream,
};
