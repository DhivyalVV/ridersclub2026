-- AlterEnum
BEGIN;
CREATE TYPE "ModerationTargetType_new" AS ENUM ('NEWS', 'COMMUNITY', 'USER', 'HELP_REQUEST', 'MECHANIC', 'LISTING');
ALTER TABLE "content_reports" ALTER COLUMN "targetType" TYPE "ModerationTargetType_new" USING ("targetType"::text::"ModerationTargetType_new");
ALTER TABLE "moderation_audit_logs" ALTER COLUMN "targetType" TYPE "ModerationTargetType_new" USING ("targetType"::text::"ModerationTargetType_new");
ALTER TYPE "ModerationTargetType" RENAME TO "ModerationTargetType_old";
ALTER TYPE "ModerationTargetType_new" RENAME TO "ModerationTargetType";
DROP TYPE "public"."ModerationTargetType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "blog_comments" DROP CONSTRAINT "blog_comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "blog_comments" DROP CONSTRAINT "blog_comments_blogId_fkey";

-- DropForeignKey
ALTER TABLE "blog_reactions" DROP CONSTRAINT "blog_reactions_blogId_fkey";

-- DropForeignKey
ALTER TABLE "blog_reactions" DROP CONSTRAINT "blog_reactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "blogs" DROP CONSTRAINT "blogs_authorId_fkey";

-- DropTable
DROP TABLE "blog_comments";

-- DropTable
DROP TABLE "blog_reactions";

-- DropTable
DROP TABLE "blogs";

-- CreateTable
CREATE TABLE "news_articles" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT[],
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_comments" (
    "id" UUID NOT NULL,
    "newsId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_reactions" (
    "id" UUID NOT NULL,
    "newsId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_slug_key" ON "news_articles"("slug");

-- CreateIndex
CREATE INDEX "news_articles_authorId_idx" ON "news_articles"("authorId");

-- CreateIndex
CREATE INDEX "news_articles_createdAt_idx" ON "news_articles"("createdAt");

-- CreateIndex
CREATE INDEX "news_comments_newsId_createdAt_idx" ON "news_comments"("newsId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "news_reactions_newsId_userId_key" ON "news_reactions"("newsId", "userId");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
