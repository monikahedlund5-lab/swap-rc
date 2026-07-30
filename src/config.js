// quiet: true - dotenv >=17 randomly prints promotional "tip" lines (incl. third-party
// URLs) to stdout on every config() call; suppressed so it never lands in prod logs.
require('dotenv').config({ quiet: true });

const wallets = require('./wallets');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const WALLETS = wallets.map((wallet) => {
  const envKey = `PK_${wallet.label.toUpperCase()}`;
  const privateKey = process.env[envKey];
  if (!privateKey) {
    throw new Error(`Missing private key for wallet "${wallet.label}" - set ${envKey} in .env`);
  }
  return { ...wallet, privateKey };
});

module.exports = {
  WALLETS,
  COLLECTION_WALLET: requireEnv('COLLECTION_WALLET_ADDRESS'),
  TRONGRID_API_KEY: process.env.TRONGRID_API_KEY || '',
  FULL_HOST: process.env.TRON_FULL_HOST || 'https://api.trongrid.us',
  THRESHOLD_TRX: Number(process.env.THRESHOLD_TRX || 5),
  RESERVE_TRX: Number(process.env.RESERVE_TRX || 1),
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || 1000),
  SWEEP_RETRY_COOLDOWN_MS: Number(process.env.SWEEP_RETRY_COOLDOWN_MS || 5000),
  PORT: Number(process.env.PORT || 3300),
};
