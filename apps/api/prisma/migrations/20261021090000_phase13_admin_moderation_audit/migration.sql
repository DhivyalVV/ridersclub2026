-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('BLOG', 'COMMUNITY', 'USER', 'HELP_REQUEST', 'MECHANIC', 'LISTING');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'ACTIONED', 'DISMISSED');

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporterId" UUID NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_reports_status_createdAt_idx" ON "content_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "content_reports_targetType_targetId_idx" ON "content_reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_audit_logs_actorId_createdAt_idx" ON "moderation_audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_audit_logs_targetType_targetId_idx" ON "moderation_audit_logs"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_audit_logs" ADD CONSTRAINT "moderation_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

