const monitoringService = require('../src/services/monitoring.service');
const blockstreamService = require('../src/services/blockstream.service');

jest.mock('../src/services/blockstream.service');

describe('Monitoring Service - Business Logic', () => {
  const walletAddress = 'tb1qtargetwalletaddress12345';

  describe('parseTransactionUtxo (UTXO Model)', () => {
    test('should classify as INCOMING when wallet only appears in outputs', () => {
      const mockTx = {
        txid: 'tx1',
        fee: 1500,
        vin: [
          {
            prevout: {
              scriptpubkey_address: 'tb1qsenderaddress999',
              value: 100000
            }
          }
        ],
        vout: [
          {
            scriptpubkey_address: walletAddress,
            value: 40000
          },
          {
            scriptpubkey_address: 'tb1qsenderaddress999',
            value: 58500
          }
        ]
      };

      const result = monitoringService.parseTransactionUtxo(mockTx, walletAddress);
      expect(result.direction).toBe('INCOMING');
      expect(result.amountSatoshis).toBe(40000n);
      expect(result.feeSatoshis).toBe(1500n);
    });

    test('should classify as OUTGOING and account for change back to same address', () => {
      // Wallet spends 100,000 satoshis, sends 30,000 to recipient, and receives 68,000 back as change to itself
      const mockTx = {
        txid: 'tx2',
        fee: 2000,
        vin: [
          {
            prevout: {
              scriptpubkey_address: walletAddress,
              value: 100000
            }
          }
        ],
        vout: [
          {
            scriptpubkey_address: 'tb1qrecipientaddress777',
            value: 30000
          },
          {
            scriptpubkey_address: walletAddress, // change returned to same wallet
            value: 68000
          }
        ]
      };

      const result = monitoringService.parseTransactionUtxo(mockTx, walletAddress);
      expect(result.direction).toBe('OUTGOING');
      // Net amount spent = 100000 - 68000 = 32000 (30000 to recipient + 2000 fee)
      expect(result.amountSatoshis).toBe(32000n);
      expect(result.feeSatoshis).toBe(2000n);
    });

    test('should classify as OUTGOING when wallet spends all inputs without change to self', () => {
      const mockTx = {
        txid: 'tx3',
        fee: 1000,
        vin: [
          {
            prevout: {
              scriptpubkey_address: walletAddress,
              value: 50000
            }
          }
        ],
        vout: [
          {
            scriptpubkey_address: 'tb1qotheraddress888',
            value: 49000
          }
        ]
      };

      const result = monitoringService.parseTransactionUtxo(mockTx, walletAddress);
      expect(result.direction).toBe('OUTGOING');
      expect(result.amountSatoshis).toBe(50000n);
      expect(result.feeSatoshis).toBe(1000n);
    });
  });

  describe('calculateConfirmations', () => {
    test('should calculate confirmations correctly for confirmed transaction', () => {
      const currentBlockHeight = 2500010;
      const txStatus = {
        confirmed: true,
        block_height: 2500005,
        block_time: 1690000000
      };

      // confirmations = 2500010 - 2500005 + 1 = 6
      const result = monitoringService.calculateConfirmations(currentBlockHeight, txStatus);
      expect(result.confirmations).toBe(6);
      expect(result.status).toBe('CONFIRMED');
      expect(result.blockHeight).toBe(2500005);
      expect(result.transactionTimestamp).toBeInstanceOf(Date);
    });

    test('should return 0 confirmations and PENDING for unconfirmed mempool transaction', () => {
      const currentBlockHeight = 2500010;
      const txStatus = {
        confirmed: false
      };

      const result = monitoringService.calculateConfirmations(currentBlockHeight, txStatus);
      expect(result.confirmations).toBe(0);
      expect(result.status).toBe('PENDING');
      expect(result.blockHeight).toBeNull();
    });
  });

  describe('getWalletBalance', () => {
    test('should compute confirmed, unconfirmed, and total balances in sats and BTC', async () => {
      blockstreamService.getAddressInfo.mockResolvedValueOnce({
        address: walletAddress,
        chain_stats: {
          funded_txo_sum: 500000000, // 5 BTC
          spent_txo_sum: 200000000,  // 2 BTC
          tx_count: 5
        },
        mempool_stats: {
          funded_txo_sum: 50000000,  // 0.5 BTC unconfirmed incoming
          spent_txo_sum: 0,
          tx_count: 1
        }
      });

      const balance = await monitoringService.getWalletBalance(walletAddress, 'testnet');

      expect(balance.confirmed.satoshis).toBe('300000000');
      expect(balance.confirmed.btc).toBe(3);
      expect(balance.unconfirmed.satoshis).toBe('50000000');
      expect(balance.unconfirmed.btc).toBe(0.5);
      expect(balance.total.satoshis).toBe('350000000');
      expect(balance.total.btc).toBe(3.5);
    });
  });
});
