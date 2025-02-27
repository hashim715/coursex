/*
  Warnings:

  - You are about to drop the `Album` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Album";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "Job";

-- CreateTable
CREATE TABLE "Documents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
