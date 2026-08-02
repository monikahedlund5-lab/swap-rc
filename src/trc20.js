const tronWeb = require('./tronClient');
const config = require('./config');

const TRANSFER_SELECTOR = 'transfer(address,uint256)';

// USDT-TRC20's decimals are fixed at 6 by the deployed contract and cannot change, so this
// is hardcoded rather than queried on every poll.
const DECIMALS = 6;

let usdtContractPromise = null;
function getUsdtContract() {
  if (!usdtContractPromise) {
    usdtContractPromise = tronWeb.contract().at(config.USDT_CONTRACT_ADDRESS);
  }
  return usdtContractPromise;
}

async function getUsdtBalance(address) {
  const contract = await getUsdtContract();
  const raw = await contract.balanceOf(address).call();
  return Number(raw.toString());
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
