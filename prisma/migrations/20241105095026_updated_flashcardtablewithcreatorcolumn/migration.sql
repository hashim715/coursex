/*
  Warnings:

  - You are about to drop the column `user_id` on the `FlashCard` table. All the data in the column will be lost.
  - Added the required column `creator` to the `FlashCard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FlashCard" DROP CONSTRAINT "FlashCard_user_id_fkey";

-- AlterTable
ALTER TABLE "FlashCard" DROP COLUMN "user_id",
ADD COLUMN     "creator" TEXT NOT NULL;
