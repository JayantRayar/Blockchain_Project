-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amountSatoshis" BIGINT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "blockHeight" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feeSatoshis" BIGINT,
    "transactionTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallets_address_idx" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_network_idx" ON "wallets"("network");

-- CreateIndex
CREATE INDEX "wallets_isActive_idx" ON "wallets"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_network_key" ON "wallets"("address", "network");

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_txid_idx" ON "transactions"("txid");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_direction_idx" ON "transactions"("direction");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_walletId_txid_key" ON "transactions"("walletId", "txid");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
