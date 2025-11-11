const paymentCyclesService = require('../services/paymentCyclesService');
const response = require('../utils/response');

const listPaymentCycles = async (req, res) => {
  const paymentCycles = await paymentCyclesService.listPaymentCycles(
    req.user,
    req.query
  );

  return response.ok(res, { data: { paymentCycles } });
};

module.exports = {
  listPaymentCycles,
};
