# swap-rc

Watches a hardcoded list of TRON wallets every second via TronGrid. Each wallet is
assigned one asset to watch - either TRX or USDT-TRC20. If a wallet's balance in its
assigned asset rises above that asset's threshold (default 5), it immediately sweeps the
balance (minus a small reserve, for TRX wallets) to a single collection wallet.

## How it works

- `src/wallets.js` - hardcoded list of `{ label, address, asset }` to watch (`asset` is `'trx'` or `'usdt'`, default `'trx'`; addresses are public, safe to commit).
- `src/config.js` - loads `.env`, pairs each wallet with its private key (`PK_<LABEL>`), validates required settings. Also pins `USDT_CONTRACT_ADDRESS` to the official Tron mainnet USDT-TRC20 contract (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`) unless explicitly overridden.
- `src/monitor.js` - every `POLL_INTERVAL_MS` (default 1000ms), fetches each wallet's balance: `tronWeb.trx.getBalance` for `trx` wallets, or `balanceOf` on the pinned USDT contract for `usdt` wallets. If it exceeds the matching threshold (`THRESHOLD_TRX` / `THRESHOLD_USDT`), calls `sweep.js`.
- `src/sweep.js` - builds, signs (with the wallet's own private key), and broadcasts a transfer to `COLLECTION_WALLET_ADDRESS`: a native TRX transfer for `trx` wallets, or a TRC20 `transfer(address,uint256)` call against the pinned USDT contract for `usdt` wallets.
- `src/trc20.js` - thin helper around the pinned USDT contract: reads balances and builds transfer transactions. It never looks up tokens by name/symbol - only ever this one hardcoded contract address, since scam tokens routinely clone USDT's name and symbol to trick sweepers.
- `src/server.js` - Express app bound to `127.0.0.1:PORT` only, exposing `/health` and `/status` (per-wallet asset, balance, last check, last sweep, last error). Nginx is the only thing that should ever reach it.
- Per-wallet state is in-memory: a `sweeping` flag prevents overlapping sweeps on the same wallet, and every sweep attempt (success or failure) triggers a `SWEEP_RETRY_COOLDOWN_MS` cooldown - both to back off a stuck/failing wallet and to give TronGrid's balance-read endpoint time to catch up with the just-confirmed block (it can lag a few seconds), which otherwise causes a stale-balance duplicate sweep attempt right after a successful one.

## Setup

1. `npm install`
2. Edit `src/wallets.js` - list every wallet address you want watched, with its `asset` (up to ~20 wallets total).
3. Copy `.env.example` to `.env` and fill in:
   - `TRONGRID_API_KEY` - from https://www.trongrid.io/ (required for reliable per-second polling of 10-20 wallets; the public rate limit will throttle you otherwise).
   - `COLLECTION_WALLET_ADDRESS` - where swept funds go.
   - `PK_<LABEL>` for every wallet in `src/wallets.js` (e.g. `wallet01` -> `PK_WALLET01`), the wallet's private key.
   - Tune `THRESHOLD_TRX`, `THRESHOLD_USDT`, `RESERVE_TRX`, `TRC20_FEE_LIMIT_TRX`, `POLL_INTERVAL_MS` if needed. Leave `USDT_CONTRACT_ADDRESS` blank unless you've personally verified a different contract.
4. `chmod 600 .env` and make sure it's owned by the app user only - it holds hot-wallet private keys.
5. Fund every `usdt`-asset wallet with a little TRX (or freeze TRX for energy on it) - USDT sweeps still cost TRX gas even though the swept asset itself is USDT.
6. Test locally: `npm start`, then `curl http://127.0.0.1:3300/status`.

## Running under PM2

```
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed instructions to enable boot-time restart
```

Logs land in `logs/out.log` / `logs/error.log`. `pm2 logs trx-sweeper` tails them live.

## Nginx

`nginx/swap-rc.conf` is a sample reverse proxy for the `/status` page. The app never
binds beyond `127.0.0.1`, so nginx (with HTTPS + an IP allowlist or basic auth) is the
only way to view status from outside the box. Copy it into
`/etc/nginx/sites-available/`, symlink into `sites-enabled`, then:

```
nginx -t && systemctl reload nginx
```

## Operational notes

- **Rate limits**: 10-20 wallets polled every second is 10-20 req/s to TronGrid. Use an API key (free tier covers this, but confirm your key's limit in the TronGrid dashboard if you add more wallets).
- **Reserve amount**: `RESERVE_TRX` (default 1 TRX) is left behind on `trx`-asset wallets so the sweep transaction itself has TRX to burn for bandwidth if the wallet has no free bandwidth left that day. Raise it if sweeps start failing with bandwidth errors; lower it once you've frozen TRX for bandwidth on each wallet. `usdt`-asset wallets sweep the full token balance (no reserve needed on the token side) but still need their own TRX/energy to pay for the contract call - see `TRC20_FEE_LIMIT_TRX`.
- **Threshold semantics**: the check is on *balance*, not on individual incoming transactions - if a wallet's total balance in its assigned asset is ever above that asset's threshold (`THRESHOLD_TRX` or `THRESHOLD_USDT`) it sweeps, regardless of how it got there.
- **Contract pinning**: `usdt`-asset wallets are only ever checked and swept against the single hardcoded `USDT_CONTRACT_ADDRESS` (the official Tron USDT contract by default). The service never enumerates a wallet's token holdings or matches by symbol/name, so a scam token that impersonates USDT is simply invisible to it.
- **Key handling**: private keys only ever live in `.env` (gitignored) and in memory. They are never written to logs or exposed via `/status`.
- **Failure isolation**: each wallet is checked and swept independently; one wallet's error or cooldown never blocks the others.
