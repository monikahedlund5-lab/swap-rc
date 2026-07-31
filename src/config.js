// quiet: true - dotenv >=17 randomly prints promotional "tip" lines (incl. third-party
// URLs) to stdout on every config() call; suppressed so it never lands in prod logs.
require('dotenv').config({ quiet: true });

const wallets = require('./wallets');
const logger = require('./logger');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Wallets missing a private key are skipped (with a warning) rather than crashing the
// whole process, so partial key rollout doesn't take down wallets that are configured.
const WALLETS = wallets.reduce((acc, wallet) => {
  const envKey = `PK_${wallet.label.toUpperCase()}`;
  const privateKey = process.env[envKey];
  if (!privateKey) {
    logger.warn(`skipping wallet "${wallet.label}" - no private key set (${envKey} missing in .env)`);
    return acc;
  }
  acc.push({ ...wallet, privateKey });
  return acc;
}, []);

if (WALLETS.length === 0) {
  throw new Error('No wallets have a configured private key - set at least one PK_<LABEL> in .env');
}

module.exports = {
  WALLETS,
  COLLECTION_WALLET: requireEnv('COLLECTION_WALLET_ADDRESS'),
  TRONGRID_API_KEY: process.env.TRONGRID_API_KEY || '',
  FULL_HOST: process.env.TRON_FULL_HOST || 'https://api.trongrid.io',
  THRESHOLD_TRX: Number(process.env.THRESHOLD_TRX || 5),
  RESERVE_TRX: Number(process.env.RESERVE_TRX || 1),
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || 1000),
  SWEEP_RETRY_COOLDOWN_MS: Number(process.env.SWEEP_RETRY_COOLDOWN_MS || 2000),
  PORT: Number(process.env.PORT || 3300),
};
