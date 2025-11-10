const knex = require('knex');
const config = require('../config');

let knexInstance;

const createKnexInstance = () => {
  if (knexInstance) {
    return knexInstance;
  }

  knexInstance = knex({
    ...config.database,
  });

  return knexInstance;
};

module.exports = {
  get connection() {
    return createKnexInstance();
  },
  destroy: async () => {
    if (knexInstance) {
      await knexInstance.destroy();
      knexInstance = null;
    }
  },
};
