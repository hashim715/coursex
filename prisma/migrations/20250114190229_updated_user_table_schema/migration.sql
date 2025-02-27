-- AlterTable
ALTER TABLE "User" ALTER COLUMN "blocked_users" SET DEFAULT ARRAY[]::TEXT[];
