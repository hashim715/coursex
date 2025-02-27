/*
  Warnings:

  - You are about to drop the column `faternity` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "faternity",
ADD COLUMN     "fraternity" TEXT NOT NULL DEFAULT 'Sigma Alpha Epsilon';
