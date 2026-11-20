const blockstreamService = require('../src/services/blockstream.service');
const axios = require('axios');

jest.mock('axios');

describe('Blockstream Service', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      get: jest.fn()
    };
    axios.create.mockReturnValue(mockAxiosInstance);
  });

  describe('getCurrentBlockHeight', () => {
    test('should fetch and parse tip height', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: 2598123 });

      const height = await blockstreamService.getCurrentBlockHeight('testnet');
      expect(height).toBe(2598123);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blocks/tip/height');
    });

    test('should throw formatted error on failure', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 500, data: 'Internal Server Error' }
      });

      await expect(blockstreamService.getCurrentBlockHeight('testnet'))
        .rejects.toThrow('Blockstream API error (500): Internal Server Error');
    });
  });

  describe('getAddressInfo', () => {
    test('should fetch address stats', async () => {
      const mockData = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        chain_stats: { funded_txo_sum: 100000, spent_txo_sum: 50000 }
      };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const res = await blockstreamService.getAddressInfo('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', 'testnet');
      expect(res).toEqual(mockData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    });
  });

  describe('getTransaction', () => {
    test('should fetch transaction details by txid', async () => {
      const mockTx = { txid: 'abc123', fee: 1000, status: { confirmed: true } };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockTx });

      const res = await blockstreamService.getTransaction('abc123', 'testnet');
      expect(res.txid).toBe('abc123');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tx/abc123');
    });
  });

  describe('Base URL resolution', () => {
    test('should select mainnet URL for mainnet network', () => {
      const url = blockstreamService.getBaseUrl('mainnet');
      expect(url).toBe('https://blockstream.info/api');
    });

    test('should select testnet URL for testnet network', () => {
      const url = blockstreamService.getBaseUrl('testnet');
      expect(url).toBe('https://blockstream.info/testnet/api');
    });
  });
});
