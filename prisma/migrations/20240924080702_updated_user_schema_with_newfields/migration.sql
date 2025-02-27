/*
  Warnings:

  - Made the column `image` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cover_image" TEXT NOT NULL DEFAULT 'https://cdn1.iconfinder.com/data/icons/user-pics/512/user_add-512.png',
ADD COLUMN     "faternity" TEXT,
ADD COLUMN     "relationship_status" TEXT,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'https://assets.api.uizard.io/api/cdn/stream/e16a6e9f-6b62-42cd-a233-9b3620639bd2.jpg',
ALTER COLUMN "courses" DROP DEFAULT,
ALTER COLUMN "image" SET NOT NULL;
