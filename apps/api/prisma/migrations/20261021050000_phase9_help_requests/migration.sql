-- CreateEnum
CREATE TYPE "HelpRequestStatus" AS ENUM ('OPEN', 'ASSISTANCE_OFFERED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HelpCategory" AS ENUM ('EMERGENCY_BREAKDOWN', 'FLAT_TIRE', 'OUT_OF_FUEL', 'BATTERY_JUMP', 'ACCIDENT_SUPPORT', 'OTHER');

-- CreateTable
CREATE TABLE "help_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL,
    "category" "HelpCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "vehicleSummary" TEXT,
    "status" "HelpRequestStatus" NOT NULL DEFAULT 'OPEN',
    "locationConsentGranted" BOOLEAN NOT NULL DEFAULT false,
    "locationLabel" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_request_offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "helpRequestId" UUID NOT NULL,
    "helperId" UUID NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_request_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "help_requests_status_createdAt_idx" ON "help_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "help_requests_requesterId_idx" ON "help_requests"("requesterId");

-- CreateIndex
CREATE INDEX "help_requests_category_idx" ON "help_requests"("category");

-- CreateIndex
CREATE INDEX "help_request_offers_helpRequestId_idx" ON "help_request_offers"("helpRequestId");

-- CreateIndex
CREATE INDEX "help_request_offers_helperId_idx" ON "help_request_offers"("helperId");

-- CreateIndex
CREATE UNIQUE INDEX "help_request_offers_helpRequestId_helperId_key" ON "help_request_offers"("helpRequestId", "helperId");

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_request_offers" ADD CONSTRAINT "help_request_offers_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "help_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_request_offers" ADD CONSTRAINT "help_request_offers_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

