const tronWeb = require('./tronClient');
const config = require('./config');

const SUN_PER_TRX = 1_000_000;

async function sweepWallet(wallet, balanceSun) {
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
  const signedTx = await tronWeb.trx.sign(unsignedTx, wallet.privateKey);
  const receipt = await tronWeb.trx.sendRawTransaction(signedTx);

  if (!receipt.result) {
    throw new Error(`broadcast rejected: ${JSON.stringify(receipt)}`);
  }

  return receipt.txid;
}

module.exports = { sweepWallet, SUN_PER_TRX };
