/*
  Warnings:

  - Added the required column `percent_done` to the `AssistantDocuments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signed_url` to the `AssistantDocuments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `AssistantDocuments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AssistantDocuments" ADD COLUMN     "percent_done" INTEGER NOT NULL,
ADD COLUMN     "signed_url" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;
