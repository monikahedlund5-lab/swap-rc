// In-memory status per wallet, used by the poller and exposed via the /status endpoint.
const state = new Map();

function get(address) {
  if (!state.has(address)) {
    state.set(address, {
      balanceSun: null,
      lastCheckAt: null,
      lastError: null,
      sweeping: false,
      cooldownUntil: 0,
      lastSweepAt: null,
      lastSweepTxId: null,
      sweepCount: 0,
    });
  }
  return state.get(address);
}

function snapshot() {
  const out = {};
  for (const [address, s] of state.entries()) {
    out[address] = { ...s, balanceTrx: s.balanceSun === null ? null : s.balanceSun / 1_000_000 };
  }
  return out;
}

module.exports = { get, snapshot };
