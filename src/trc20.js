const tronWeb = require('./tronClient');
const config = require('./config');

const TRANSFER_SELECTOR = 'transfer(address,uint256)';
const BALANCE_OF_SELECTOR = 'balanceOf(address)';

// USDT-TRC20's decimals are fixed at 6 by the deployed contract and cannot change, so this
// is hardcoded rather than queried on every poll.
const DECIMALS = 6;

// Uses triggerConstantContract directly (rather than tronWeb.contract().at(...).call())
// so the query's owner_address is always the wallet being checked, passed explicitly per
// call - the shared tronWeb instance has no default address, and the Contract wrapper's
// .call() requires one ("owner_address isn't set") since it's polled for many wallets
// concurrently and a global defaultAddress would race between them.
async function getUsdtBalance(address) {
  const result = await tronWeb.transactionBuilder.triggerConstantContract(
    config.USDT_CONTRACT_ADDRESS,
    BALANCE_OF_SELECTOR,
    {},
    [{ type: 'address', value: address }],
    address
  );
  const hex = result.constant_result[0];
  return Number(BigInt('0x' + hex).toString());
}

async function buildUsdtTransfer(fromAddress, toAddress, amountUnits, feeLimitSun, permissionId) {
  const options = { feeLimit: feeLimitSun, callValue: 0 };
  if (permissionId != null) options.permissionId = permissionId;

  const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
    config.USDT_CONTRACT_ADDRESS,
    TRANSFER_SELECTOR,
    options,
    [
      { type: 'address', value: toAddress },
      { type: 'uint256', value: Math.round(amountUnits).toString() },
    ],
    fromAddress
  );
  return transaction;
}

module.exports = { DECIMALS, getUsdtBalance, buildUsdtTransfer };
