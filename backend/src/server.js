const app = require('./app');
const config = require('./config');

const { port } = config.server;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
});
