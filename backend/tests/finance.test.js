const request = require('supertest');

const app = require('../src/app');
const knexManager = require('../src/db/knex');
const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('./support/database');

const adminCredentials = {
  email: 'admin@agency.local',
  password: 'AgencyPass123!',
};

const adultCredentials = {
  email: 'jordan.parent@agency.local',
  password: 'AgencyPass123!',
};

describe('Finance API', () => {
  let knex;
  let adminToken;
  let adultToken;
  let adultUser;
  let partnerCreditCard;

  beforeAll(async () => {
    knex = knexManager.connection;
    await setupTestDatabase();

    const [adminLogin, adultLogin] = await Promise.all([
      request(app).post('/api/auth/login').send(adminCredentials),
      request(app).post('/api/auth/login').send(adultCredentials),
    ]);

    adminToken = adminLogin.body.data.tokens.accessToken;
    adultToken = adultLogin.body.data.tokens.accessToken;

    adultUser = await knex('users')
      .where({ email: adultCredentials.email })
      .first();
    partnerCreditCard = await knex('credit_cards')
      .whereNot({ user_id: adultUser.id })
      .first();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Credit Cards', () => {
    it('lists the authenticated user credit cards', async () => {
      const response = await request(app)
        .get('/api/credit-cards')
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.creditCards.length).toBeGreaterThan(0);
      response.body.data.creditCards.forEach((card) => {
        expect(card.userId).toBe(adultUser.id);
      });
    });

    it('creates, updates, and archives a credit card', async () => {
      const createPayload = {
        nickname: 'Daily Driver',
        issuer: 'Capital One',
        lastFour: '2222',
        creditLimitCents: 750000,
        cycleAnchorDay: 5,
        statementDay: 2,
        paymentDueDay: 25,
        autopayEnabled: true,
      };

      const createResponse = await request(app)
        .post('/api/credit-cards')
        .set('Authorization', `Bearer ${adultToken}`)
        .send(createPayload);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.creditCard).toMatchObject({
        userId: adultUser.id,
        nickname: createPayload.nickname,
        autopayEnabled: true,
      });

      const cardId = createResponse.body.data.creditCard.id;

      const updateResponse = await request(app)
        .patch(`/api/credit-cards/${cardId}`)
        .set('Authorization', `Bearer ${adultToken}`)
        .send({ autopayEnabled: false, issuer: 'CapitalOne Canada' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.creditCard).toMatchObject({
        autopayEnabled: false,
        issuer: 'CapitalOne Canada',
      });

      const archiveResponse = await request(app)
        .patch(`/api/credit-cards/${cardId}/archive`)
        .set('Authorization', `Bearer ${adultToken}`);

      expect(archiveResponse.status).toBe(204);

      const storedCard = await knex('credit_cards')
        .where({ id: cardId })
        .first();
      expect(storedCard.is_active).toBe(0);
    });

    it('prevents adults from accessing credit cards owned by other users', async () => {
      const response = await request(app)
        .get(`/api/credit-cards/${partnerCreditCard.id}`)
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(404);
    });

    it('allows admins to list credit cards for a specific user', async () => {
      const response = await request(app)
        .get('/api/credit-cards')
        .query({ userId: adultUser.id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.creditCards.length).toBeGreaterThan(0);
      response.body.data.creditCards.forEach((card) => {
        expect(card.userId).toBe(adultUser.id);
      });
    });
  });

  describe('Income Streams', () => {
    it('returns income streams for the authenticated adult', async () => {
      const response = await request(app)
        .get('/api/income-streams')
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.incomeStreams.length).toBeGreaterThan(0);
      response.body.data.incomeStreams.forEach((stream) => {
        expect(stream.userId).toBe(adultUser.id);
      });
    });

    it('creates, updates, and archives an income stream', async () => {
      const createPayload = {
        name: 'Side Hustle',
        amountCents: 150000,
        frequency: 'monthly',
        nextExpectedDate: '2025-12-05',
        notes: 'Design consulting engagement',
      };

      const createResponse = await request(app)
        .post('/api/income-streams')
        .set('Authorization', `Bearer ${adultToken}`)
        .send(createPayload);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.incomeStream).toMatchObject({
        userId: adultUser.id,
        name: createPayload.name,
      });

      const streamId = createResponse.body.data.incomeStream.id;

      const updateResponse = await request(app)
        .patch(`/api/income-streams/${streamId}`)
        .set('Authorization', `Bearer ${adultToken}`)
        .send({ notes: 'Extended for another quarter' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.incomeStream.notes).toBe(
        'Extended for another quarter'
      );

      const archiveResponse = await request(app)
        .patch(`/api/income-streams/${streamId}/archive`)
        .set('Authorization', `Bearer ${adultToken}`);

      expect(archiveResponse.status).toBe(204);

      const storedStream = await knex('income_streams')
        .where({ id: streamId })
        .first();
      expect(storedStream.is_active).toBe(0);
    });
  });

  describe('Transactions', () => {
    let referenceCard;

    beforeAll(async () => {
      referenceCard = await knex('credit_cards')
        .where({ user_id: adultUser.id })
        .first();
    });

    it('lists transactions for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
      response.body.data.transactions.forEach((transaction) => {
        expect(transaction.userId).toBe(adultUser.id);
      });
    });

    it('creates, updates, and deletes a transaction', async () => {
      const createPayload = {
        creditCardId: referenceCard.id,
        type: 'expense',
        amountCents: -4200,
        currency: 'cad',
        category: 'Dining',
        transactionDate: '2025-11-10',
        merchant: 'Favorite Bistro',
        memo: 'Anniversary dinner',
      };

      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adultToken}`)
        .send(createPayload);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.transaction).toMatchObject({
        userId: adultUser.id,
        category: 'Dining',
        currency: 'CAD',
      });

      const transactionId = createResponse.body.data.transaction.id;

      const updateResponse = await request(app)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${adultToken}`)
        .send({ category: 'Restaurants', isPending: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.transaction).toMatchObject({
        category: 'Restaurants',
        isPending: true,
      });

      const deleteResponse = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${adultToken}`);

      expect(deleteResponse.status).toBe(204);

      const storedTransaction = await knex('transactions')
        .where({ id: transactionId })
        .first();
      expect(storedTransaction).toBeUndefined();
    });
  });
});
