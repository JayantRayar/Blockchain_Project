# Blockchain-Based Bitcoin Monitoring System – Backend

A complete, production-ready Node.js & Express.js backend for the college project **Blockchain-Based Bitcoin Monitoring System**.

This system monitors registered Bitcoin wallets, tracks real-time balances and transaction histories, handles UTXO input/output analysis (accounting for change outputs and miners' fees), calculates dynamic transaction confirmations, and automatically synchronizes on-chain states every 30 seconds with PostgreSQL using Prisma ORM.

---

## 1. Technology Stack

- **Runtime & Framework:** Node.js (v18+) & Express.js
- **Module System:** JavaScript CommonJS (`require` / `module.exports`)
- **Database & ORM:** PostgreSQL + Prisma ORM (v6.4.1)
- **Blockchain Data Provider:** Blockstream API (Testnet default & Mainnet support)
- **HTTP Client:** Axios with error handling and timeouts
- **Scheduled Jobs:** node-cron (concurrency-guarded execution)
- **Environment Management:** dotenv
- **API Documentation:** OpenAPI 3.0 via Swagger (`swagger-ui-express` & `swagger-jsdoc`)
- **Testing:** Jest + Supertest (unit and integration tests with mocked external services)

---

## 2. Architecture & Directory Structure

```
├── prisma/
│   └── schema.prisma             # PostgreSQL data model definitions & relations
├── src/
│   ├── config/
│   │   ├── env.js                # Environment configuration loader
│   │   ├── prisma.js             # Prisma client instance with BigInt JSON serialization
│   │   └── swagger.js            # Swagger/OpenAPI definition setup
│   ├── controllers/
│   │   ├── blockchain.controller.js  # Block tip height & live tx details
│   │   ├── monitoring.controller.js  # Live wallet balance, history & sync triggers
│   │   └── wallet.controller.js      # Wallet registration, listing, status update
│   ├── jobs/
│   │   └── monitor.job.js        # node-cron scheduled job (runs every 30 seconds)
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handler (Prisma, Axios & Express errors)
│   │   ├── notFound.js           # 404 handler
│   │   └── validator.js          # Bitcoin address & txid parameter validators
│   ├── routes/
│   │   ├── blockchain.routes.js  # /api/blockchain/*
│   │   ├── index.js              # Aggregated router & health check (/api/health)
│   │   ├── monitoring.routes.js  # /api/monitoring/*
│   │   └── wallet.routes.js      # /api/wallets/*
│   ├── services/
│   │   ├── blockstream.service.js # External Blockstream API client
│   │   ├── monitoring.service.js  # UTXO analysis, confirmation formulas, sync cycle
│   │   └── wallet.service.js      # Wallet CRUD & database persistence
│   ├── utils/
│   │   ├── bitcoinValidator.js   # Mainnet & Testnet address and 64-hex txid validation
│   │   ├── logger.js             # Structured timestamped console logger
│   │   └── responseFormatter.js  # Consistent JSON responses & Satoshi <-> BTC conversion
│   └── app.js                    # Express app initialization & middleware configuration
├── tests/
│   ├── api.test.js               # Supertest API endpoint integration tests
│   ├── bitcoinValidator.test.js  # Address and txid validation unit tests
│   ├── blockstream.service.test.js # Blockstream client mocked tests
│   ├── monitoring.service.test.js# UTXO logic & confirmation formula unit tests
│   └── responseFormatter.test.js # BigInt, BTC conversion & response tests
├── .env.example                  # Template configuration file
├── .gitignore                    # Git ignore file (excludes .env and node_modules)
├── package.json
├── README.md
└── server.js                     # HTTP server entry point & graceful shutdown
```

---

## 3. Database Design

Implemented with **Prisma ORM** mapping to **PostgreSQL**:

### Models

#### `Wallet` (`wallets` table)
| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary Key (`@default(uuid())`) |
| `address` | String | Bitcoin address (P2PKH, P2SH, or Bech32) |
| `network` | String | Bitcoin network (`testnet` or `mainnet`) |
| `isActive` | Boolean | Monitoring state flag (default: `true`) |
| `createdAt` | DateTime | Timestamp of registration |
| `updatedAt` | DateTime | Timestamp of last update |

- **Constraints & Indexes:**
  - Unique composite index: `@@unique([address, network])` (prevents registering the same address twice on the same network).
  - Indexes on `address`, `network`, and `isActive`.

#### `Transaction` (`transactions` table)
| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary Key (`@default(uuid())`) |
| `txid` | String | 64-hex Bitcoin transaction hash |
| `walletId` | String (UUID) | Foreign key referencing `Wallet(id)` (Cascade delete) |
| `direction` | String | `INCOMING` or `OUTGOING` |
| `amountSatoshis` | BigInt | Value in integer satoshis (no floating point) |
| `confirmations` | Int | Calculated block confirmations |
| `blockHeight` | Int? | Block height containing the transaction (`null` if pending) |
| `status` | String | `CONFIRMED` or `PENDING` |
| `feeSatoshis` | BigInt? | Transaction network fee in satoshis |
| `transactionTimestamp` | DateTime? | Block or confirmation timestamp |
| `createdAt` | DateTime | Timestamp record was created |
| `updatedAt` | DateTime | Timestamp record was updated |

- **Constraints & Indexes:**
  - Unique composite index: `@@unique([walletId, txid])` (prevents duplicate transaction records for the same wallet).
  - Indexes on `walletId`, `txid`, `status`, `direction`, and `createdAt`.

---

## 4. Bitcoin UTXO Model & Business Logic

### UTXO Input / Output Analysis
Bitcoin does not have account balances or simple sender-recipient pairs. Instead, transactions consume Unspent Transaction Outputs (**UTXOs**) from previous transactions (`vin`) and generate new transaction outputs (`vout`).

The system determines the direction and net amount for each wallet address using this logic:
1. **Inputs (`vin`):** Checks if any input `prevout.scriptpubkey_address` equals the monitored wallet address. Sums the total satoshis contributed by this address (`totalInputsFromWallet`).
2. **Outputs (`vout`):** Checks if any output `scriptpubkey_address` equals the monitored wallet address. Sums the total satoshis delivered to this address (`totalOutputsToWallet`).
3. **Change Output & Direction Calculation:**
   - **Outgoing Transaction:** If `totalInputsFromWallet > 0` and `totalInputsFromWallet >= totalOutputsToWallet`, the wallet sent funds. The net outgoing amount spent by this wallet is:
     $$\text{netSpent} = \text{totalInputsFromWallet} - \text{totalOutputsToWallet}$$
     This correctly subtracts any change returned to the wallet's own address.
   - **Incoming Transaction:** If `totalInputsFromWallet == 0` and `totalOutputsToWallet > 0`, the wallet solely received funds:
     $$\text{netReceived} = \text{totalOutputsToWallet}$$

### Confirmation Formula
- **Unconfirmed (Mempool):**
  $$\text{confirmations} = 0 \quad (\text{status} = \text{'PENDING'})$$
- **Confirmed Transaction:**
  $$\text{confirmations} = \text{currentBlockHeight} - \text{transactionBlockHeight} + 1 \quad (\text{status} = \text{'CONFIRMED'})$$

---

## 5. Automated Monitoring Job

- A background cron task (`src/jobs/monitor.job.js`) executes every **30 seconds** (configurable via `MONITORING_INTERVAL_SECONDS`).
- **Overlap Prevention:** Employs an atomic `isJobRunning` lock guard. If a previous sync cycle is still processing (e.g., waiting on external network response), the subsequent execution skips safely without queuing redundant operations.
- For each active wallet (`isActive = true`), the job:
  1. Requests recent transactions from the Blockstream API.
  2. Retrieves the current blockchain tip height.
  3. Evaluates transaction direction, satoshis, fees, and confirmations.
  4. Upserts records in PostgreSQL: updates confirmation count and block details for existing transactions, and inserts new transactions.

---

## 6. Setup & Installation Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your actual settings:
```env
PORT=5000
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE"
BITCOIN_NETWORK=testnet
BLOCKSTREAM_API_URL=https://blockstream.info/testnet/api
MONITORING_INTERVAL_SECONDS=30
```

### Step 3: Connect PostgreSQL & Apply Prisma Migrations
Once your PostgreSQL server is accessible and you have updated `DATABASE_URL` in `.env`:

1. **Generate the Prisma client:**
   ```bash
   npm run prisma:generate
   ```

2. **Run database migrations to create tables and indexes:**
   ```bash
   npm run prisma:migrate
   ```
   *(When prompted, you can name the migration, e.g. `init`)*

3. *(Optional)* **Inspect database records in a web browser GUI:**
   ```bash
   npm run prisma:studio
   ```

### Step 4: Run the Application
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

### Step 5: Run Tests
Run the test suite (executes without needing a live database connection):
```bash
npm test
```

---

## 7. Interactive API Documentation (Swagger UI)

When the server is running, visit:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

## 8. REST API Reference

### Health & System Status
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service description and links |
| `GET` | `/api/health` | System health, network info, and cron job status |

---

### Wallet APIs (`/api/wallets`)

#### 1. Register a Wallet
- **`POST /api/wallets`**
- **Request Body:**
  ```json
  {
    "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    "network": "testnet"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Wallet registered successfully",
    "data": {
      "id": "e7b0a88b-1234-4567-89ab-cdef01234567",
      "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      "network": "testnet",
      "isActive": true,
      "createdAt": "2026-11-20T15:00:00.000Z",
      "updatedAt": "2026-11-20T15:00:00.000Z"
    }
  }
  ```

#### 2. List Registered Wallets
- **`GET /api/wallets?page=1&limit=10&isActive=true&network=testnet`**
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Wallets retrieved successfully",
    "data": [
      {
        "id": "e7b0a88b-1234-4567-89ab-cdef01234567",
        "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        "network": "testnet",
        "isActive": true,
        "transactionCount": 12,
        "createdAt": "2026-11-20T15:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

#### 3. Get Wallet Details
- **`GET /api/wallets/:id`**

#### 4. Delete Wallet
- **`DELETE /api/wallets/:id`** (Deletes wallet and its transactions in cascade)

#### 5. Activate / Deactivate Monitoring
- **`PATCH /api/wallets/:id/status`**
- **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```

---

### Blockchain APIs (`/api/blockchain`)

#### 1. Current Block Height
- **`GET /api/blockchain/status?network=testnet`**
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Current blockchain status retrieved successfully",
    "data": {
      "network": "testnet",
      "currentBlockHeight": 2598341,
      "apiUrl": "https://blockstream.info/testnet/api",
      "timestamp": "2026-11-20T15:30:00.000Z"
    }
  }
  ```

#### 2. Live Blockchain Transaction Details
- **`GET /api/blockchain/transactions/:txid?network=testnet`**
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Transaction details retrieved successfully",
    "data": {
      "txid": "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16",
      "network": "testnet",
      "currentBlockHeight": 2598341,
      "confirmations": 15,
      "isConfirmed": true,
      "blockHeight": 2598327,
      "feeSatoshis": 2500,
      "feeBtc": 0.000025,
      "inputs": [...],
      "outputs": [...]
    }
  }
  ```

---

### Monitoring APIs (`/api/monitoring`)

#### 1. Wallet Monitoring Information
- **`GET /api/monitoring/wallet/:address`**
- Returns database registration state, monitoring activity flag, live balance summary, and current tip height.

#### 2. Real-Time Wallet Balance
- **`GET /api/monitoring/wallet/:address/balance`**
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Wallet balance retrieved successfully",
    "data": {
      "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      "network": "testnet",
      "confirmed": {
        "satoshis": "300000",
        "btc": 0.003,
        "txCount": 5
      },
      "unconfirmed": {
        "satoshis": "50000",
        "btc": 0.0005,
        "txCount": 1
      },
      "total": {
        "satoshis": "350000",
        "btc": 0.0035,
        "txCount": 6
      }
    }
  }
  ```

#### 3. Wallet Transaction History
- **`GET /api/monitoring/wallet/:address/transactions?page=1&limit=10&direction=INCOMING&status=CONFIRMED`**
- Returns paginated transaction records with satoshi amounts, BTC conversion, confirmations, and block details.

#### 4. All Monitored Transactions
- **`GET /api/monitoring/transactions?page=1&limit=10&direction=OUTGOING&status=CONFIRMED`**

#### 5. Monitored Transaction Details
- **`GET /api/monitoring/transactions/:txid`**
- Returns both the stored PostgreSQL transaction record and the live Blockstream on-chain data.

#### 6. Trigger Immediate Sync
- **`POST /api/monitoring/sync`**
- Manually initiates an immediate synchronization cycle across all active wallets.

---

## 9. Error Handling & Validation

- **Bitcoin Address Validation:** Addresses are validated using regex patterns for Mainnet (`1...`, `3...`, `bc1...`) and Testnet (`m/n...`, `2...`, `tb1...`).
- **Transaction Hash Validation:** Ensures transaction hashes are exact 64-character hexadecimal strings.
- **Centralized Error Handling:** Standardized error responses across all endpoints (`{ success: false, message: "...", details: null }`).
- **BigInt JSON Serialization:** Safely serializes PostgreSQL 64-bit BigInt satoshi fields without runtime conversion crashes.
