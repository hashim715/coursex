/*
  Warnings:

  - You are about to drop the column `user_id` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `clubs` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fraternity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `relationship_status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `theme_color` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_adminId_fkey";

-- AlterTable
ALTER TABLE "Album" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "adminId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio",
DROP COLUMN "clubs",
DROP COLUMN "cover_image",
DROP COLUMN "fraternity",
DROP COLUMN "relationship_status",
DROP COLUMN "theme",
DROP COLUMN "theme_color";
