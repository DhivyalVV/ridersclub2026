-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "rides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "estimatedDistanceKm" INTEGER NOT NULL DEFAULT 85,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 120,
    "status" "RideStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rideId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rides_status_departureAt_idx" ON "rides"("status", "departureAt");

-- CreateIndex
CREATE INDEX "rides_organizerId_idx" ON "rides"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "ride_participants_rideId_userId_key" ON "ride_participants"("rideId", "userId");

-- CreateIndex
CREATE INDEX "ride_participants_rideId_idx" ON "ride_participants"("rideId");

-- CreateIndex
CREATE INDEX "ride_participants_userId_idx" ON "ride_participants"("userId");

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_participants" ADD CONSTRAINT "ride_participants_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_participants" ADD CONSTRAINT "ride_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

