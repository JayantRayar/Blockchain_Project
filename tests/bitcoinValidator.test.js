const {
  isValidBitcoinAddress,
  getAddressNetwork,
  isValidTxid
} = require('../src/utils/bitcoinValidator');

describe('Bitcoin Validator Utility', () => {
  describe('isValidBitcoinAddress', () => {
    test('should validate Mainnet Legacy (P2PKH) address', () => {
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Genesis address
      expect(isValidBitcoinAddress(address)).toBe(true);
      expect(isValidBitcoinAddress(address, 'mainnet')).toBe(true);
      expect(isValidBitcoinAddress(address, 'testnet')).toBe(false);
    });

    test('should validate Mainnet P2SH address', () => {
      const address = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
      expect(isValidBitcoinAddress(address)).toBe(true);
      expect(isValidBitcoinAddress(address, 'mainnet')).toBe(true);
    });

    test('should validate Mainnet Bech32 (SegWit) address', () => {
      const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
      expect(isValidBitcoinAddress(address)).toBe(true);
      expect(isValidBitcoinAddress(address, 'mainnet')).toBe(true);
      expect(isValidBitcoinAddress(address, 'testnet')).toBe(false);
    });

    test('should validate Testnet Legacy address (starts with m or n)', () => {
      const address = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn';
      expect(isValidBitcoinAddress(address)).toBe(true);
      expect(isValidBitcoinAddress(address, 'testnet')).toBe(true);
      expect(isValidBitcoinAddress(address, 'mainnet')).toBe(false);
    });

    test('should validate Testnet P2SH address (starts with 2)', () => {
      const address = '2MzQwSSnBHWHq3AePDCTCQVmmbg35uLePrR';
      expect(isValidBitcoinAddress(address)).toBe(true);
      expect(isValidBitcoinAddress(address, 'testnet')).toBe(true);
      expect(isValidBitcoinAddress(address, 'mainnet')).toBe(false);
    });

    test('should validate Testnet Bech32 address (starts with tb1)', () => {
      const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      expect(isValidBitcoinAddress(address)).toBe(true);
      expect(isValidBitcoinAddress(address, 'testnet')).toBe(true);
      expect(isValidBitcoinAddress(address, 'mainnet')).toBe(false);
    });

    test('should reject invalid Bitcoin addresses', () => {
      expect(isValidBitcoinAddress('')).toBe(false);
      expect(isValidBitcoinAddress(null)).toBe(false);
      expect(isValidBitcoinAddress(12345)).toBe(false);
      expect(isValidBitcoinAddress('0x71C...invalid')).toBe(false);
      expect(isValidBitcoinAddress('not_an_address')).toBe(false);
      expect(isValidBitcoinAddress('1short')).toBe(false);
    });
  });

  describe('getAddressNetwork', () => {
    test('should return mainnet for mainnet addresses', () => {
      expect(getAddressNetwork('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe('mainnet');
      expect(getAddressNetwork('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe('mainnet');
    });

    test('should return testnet for testnet addresses', () => {
      expect(getAddressNetwork('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')).toBe('testnet');
      expect(getAddressNetwork('mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn')).toBe('testnet');
    });

    test('should return null for invalid addresses', () => {
      expect(getAddressNetwork('invalid_string')).toBeNull();
      expect(getAddressNetwork(null)).toBeNull();
    });
  });

  describe('isValidTxid', () => {
    test('should accept valid 64-character hexadecimal txid', () => {
      const validTxid = 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';
      expect(isValidTxid(validTxid)).toBe(true);
    });

    test('should reject invalid txid formats', () => {
      expect(isValidTxid('tooShort')).toBe(false);
      expect(isValidTxid('f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e1Z')).toBe(false); // contains non-hex 'Z'
      expect(isValidTxid('')).toBe(false);
      expect(isValidTxid(null)).toBe(false);
      expect(isValidTxid(undefined)).toBe(false);
    });
  });
});
