const swaggerJsDoc = require('swagger-jsdoc');
const config = require('./env');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blockchain-Based Bitcoin Monitoring System API',
      version: '1.0.0',
      description: `
### College Project: Bitcoin Monitoring System Backend
A complete, modular Node.js backend monitoring real Bitcoin wallets, balances, transactions, and UTXO confirmation states using Blockstream API and PostgreSQL with Prisma ORM.

**Features:**
- Wallet registration & monitoring management
- Real-time Bitcoin wallet balance & transaction inspection
- UTXO-based incoming and outgoing transaction classification
- Change output detection and fee tracking
- Dynamic confirmation calculation ($confirmations = Tip - BlockHeight + 1$)
- Automated background sync job running every ${config.monitoringIntervalSeconds} seconds
      `,
      contact: {
        name: 'Bitcoin Monitoring System Support'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local Development Server'
      }
    ],
    components: {
      schemas: {
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            address: { type: 'string', example: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx' },
            network: { type: 'string', example: 'testnet' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            txid: { type: 'string', example: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16' },
            walletId: { type: 'string', format: 'uuid' },
            direction: { type: 'string', enum: ['INCOMING', 'OUTGOING'], example: 'INCOMING' },
            amountSatoshis: { type: 'string', example: '50000' },
            amountBtc: { type: 'number', example: 0.0005 },
            confirmations: { type: 'integer', example: 6 },
            blockHeight: { type: 'integer', example: 2500120 },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED'], example: 'CONFIRMED' },
            feeSatoshis: { type: 'string', example: '1200' },
            feeBtc: { type: 'number', example: 0.000012 },
            transactionTimestamp: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message description' },
            details: { type: 'string', nullable: true }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
