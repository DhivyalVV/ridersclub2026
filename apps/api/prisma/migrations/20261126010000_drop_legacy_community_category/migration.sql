-- DropIndex
DROP INDEX IF EXISTS "communities_category_idx";

-- AlterTable
ALTER TABLE "communities" DROP COLUMN IF EXISTS "category";

-- AlterTable
ALTER TABLE "garage_vehicles" DROP COLUMN IF EXISTS "nextReminderLabel",
DROP COLUMN IF EXISTS "nextServiceOdometerKm";
