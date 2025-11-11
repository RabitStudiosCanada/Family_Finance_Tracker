const crypto = require('node:crypto');

const request = require('supertest');

const app = require('../src/app');
const knexManager = require('../src/db/knex');
const { setupTestDatabase, teardownTestDatabase } = require('./support/database');

const adminCredentials = {
  email: 'admin@agency.local',
  password: 'AgencyPass123!',
};

describe('Users API', () => {
  let knex;
  let accessToken;

  beforeAll(async () => {
    knex = knexManager.connection;
    await setupTestDatabase();

    const loginResponse = await request(app).post('/api/auth/login').send(adminCredentials);
    accessToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/users', () => {
    it('returns active users by default', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      response.body.data.users.forEach((user) => {
        expect(user).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            email: expect.stringContaining('@'),
            isActive: true,
          })
        );
      });
    });
  });

  describe('POST /api/users', () => {
    const basePayload = {
      email: 'new.user@agency.local',
      password: 'NewUserPass123!',
      firstName: 'New',
      lastName: 'User',
      roleId: 2,
    };

    it('creates a user and returns its profile', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(basePayload);

      expect(response.status).toBe(201);
      expect(response.body.data.user).toMatchObject({
        email: basePayload.email.toLowerCase(),
        firstName: basePayload.firstName,
        isActive: true,
      });
    });

    it('rejects duplicate emails', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(basePayload);

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Email is already in use',
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('retrieves a single user', async () => {
      const user = await knex('users').first();

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates basic profile fields', async () => {
      const user = await knex('users').where({ email: 'new.user@agency.local' }).first();

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Updated', lastName: 'User' });

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject({
        firstName: 'Updated',
        lastName: 'User',
      });
    });
  });

  describe('PATCH /api/users/:id/password', () => {
    it('updates the password and allows login with the new password', async () => {
      const user = await knex('users').where({ email: 'new.user@agency.local' }).first();
      const newPassword = 'UpdatedPass123!';

      const response = await request(app)
        .patch(`/api/users/${user.id}/password`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: newPassword });

      expect(response.status).toBe(204);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: newPassword });

      expect(loginResponse.status).toBe(200);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('archives the user and prevents further logins', async () => {
      const user = await knex('users').where({ email: 'new.user@agency.local' }).first();

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      const archivedUser = await knex('users').where({ id: user.id }).first();
      expect(archivedUser.is_active).toBe(0);
      expect(archivedUser.archived_at).not.toBeNull();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'UpdatedPass123!' });

      expect(loginResponse.status).toBe(401);
    });

    it('returns 404 when the user does not exist', async () => {
      const response = await request(app)
        .delete(`/api/users/${crypto.randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        status: 'error',
        message: 'User not found',
      });
    });
  });
});
