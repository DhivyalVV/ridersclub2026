-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sellerId" UUID NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "odometerKm" INTEGER NOT NULL DEFAULT 0,
    "askingPriceInr" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listingId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_listings_status_vehicleType_askingPriceInr_idx" ON "marketplace_listings"("status", "vehicleType", "askingPriceInr");

-- CreateIndex
CREATE INDEX "marketplace_listings_sellerId_idx" ON "marketplace_listings"("sellerId");

-- CreateIndex
CREATE INDEX "listing_photos_listingId_displayOrder_idx" ON "listing_photos"("listingId", "displayOrder");

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

