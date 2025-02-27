/*
  Warnings:

  - You are about to drop the column `verification_code` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "verification_code",
ADD COLUMN     "verification_secret" TEXT,
ADD COLUMN     "verification_token" TEXT;
