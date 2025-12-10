-- AlterTable
ALTER TABLE "events" ADD COLUMN     "landingAbout" JSONB,
ADD COLUMN     "landingFaq" JSONB,
ADD COLUMN     "landingSellingPoints" JSONB,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "supportWhatsapp" TEXT;
