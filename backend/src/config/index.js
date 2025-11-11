require('dotenv').config();

const path = require('path');
const { z } = require('zod');

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    CORS_ORIGIN: z.string().default('*'),
    DATABASE_CLIENT: z.enum(['sqlite3', 'pg']).default('sqlite3'),
    DATABASE_URL: z.string().min(1).optional(),
    JWT_ACCESS_SECRET: z
      .string()
      .min(8, 'JWT access secret must be at least 8 characters')
      .optional(),
    JWT_REFRESH_SECRET: z
      .string()
      .min(8, 'JWT refresh secret must be at least 8 characters')
      .optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  })
  .passthrough();

const parseCorsOrigin = (origin) => {
  if (!origin || origin === '*') {
    return '*';
  }

  return origin
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const buildDatabaseConfig = (env, client, databaseUrl) => {
  if (client === 'pg') {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be provided when DATABASE_CLIENT=pg');
    }

    return {
      client,
      connection: databaseUrl,
      migrations: {
        directory: path.join(__dirname, '../../db/migrations'),
      },
      seeds: {
        directory: path.join(__dirname, '../../db/seeds'),
      },
    };
  }

  const databaseFilename =
    databaseUrl && databaseUrl !== ''
      ? databaseUrl
      : path.join(
          __dirname,
          '../../db',
          env === 'test' ? 'test.sqlite3' : 'development.sqlite3'
        );

  return {
    client,
    connection: {
      filename: databaseFilename,
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
    migrations: {
      directory: path.join(__dirname, '../../db/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '../../db/seeds'),
    },
  };
};

const parseEnvironment = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  const env = parsed.data.NODE_ENV;
  const corsOrigin = parseCorsOrigin(parsed.data.CORS_ORIGIN);
  const jwtAccessSecret =
    parsed.data.JWT_ACCESS_SECRET ??
    (env === 'production' ? undefined : 'change-me-access-secret');
  const jwtRefreshSecret =
    parsed.data.JWT_REFRESH_SECRET ??
    (env === 'production' ? undefined : 'change-me-refresh-secret');

  if (!jwtAccessSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET must be provided in production environments'
    );
  }

  if (!jwtRefreshSecret) {
    throw new Error(
      'JWT_REFRESH_SECRET must be provided in production environments'
    );
  }

  const database = buildDatabaseConfig(
    env,
    parsed.data.DATABASE_CLIENT,
    parsed.data.DATABASE_URL
  );

  return Object.freeze({
    env,
    isProduction: env === 'production',
    isTest: env === 'test',
    logLevel: parsed.data.LOG_LEVEL,
    server: {
      port: parsed.data.PORT,
    },
    cors: {
      origin: corsOrigin,
    },
    auth: {
      jwt: {
        accessSecret: jwtAccessSecret,
        refreshSecret: jwtRefreshSecret,
        accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
      },
      password: {
        saltRounds: parsed.data.BCRYPT_SALT_ROUNDS,
      },
    },
    database,
  });
};

module.exports = parseEnvironment();
