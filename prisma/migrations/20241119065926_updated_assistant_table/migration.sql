/*
  Warnings:

  - You are about to drop the column `chatbotName` on the `User` table. All the data in the column will be lost.
  - Added the required column `group_id` to the `Assistant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Assistant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assistant" ADD COLUMN     "group_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "chatbotName";

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
