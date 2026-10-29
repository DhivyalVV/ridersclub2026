-- CreateEnum
CREATE TYPE "MechanicVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "mechanic_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceCategories" TEXT[],
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactPhonePublic" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "MechanicVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByAdminId" UUID,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mechanic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mechanic_profiles_ownerId_key" ON "mechanic_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "mechanic_profiles_city_idx" ON "mechanic_profiles"("city");

-- CreateIndex
CREATE INDEX "mechanic_profiles_verificationStatus_idx" ON "mechanic_profiles"("verificationStatus");

-- AddForeignKey
ALTER TABLE "mechanic_profiles" ADD CONSTRAINT "mechanic_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mechanic_profiles" ADD CONSTRAINT "mechanic_profiles_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

