/*
  Warnings:

  - You are about to drop the column `forgotpassword_secret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `forgotpassword_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `forgotpassword_token_expiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isUserVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordVerification` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_number]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "forgotpassword_secret",
DROP COLUMN "forgotpassword_token",
DROP COLUMN "forgotpassword_token_expiry",
DROP COLUMN "isUserVerified",
DROP COLUMN "password",
DROP COLUMN "resetPasswordVerification",
ADD COLUMN     "isUserRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_number" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "image" SET DEFAULT 'https://assets.api.uizard.io/api/cdn/stream/a66d2907-c3f9-47b0-bf0f-db5ef51dee62.jpg',
ALTER COLUMN "year" DROP NOT NULL,
ALTER COLUMN "year" SET DEFAULT '',
ALTER COLUMN "major" DROP NOT NULL,
ALTER COLUMN "major" SET DEFAULT '',
ALTER COLUMN "courses" DROP NOT NULL,
ALTER COLUMN "courses" SET DEFAULT 'None shared yet';

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");
