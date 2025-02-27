/*
  Warnings:

  - A unique constraint covering the columns `[chatbotName]` on the table `Assistant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatbotName` to the `Assistant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assistant" ADD COLUMN     "chatbotName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Assistant_chatbotName_key" ON "Assistant"("chatbotName");
