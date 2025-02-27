/*
  Warnings:

  - You are about to drop the column `time` on the `Event` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "time",
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;
