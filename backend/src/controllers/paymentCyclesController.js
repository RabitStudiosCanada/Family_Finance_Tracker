const paymentCyclesService = require('../services/paymentCyclesService');
const response = require('../utils/response');

const listPaymentCycles = async (req, res) => {
  const paymentCycles = await paymentCyclesService.listPaymentCycles(
    req.user,
    req.query
  );

  return response.ok(res, { data: { paymentCycles } });
};

const recordPayment = async (req, res) => {
  const paymentCycle = await paymentCyclesService.recordPaymentForCycle(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { paymentCycle } });
};

module.exports = {
  listPaymentCycles,
  recordPayment,
};
