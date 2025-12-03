-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD_OUT', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchType" AS ENUM ('DATE', 'VOLUME');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mpConnected" BOOLEAN NOT NULL DEFAULT false,
    "mpUserId" TEXT,
    "mpAccessToken" TEXT,
    "mpRefreshToken" TEXT,
    "mpPublicKey" TEXT,
    "mpTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'NOT_INFORMED',
    "receiveMarketing" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_addresses" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',

    CONSTRAINT "participant_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "bannerUrl" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "maxRegistrations" INTEGER,
    "allowGroupReg" BOOLEAN NOT NULL DEFAULT true,
    "maxGroupSize" INTEGER NOT NULL DEFAULT 10,
    "customDomain" TEXT,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_locations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venueName" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "event_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalities" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "maxSlots" INTEGER,
    "soldSlots" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BatchType" NOT NULL DEFAULT 'DATE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxSales" INTEGER,
    "currentSales" INTEGER NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "modalityIds" TEXT[],
    "minPurchase" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "modalityId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "buyerId" TEXT,
    "couponId" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "registrationNumber" INTEGER NOT NULL,
    "shirtSize" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "medicalInfo" TEXT,
    "teamName" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "dataPrivacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhooks" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpfCnpj_key" ON "users"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_mpUserId_key" ON "users"("mpUserId");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_userId_key" ON "addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_email_key" ON "participants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "participants_cpf_key" ON "participants"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "participant_addresses_participantId_key" ON "participant_addresses"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_customDomain_key" ON "events"("customDomain");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_eventDate_idx" ON "events"("eventDate");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "events"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "event_locations_eventId_key" ON "event_locations"("eventId");

-- CreateIndex
CREATE INDEX "modalities_eventId_idx" ON "modalities"("eventId");

-- CreateIndex
CREATE INDEX "batches_eventId_idx" ON "batches"("eventId");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_eventId_code_key" ON "coupons"("eventId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_paymentId_key" ON "registrations"("paymentId");

-- CreateIndex
CREATE INDEX "registrations_eventId_idx" ON "registrations"("eventId");

-- CreateIndex
CREATE INDEX "registrations_participantId_idx" ON "registrations"("participantId");

-- CreateIndex
CREATE INDEX "registrations_paymentId_idx" ON "registrations"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_eventId_registrationNumber_key" ON "registrations"("eventId", "registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhooks_requestId_key" ON "processed_webhooks"("requestId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_addresses" ADD CONSTRAINT "participant_addresses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalities" ADD CONSTRAINT "modalities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "modalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
