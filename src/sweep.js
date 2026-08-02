const tronWeb = require('./tronClient');
const config = require('./config');
const trc20 = require('./trc20');

// Both TRX (sun) and USDT-TRC20 (6 decimals) use the same 1e6 unit scale.
const SUN_PER_TRX = 1_000_000;

async function sweepWallet(wallet, balanceUnits) {
  const asset = wallet.asset || 'trx';
  return asset === 'usdt' ? sweepUsdt(wallet, balanceUnits) : sweepTrx(wallet, balanceUnits);
}

async function sweepTrx(wallet, balanceSun) {
  const reserveSun = Math.round(config.RESERVE_TRX * SUN_PER_TRX);
  const amountSun = balanceSun - reserveSun;
  if (amountSun <= 0) {
    throw new Error(
      `balance ${balanceSun / SUN_PER_TRX} TRX too low to sweep after reserving ${config.RESERVE_TRX} TRX`
    );
  }

  // permissionId lets a wallet whose owner permission was reassigned elsewhere still
  // sweep via its active permission (id 2 by default) - see src/wallets.js.
  const options = wallet.permissionId != null ? { permissionId: wallet.permissionId } : {};
  const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
    config.COLLECTION_WALLET,
    amountSun,
    wallet.address,
    options
  );
  return broadcast(unsignedTx, wallet.privateKey);
}

async function sweepUsdt(wallet, balanceUnits) {
  if (balanceUnits <= 0) {
    throw new Error('zero USDT balance, nothing to sweep');
  }

  // Gas for the transfer call is paid in TRX from the wallet's own TRX balance/bandwidth,
  // not from the USDT being swept - make sure usdt wallets keep a little TRX (or frozen
  // energy) on hand, same as RESERVE_TRX does for trx wallets.
  const feeLimitSun = Math.round(config.TRC20_FEE_LIMIT_TRX * SUN_PER_TRX);
  const unsignedTx = await trc20.buildUsdtTransfer(
    wallet.address,
    config.COLLECTION_WALLET,
    balanceUnits,
    feeLimitSun,
    wallet.permissionId
  );
  return broadcast(unsignedTx, wallet.privateKey);
}

async function broadcast(unsignedTx, privateKey) {
  const signedTx = await tronWeb.trx.sign(unsignedTx, privateKey);
  const receipt = await tronWeb.trx.sendRawTransaction(signedTx);

  if (!receipt.result) {
    throw new Error(`broadcast rejected: ${JSON.stringify(receipt)}`);
  }

  return receipt.txid;
}

module.exports = { sweepWallet, SUN_PER_TRX };
