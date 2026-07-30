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

  const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
    config.COLLECTION_WALLET,
    amountSun,
    wallet.address
  );
  const signedTx = await tronWeb.trx.sign(unsignedTx, wallet.privateKey);
  const receipt = await tronWeb.trx.sendRawTransaction(signedTx);

  if (!receipt.result) {
    throw new Error(`broadcast rejected: ${JSON.stringify(receipt)}`);
  }

  return receipt.txid;
}

module.exports = { sweepWallet, SUN_PER_TRX };
