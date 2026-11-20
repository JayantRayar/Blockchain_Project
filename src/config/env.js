const dotenv = require('dotenv');

dotenv.config();

const network = process.env.BITCOIN_NETWORK || 'testnet';
const defaultBlockstreamUrl = network === 'mainnet'
  ? 'https://blockstream.info/api'
  : 'https://blockstream.info/testnet/api';

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  bitcoinNetwork: network,
  blockstreamApiUrl: (process.env.BLOCKSTREAM_API_URL || defaultBlockstreamUrl).replace(/\/+$/, ''),
  monitoringIntervalSeconds: parseInt(process.env.MONITORING_INTERVAL_SECONDS, 10) || 30,
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;
