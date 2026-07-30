const config = require('./config');
const logger = require('./logger');
const monitor = require('./monitor');
const server = require('./server');

logger.info(`starting swap-rc: ${config.WALLETS.length} wallets, threshold ${config.THRESHOLD_TRX} TRX`);

server.start();
monitor.start();

process.on('unhandledRejection', (err) => {
  logger.error(`unhandled rejection: ${err && err.stack ? err.stack : err}`);
});

process.on('SIGTERM', () => {
  logger.info('received SIGTERM, shutting down');
  process.exit(0);
});
