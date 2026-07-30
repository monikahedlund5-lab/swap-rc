const { TronWeb } = require('tronweb');
const config = require('./config');

const tronWeb = new TronWeb({
  fullHost: config.FULL_HOST,
  headers: config.TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': config.TRONGRID_API_KEY } : {},
});

module.exports = tronWeb;
