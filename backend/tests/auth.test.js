const crypto = require('node:crypto');

const bcrypt = require('bcryptjs');
const request = require('supertest');

const app = require('../src/app');
const knexManager = require('../src/db/knex');
const { setupTestDatabase, teardownTestDatabase } = require('./support/database');

describe('Auth API', () => {
  const password = 'ValidPassword123!';
  const email = 'integration.user@agency.local';
  let knex;

  beforeAll(async () => {
    knex = knexManager.connection;
    await setupTestDatabase();

    await knex('users').insert({
      id: crypto.randomUUID(),
      role_id: 2,
      email,
      password_hash: await bcrypt.hash(password, 10),
      first_name: 'Integration',
      last_name: 'User',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('returns tokens and user profile for valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        user: expect.objectContaining({
          email,
          firstName: 'Integration',
        }),
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });
    });

    it('rejects invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Invalid email or password',
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user when provided a valid token', async () => {
      const loginResponse = await request(app).post('/api/auth/login').send({ email, password });

      const {
        data: {
          tokens: { accessToken },
        },
      } = loginResponse.body;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject({
        email,
        firstName: 'Integration',
      });
    });
  });
});
