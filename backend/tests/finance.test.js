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
  let adultCreditCard;
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
    adultCreditCard = await knex('credit_cards')
      .where({ user_id: adultUser.id })
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

    it('filters transactions by date range, category, and credit card', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-04',
          category: 'groceries',
          creditCardId: referenceCard.id,
        })
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.transactions[0]).toMatchObject({
        category: 'Groceries',
        creditCardId: referenceCard.id,
      });
    });

    it('rejects requests where the start date is after the end date', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ startDate: '2025-11-10', endDate: '2025-11-01' })
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(422);
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

  describe('Payment Cycles', () => {
    const referenceDate = '2025-11-15';
    let referenceCycle;

    beforeAll(async () => {
      referenceCycle = await knex('credit_card_cycles')
        .where({ credit_card_id: adultCreditCard.id })
        .first();
    });

    it('returns cycle summaries for the authenticated adult', async () => {
      const response = await request(app)
        .get('/api/payment-cycles')
        .query({ asOf: referenceDate })
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.paymentCycles)).toBe(true);
      expect(response.body.data.paymentCycles.length).toBeGreaterThan(0);

      const summary = response.body.data.paymentCycles.find(
        (cycle) => cycle.creditCardId === adultCreditCard.id
      );

      expect(summary).toBeDefined();
      expect(summary.autopayEnabled).toBe(true);
      expect(summary.calculatedFor).toBe(referenceDate);
      expect(summary.recommendedPaymentCents).toBe(
        summary.currentCycle.minimumPaymentCents
      );
      expect(summary.currentCycle.statementBalanceCents).toBe(264075);
      expect(summary.currentCycle.daysUntilPaymentDue).toBe(18);
      expect(summary.upcomingCycle.statementDate).toBe('2025-12-08');
      expect(summary.upcomingCycle.daysUntilStatement).toBe(23);
      expect(summary.upcomingCycle.paymentDueDate).toBe('2026-01-03');
      expect(summary.upcomingCycle.daysUntilPaymentDue).toBe(49);
    });

    it('allows admins to query payment cycles for a specific user', async () => {
      const response = await request(app)
        .get('/api/payment-cycles')
        .query({ asOf: referenceDate, userId: partnerCreditCard.user_id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const summary = response.body.data.paymentCycles.find(
        (cycle) => cycle.creditCardId === partnerCreditCard.id
      );

      expect(summary).toBeDefined();
      expect(summary.autopayEnabled).toBe(false);
      expect(summary.recommendedPaymentCents).toBe(
        summary.currentCycle.statementBalanceCents
      );
      expect(summary.currentCycle.minimumPaymentCents).toBe(9230);
      expect(summary.currentCycle.daysUntilPaymentDue).toBe(22);
      expect(summary.upcomingCycle.statementDate).toBe('2025-12-13');
      expect(summary.upcomingCycle.daysUntilStatement).toBe(28);
      expect(summary.upcomingCycle.paymentDueDate).toBe('2026-01-07');
      expect(summary.upcomingCycle.daysUntilPaymentDue).toBe(53);
    });

    it('records and clears a payment for the current cycle', async () => {
      const markResponse = await request(app)
        .post(`/api/payment-cycles/${referenceCycle.id}/record-payment`)
        .set('Authorization', `Bearer ${adultToken}`)
        .send({ paymentRecordedOn: '2025-11-20' });

      expect(markResponse.status).toBe(200);
      expect(markResponse.body.data.paymentCycle.currentCycle).toMatchObject({
        paymentRecordedOn: '2025-11-20',
        isPaid: true,
      });

      const storedCycle = await knex('credit_card_cycles')
        .where({ id: referenceCycle.id })
        .first();
      expect(storedCycle.payment_recorded_on).toBe('2025-11-20');

      const clearResponse = await request(app)
        .post(`/api/payment-cycles/${referenceCycle.id}/record-payment`)
        .set('Authorization', `Bearer ${adultToken}`)
        .send({ clear: true });

      expect(clearResponse.status).toBe(200);
      expect(clearResponse.body.data.paymentCycle.currentCycle).toMatchObject({
        isPaid: false,
      });
      expect(
        clearResponse.body.data.paymentCycle.currentCycle.paymentRecordedOn
      ).toBeUndefined();

      const clearedCycle = await knex('credit_card_cycles')
        .where({ id: referenceCycle.id })
        .first();
      expect(clearedCycle.payment_recorded_on).toBeNull();
    });
  });

  describe('Agency Engine', () => {
    const calculationDate = '2025-11-01';

    it('recalculates the authenticated adult snapshot', async () => {
      const response = await request(app)
        .post('/api/agency/recalculate')
        .set('Authorization', `Bearer ${adultToken}`)
        .send({ calculatedFor: calculationDate });

      expect(response.status).toBe(201);
      expect(response.body.data.snapshot).toMatchObject({
        userId: adultUser.id,
        calculatedFor: calculationDate,
        creditAgencyCents: 685925,
        backedAgencyCents: 715219,
        availableCreditCents: 735925,
        projectedObligationsCents: 34781,
      });

      const storedSnapshot = await knex('agency_snapshots')
        .where({ user_id: adultUser.id, calculated_for: calculationDate })
        .first();

      expect(storedSnapshot.credit_agency_cents).toBe(685925);
      expect(storedSnapshot.backed_agency_cents).toBe(715219);
    });

    it('allows admins to recalculate and fetch agency snapshots for other adults', async () => {
      const partnerUser = await knex('users')
        .where({ email: 'casey.partner@agency.local' })
        .first();

      const recalcResponse = await request(app)
        .post('/api/agency/recalculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: partnerUser.id,
          calculatedFor: calculationDate,
          notes: 'Admin triggered recompute',
        });

      expect(recalcResponse.status).toBe(201);
      expect(recalcResponse.body.data.snapshot).toMatchObject({
        userId: partnerUser.id,
        calculatedFor: calculationDate,
        creditAgencyCents: 1240410,
        backedAgencyCents: 520770,
        availableCreditCents: 1315410,
        projectedObligationsCents: 9230,
        notes: 'Admin triggered recompute',
      });

      const fetchResponse = await request(app)
        .get(`/api/agency/snapshots/${calculationDate}`)
        .query({ userId: partnerUser.id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(fetchResponse.status).toBe(200);
      expect(fetchResponse.body.data.snapshot).toMatchObject({
        userId: partnerUser.id,
        creditAgencyCents: 1240410,
        backedAgencyCents: 520770,
        notes: 'Admin triggered recompute',
      });
    });

    it('lists agency snapshots for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/agency/snapshots')
        .set('Authorization', `Bearer ${adultToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.snapshots.length).toBeGreaterThan(0);
      expect(response.body.data.snapshots[0]).toMatchObject({
        userId: adultUser.id,
        calculatedFor: calculationDate,
      });
    });

    it('includes warning context when thresholds are exceeded', async () => {
      const cycle = await knex('credit_card_cycles')
        .where({ credit_card_id: adultCreditCard.id })
        .first();
      const originalStatementBalance = cycle.statement_balance_cents;

      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adultToken}`)
        .send({
          creditCardId: adultCreditCard.id,
          type: 'expense',
          amountCents: -750000,
          category: 'Emergency Fund',
          transactionDate: '2025-11-05',
        });

      expect(createResponse.status).toBe(201);

      const transactionId = createResponse.body.data.transaction.id;

      await knex('credit_card_cycles')
        .where({ id: cycle.id })
        .update({ statement_balance_cents: 950000 });

      try {
        const warningResponse = await request(app)
          .post('/api/agency/recalculate')
          .set('Authorization', `Bearer ${adultToken}`)
          .send({ calculatedFor: calculationDate });

        expect(warningResponse.status).toBe(201);

        const snapshot = warningResponse.body.data.snapshot;

        expect(snapshot.backedCoveragePercent).toBeGreaterThanOrEqual(75);
        expect(snapshot.creditUtilizationPercent).toBeGreaterThanOrEqual(75);
        expect(snapshot.warnings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'backedAgency' }),
            expect.objectContaining({ type: 'creditUtilization' }),
          ])
        );
      } finally {
        await knex('transactions').where({ id: transactionId }).del();
        await knex('credit_card_cycles')
          .where({ id: cycle.id })
          .update({ statement_balance_cents: originalStatementBalance });
        await request(app)
          .post('/api/agency/recalculate')
          .set('Authorization', `Bearer ${adultToken}`)
          .send({ calculatedFor: calculationDate });
      }
    });
  });
});
