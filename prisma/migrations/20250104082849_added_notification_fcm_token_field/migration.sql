-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deviceToken" TEXT NOT NULL DEFAULT 'gshdgas';

-- AlterTable
ALTER TABLE "_UserGroups" ADD CONSTRAINT "_UserGroups_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserGroups_AB_unique";
