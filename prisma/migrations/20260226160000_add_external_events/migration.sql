-- CreateEnum
CREATE TYPE "ExternalEventSource" AS ENUM ('FCAT');

-- CreateEnum
CREATE TYPE "ExternalEventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "external_events" (
    "id" TEXT NOT NULL,
    "source" "ExternalEventSource" NOT NULL,
    "sourceExternalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT NOT NULL DEFAULT 'CE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "displayPeriod" TEXT,
    "officialUrl" TEXT,
    "sourceUrl" TEXT,
    "imageUrl" TEXT,
    "shortDescription" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExternalEventStatus" NOT NULL DEFAULT 'APPROVED',
    "dataHash" TEXT,
    "rawPayload" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_events_source_sourceExternalId_key" ON "external_events"("source", "sourceExternalId");

-- CreateIndex
CREATE INDEX "external_events_status_startDate_idx" ON "external_events"("status", "startDate");

-- CreateIndex
CREATE INDEX "external_events_isFeatured_startDate_idx" ON "external_events"("isFeatured", "startDate");
