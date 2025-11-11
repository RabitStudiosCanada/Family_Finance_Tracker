const creditCardsService = require('../services/creditCardsService');
const response = require('../utils/response');

const listCreditCards = async (req, res) => {
  const creditCards = await creditCardsService.listCreditCards(
    req.user,
    req.query
  );

  return response.ok(res, { data: { creditCards } });
};

const getCreditCard = async (req, res) => {
  const creditCard = await creditCardsService.getCreditCard(
    req.user,
    req.params.id
  );

  return response.ok(res, { data: { creditCard } });
};

const createCreditCard = async (req, res) => {
  const creditCard = await creditCardsService.createCreditCard(
    req.user,
    req.body
  );

  return response.created(res, { data: { creditCard } });
};

const updateCreditCard = async (req, res) => {
  const creditCard = await creditCardsService.updateCreditCard(
    req.user,
    req.params.id,
    req.body
  );

  return response.ok(res, { data: { creditCard } });
};

const archiveCreditCard = async (req, res) => {
  await creditCardsService.archiveCreditCard(req.user, req.params.id);

  return response.noContent(res);
};

module.exports = {
  listCreditCards,
  getCreditCard,
  createCreditCard,
  updateCreditCard,
  archiveCreditCard,
};
