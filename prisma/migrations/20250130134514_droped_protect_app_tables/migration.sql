/*
  Warnings:

  - You are about to drop the `ProtectAppPosts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProtectAppUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProtectAppPosts" DROP CONSTRAINT "ProtectAppPosts_user_id_fkey";

-- DropTable
DROP TABLE "ProtectAppPosts";

-- DropTable
DROP TABLE "ProtectAppUsers";
