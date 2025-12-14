-- CreateTable
CREATE TABLE "kits" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "items" JSONB,
    "includeShirt" BOOLEAN NOT NULL DEFAULT true,
    "shirtRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_size_stocks" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kit_size_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kits_eventId_key" ON "kits"("eventId");

-- CreateIndex
CREATE INDEX "kit_size_stocks_kitId_idx" ON "kit_size_stocks"("kitId");

-- CreateIndex
CREATE UNIQUE INDEX "kit_size_stocks_kitId_size_key" ON "kit_size_stocks"("kitId", "size");

-- AddForeignKey
ALTER TABLE "kits" ADD CONSTRAINT "kits_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_size_stocks" ADD CONSTRAINT "kit_size_stocks_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
