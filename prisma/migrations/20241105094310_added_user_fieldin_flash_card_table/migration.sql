/*
  Warnings:

  - Added the required column `user_id` to the `FlashCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlashCard" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "FlashCard" ADD CONSTRAINT "FlashCard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
