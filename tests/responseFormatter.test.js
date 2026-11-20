const {
  satoshisToBtc,
  formatTransaction,
  success,
  paginated,
  error
} = require('../src/utils/responseFormatter');

describe('Response Formatter Utility', () => {
  describe('satoshisToBtc', () => {
    test('should convert 100,000,000 satoshis to 1 BTC', () => {
      expect(satoshisToBtc(100000000)).toBe(1);
    });

    test('should convert BigInt satoshis accurately', () => {
      expect(satoshisToBtc(50000000n)).toBe(0.5);
    });

    test('should return 0 for null or undefined', () => {
      expect(satoshisToBtc(null)).toBe(0);
      expect(satoshisToBtc(undefined)).toBe(0);
    });

    test('should correctly handle small satoshi amounts', () => {
      expect(satoshisToBtc(1000)).toBe(0.00001);
    });
  });

  describe('formatTransaction', () => {
    test('should format transaction with satoshis and btc equivalents', () => {
      const rawTx = {
        id: 'uuid-1',
        txid: 'abc123hex',
        walletId: 'w-1',
        direction: 'INCOMING',
        amountSatoshis: 100000000n,
        feeSatoshis: 2500n,
        confirmations: 10,
        status: 'CONFIRMED'
      };

      const formatted = formatTransaction(rawTx);
      expect(formatted.amountSatoshis).toBe('100000000');
      expect(formatted.amountBtc).toBe(1);
      expect(formatted.feeSatoshis).toBe('2500');
      expect(formatted.feeBtc).toBe(0.000025);
    });

    test('should return null if input is falsy', () => {
      expect(formatTransaction(null)).toBeNull();
    });
  });

  describe('HTTP responses', () => {
    let mockRes;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });

    test('success() sends standard 200 format', () => {
      success(mockRes, { foo: 'bar' }, 'OK', 200);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
        data: { foo: 'bar' }
      });
    });

    test('paginated() sends pagination metadata', () => {
      paginated(mockRes, [1, 2, 3], { page: 1, limit: 10, totalCount: 25 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: [1, 2, 3],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    test('error() sends standard error shape', () => {
      error(mockRes, 'Not Found', 404, 'Additional info');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Found',
        details: 'Additional info'
      });
    });
  });
});
