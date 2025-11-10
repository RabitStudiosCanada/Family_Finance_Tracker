const knexManager = require('../../src/db/knex');

const setupTestDatabase = async () => {
  const knex = knexManager.connection;
  await knex.migrate.rollback(undefined, true);
  await knex.migrate.latest();
  await knex.seed.run();
};

const teardownTestDatabase = async () => {
  await knexManager.destroy();
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
};
