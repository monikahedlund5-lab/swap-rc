// Hardcoded set of TRON hot wallets to watch. Addresses are public, safe to commit.
// Add up to ~20 entries. Each entry's private key lives in .env as PK_<LABEL uppercased>,
// e.g. label "wallet01" reads process.env.PK_WALLET01.
module.exports = [
  { label: 'wallet01', address: 'TPwh57URmiWRCNJq2eUXBidfVm4yHRJnWz' },
  { label: 'wallet02', address: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
  // { label: 'wallet03', address: 'T...' },
  // ... add the rest of your wallets here
];
