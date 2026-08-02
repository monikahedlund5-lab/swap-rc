const express = require('express');
const config = require('./config');
const state = require('./state');
const logger = require('./logger');

function start() {
  const app = express();

  app.get('/health', (_req, res) => res.status(200).send('ok'));

  app.get('/status', (_req, res) => {
    const snapshot = state.snapshot();
    const wallets = config.WALLETS.map((wallet) => {
      const asset = wallet.asset || 'trx';
      return {
        label: wallet.label,
        address: wallet.address,
        asset,
        threshold: asset === 'usdt' ? config.THRESHOLD_USDT : config.THRESHOLD_TRX,
        ...snapshot[wallet.address],
      };
    });
    res.json({
      collectionWallet: config.COLLECTION_WALLET,
      thresholdTrx: config.THRESHOLD_TRX,
      thresholdUsdt: config.THRESHOLD_USDT,
      usdtContractAddress: config.USDT_CONTRACT_ADDRESS,
      pollIntervalMs: config.POLL_INTERVAL_MS,
      wallets,
    });
  });

  // Bind to loopback only - nginx is the public-facing reverse proxy for this.
  app.listen(config.PORT, '127.0.0.1', () => {
    logger.info(`status server listening on 127.0.0.1:${config.PORT}`);
  });
}

module.exports = { start };
