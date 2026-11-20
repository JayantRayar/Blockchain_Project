const request = require('supertest');
const app = require('../src/app');
const blockstreamService = require('../src/services/blockstream.service');

jest.mock('../src/services/blockstream.service');

describe('REST API Integration Tests (Mocked DB & External Services)', () => {
  describe('General & System Health Endpoints', () => {
    test('GET / should return service info and documentation link', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Blockchain-Based Bitcoin Monitoring System API');
      expect(res.body.documentation).toBe('/api-docs');
    });

    test('GET /api/health should return system status and healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.monitoringJob).toBeDefined();
    });

    test('GET /unknown-route should return 404 JSON error', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Route not found');
    });
  });

  describe('Blockchain API Endpoints', () => {
    test('GET /api/blockchain/status should return current block height', async () => {
      blockstreamService.getCurrentBlockHeight.mockResolvedValueOnce(2600000);

      const res = await request(app).get('/api/blockchain/status?network=testnet');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentBlockHeight).toBe(2600000);
    });

    test('GET /api/blockchain/transactions/:txid should reject invalid txid with 400', async () => {
      const res = await request(app).get('/api/blockchain/transactions/invalid-txid');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid Bitcoin transaction hash');
    });

    test('GET /api/blockchain/transactions/:txid should return transaction details for valid txid', async () => {
      const validTxid = 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';
      blockstreamService.getTransaction.mockResolvedValueOnce({
        txid: validTxid,
        fee: 2500,
        size: 220,
        weight: 550,
        status: {
          confirmed: true,
          block_height: 2590000,
          block_time: 1690000000
        },
        vin: [],
        vout: []
      });
      blockstreamService.getCurrentBlockHeight.mockResolvedValueOnce(2590010);

      const res = await request(app).get(`/api/blockchain/transactions/${validTxid}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.txid).toBe(validTxid);
      expect(res.body.data.confirmations).toBe(11); // 2590010 - 2590000 + 1
      expect(res.body.data.feeSatoshis).toBe(2500);
    });
  });

  describe('Wallet Validation in Routes', () => {
    test('POST /api/wallets should reject request without address with 400', async () => {
      const res = await request(app)
        .post('/api/wallets')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/wallets should reject invalid Bitcoin address with 400', async () => {
      const res = await request(app)
        .post('/api/wallets')
        .send({ address: 'invalid_btc_address', network: 'testnet' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not a valid Bitcoin address');
    });

    test('PATCH /api/wallets/:id/status should reject non-boolean isActive with 400', async () => {
      const res = await request(app)
        .patch('/api/wallets/dummy-id/status')
        .send({ isActive: 'not_a_boolean' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('must be a boolean');
    });
  });

  describe('Monitoring Validation in Routes', () => {
    test('GET /api/monitoring/wallet/:address should reject invalid address parameter', async () => {
      const res = await request(app).get('/api/monitoring/wallet/badAddress123');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid Bitcoin address');
    });

    test('GET /api/monitoring/wallet/:address/balance should fetch balance for valid address', async () => {
      const validAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      blockstreamService.getAddressInfo.mockResolvedValueOnce({
        address: validAddress,
        chain_stats: { funded_txo_sum: 50000, spent_txo_sum: 20000, tx_count: 2 },
        mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 }
      });

      const res = await request(app).get(`/api/monitoring/wallet/${validAddress}/balance`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.confirmed.satoshis).toBe('30000');
    });
  });
});
