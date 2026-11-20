# BlockWatch – Cryptocurrency Monitoring Dashboard (Frontend)

**BlockWatch** is a responsive, professional Bitcoin monitoring frontend built with **React**, **Vite**, and **Tailwind CSS**. Designed with visual inspiration from crypto exchanges like **Binance** and **Bitget**, it provides real-time portfolio statistics, live UTXO transaction inspection, automated block tip tracking, and seamless wallet management.

---

## 1. Tech Stack

- **Framework & Tooling:** React.js + Vite (ESM)
- **Styling:** Tailwind CSS (Navy / Charcoal dark theme, subtle emerald & cyan accents, crypto-terminal typography)
- **HTTP Client:** Axios (Centralized API client with response interceptors)
- **Routing:** React Router DOM v7
- **Charts:** Recharts (Responsive transaction volume & flow curves)
- **Icons:** Lucide React

---

## 2. Design System & Aesthetics

- **Dark Theme Palette:**
  - Base Background: Deep Charcoal / Navy (`#0b0e14`, `#0c1017`)
  - Elevated Cards & Panes: Card Charcoal (`#121721`, `#141a26`)
  - Borders & Outlines: Subtle Slate Gridlines (`#1e2638`, `#222c40`)
  - Accents:
    - **Confirmed / Incoming:** Crisp Emerald Green (`#0ecb81`, `#10b981`)
    - **Outgoing / Alert:** Vivid Rose Red (`#f6465d`, `#f43f5e`)
    - **Pending / Mempool:** Amber Gold (`#f0b90b`, `#f59e0b`)
    - **Network / Protocol:** Cyan / Sky (`#06b6d4`, `#38bdf8`)
- **Typography:**
  - Tabular monospace numbers for Bitcoin addresses, 64-hex transaction hashes, satoshis, and BTC quantities.
- **Micro-Interactions:**
  - One-click copy with instant checkmark feedback.
  - Live tip block height counter with pulsing connectivity dot.
  - Toast notifications system with auto-dismiss and color-coded status banners.
  - Delete wallet confirmation modal to prevent accidental data loss.

---

## 3. Pages & Features

### 1. Dashboard (`/`)
- Aggregated real-time metrics:
  - Total Monitored Wallets (Active vs Paused).
  - Total Portfolio Balance (BTC & Satoshis).
  - Confirmed Balance vs Unconfirmed (Mempool) Balance.
- Interactive Recharts volume chart plotting recent transaction values.
- Real-time Bitcoin tip block height and 30-second automated sync indicator.
- Recent transactions ledger with quick status tags and one-click copy.
- Quick "Register Wallet" modal.

### 2. Wallets (`/wallets`)
- Complete wallet registry table.
- Search filter by Bitcoin address (e.g. `tb1q...`).
- Network filter (Testnet / Mainnet).
- Active monitoring toggle switch (`PATCH /api/wallets/:id/status`).
- Detailed wallet inspection drawer:
  - Live balance breakdown (Confirmed, Unconfirmed, Total in satoshis & BTC).
  - Recent transaction history for the selected wallet.
- Delete wallet action with confirmation dialog (`DELETE /api/wallets/:id`).
- Register wallet modal supporting SegWit Bech32 (`tb1`/`bc1`), Legacy P2PKH (`m`/`n`/`1`), and Script P2SH (`2`/`3`).

### 3. Transactions (`/transactions`)
- Transaction ledger with pagination and filters:
  - Direction Filter: All, Incoming, Outgoing.
  - Status Filter: All, Confirmed, Pending.
  - Hash Search: Direct lookup by 64-character hex `txid`.
- Detailed Transaction Inspection Modal:
  - Txid, Block Height, Confirmations, Fee (satoshis & BTC), Size, Weight.
  - Full UTXO inputs list (`vin` addresses and spent values).
  - Full UTXO outputs list (`vout` addresses and created values).
  - External link to inspect directly on the Blockstream Explorer.

### 4. Blockchain Status (`/status`)
- Network protocol and tip block height monitor.
- Blockstream API health status and base URL display.
- Manual sync trigger button (`POST /api/monitoring/sync`) with live results display.
- Direct on-chain transaction lookup tool:
  - Inspects any Bitcoin transaction on-chain via Blockstream API.

### 5. Settings (`/settings`)
- Application environment details and backend connectivity state.
- Technical documentation explaining UTXO change detection:
  $$netSpentSatoshis = totalInputsFromWallet - totalOutputsToSameWallet$$
- Confirmation formula documentation:
  $$confirmations = currentBlockHeight - transactionBlockHeight + 1$$
- Direct links to Blockstream Explorers, Bitcoin testnet faucets, and Swagger API docs (`http://localhost:5000/api-docs`).

---

## 4. Setup & Running Instructions

### Prerequisites
Make sure the BlockWatch backend is running on `http://localhost:5000`.

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Start the Development Server
```bash
npm run dev
```
The frontend will be available at:
👉 **[http://localhost:3000](http://localhost:3000)** (or the port specified by Vite).

### Step 4: Build for Production
```bash
npm run build
```
Creates an optimized production bundle inside `frontend/dist/`.
