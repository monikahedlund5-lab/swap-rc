const tronWeb = require('./tronClient');
const config = require('./config');
const state = require('./state');
const logger = require('./logger');
const { sweepWallet, SUN_PER_TRX } = require('./sweep');

async function checkWallet(wallet) {
  const s = state.get(wallet.address);

  if (s.sweeping) return;
  if (Date.now() < s.cooldownUntil) return;

  let balanceSun;
  try {
    balanceSun = await tronWeb.trx.getBalance(wallet.address);
  } catch (err) {
    s.lastError = `balance check failed: ${err.message}`;
    logger.error(`[${wallet.label}] balance check failed: ${err.message}`);
    return;
  }

  s.balanceSun = balanceSun;
  s.lastCheckAt = Date.now();
  s.lastError = null;

  const balanceTrx = balanceSun / SUN_PER_TRX;
  if (balanceTrx <= config.THRESHOLD_TRX) return;

  s.sweeping = true;
  logger.info(
    `[${wallet.label}] balance ${balanceTrx} TRX exceeds threshold of ${config.THRESHOLD_TRX} TRX, sweeping to ${config.COLLECTION_WALLET}`
  );

  try {
    const txId = await sweepWallet(wallet, balanceSun);
    s.lastSweepAt = Date.now();
    s.lastSweepTxId = txId;
    s.sweepCount += 1;
    // TronGrid's balance read can lag a couple seconds behind the block that just
    // confirmed - without this, the very next tick can still see the pre-sweep
    // balance and fire a harmless-but-noisy duplicate sweep attempt.
    s.cooldownUntil = Date.now() + config.SWEEP_RETRY_COOLDOWN_MS;
    logger.info(`[${wallet.label}] swept successfully, tx ${txId}`);
  } catch (err) {
    s.lastError = `sweep failed: ${err.message}`;
    s.cooldownUntil = Date.now() + config.SWEEP_RETRY_COOLDOWN_MS;
    logger.error(`[${wallet.label}] sweep failed: ${err.message}`);
  } finally {
    s.sweeping = false;
  }
}

function start() {
  for (const wallet of config.WALLETS) {
    state.get(wallet.address);
    setInterval(() => {
      checkWallet(wallet).catch((err) => {
        logger.error(`[${wallet.label}] unexpected error: ${err.message}`);
      });
    }, config.POLL_INTERVAL_MS);
    logger.info(`watching ${wallet.label} (${wallet.address}) every ${config.POLL_INTERVAL_MS}ms`);
  }
}

module.exports = { start, checkWallet };
