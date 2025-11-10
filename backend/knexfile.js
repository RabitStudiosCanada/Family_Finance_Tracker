const path = require('path');

const BASE_DB_PATH = path.join(__dirname, 'db');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(BASE_DB_PATH, 'development.sqlite3'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(BASE_DB_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_DB_PATH, 'seeds'),
    },
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: path.join(BASE_DB_PATH, 'test.sqlite3'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(BASE_DB_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_DB_PATH, 'seeds'),
    },
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },
};
