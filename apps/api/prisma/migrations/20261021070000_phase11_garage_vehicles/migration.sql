-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'CAR');

-- CreateTable
CREATE TABLE "garage_vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "type" "VehicleType" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "registrationLabel" TEXT,
    "currentOdometerKm" INTEGER NOT NULL DEFAULT 0,
    "nextReminderLabel" TEXT,
    "nextServiceOdometerKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garage_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_service_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicleId" UUID NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "costInr" INTEGER NOT NULL DEFAULT 0,
    "workshopName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicleId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "garage_vehicles_ownerId_idx" ON "garage_vehicles"("ownerId");

-- CreateIndex
CREATE INDEX "vehicle_service_records_vehicleId_serviceDate_idx" ON "vehicle_service_records"("vehicleId", "serviceDate");

-- CreateIndex
CREATE INDEX "vehicle_notes_vehicleId_idx" ON "vehicle_notes"("vehicleId");

-- AddForeignKey
ALTER TABLE "garage_vehicles" ADD CONSTRAINT "garage_vehicles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_service_records" ADD CONSTRAINT "vehicle_service_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "garage_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_notes" ADD CONSTRAINT "vehicle_notes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "garage_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

