// Hardcoded set of TRON hot wallets to watch. Addresses are public, safe to commit.
// Add up to ~20 entries. Each entry's private key lives in .env as PK_<LABEL uppercased>,
// e.g. label "wallet01" reads process.env.PK_WALLET01.
//
// asset ('trx' | 'usdt', default 'trx'): which balance this wallet is watched and swept
// for. 'usdt' wallets are only ever checked/swept against the single hardcoded official
// USDT-TRC20 contract in config.js (USDT_CONTRACT_ADDRESS) - never against a token found
// by name/symbol in the wallet, since scam tokens routinely clone USDT's name and symbol.
//
// permissionId (optional): set this if the wallet's owner permission was reassigned to
// a different address (check TronScan "Permissions" tab). Transfers only need the active
// permission - find its id via `GET /v1/accounts/{address}` (active_permission[].id, 2 by
// default) - and PK_<LABEL> must be the private key of the address listed under that
// active permission's "keys", not the new owner address.
module.exports = [
  { label: 'wallet01', address: 'TPwh57URmiWRCNJq2eUXBidfVm4yHRJnWz', permissionId: 2, asset: 'trx' },
  // usdt sweeping paused - re-enable by uncommenting
  // { label: 'wallet02', address: 'TWzZfuUZ7W7sRssAY5eN1w75RcRPyz1zHZ', asset: 'usdt', permissionId: 2 },
  // { label: 'wallet03', address: 'T...', asset: 'trx' },
  // ... add the rest of your wallets here
];
