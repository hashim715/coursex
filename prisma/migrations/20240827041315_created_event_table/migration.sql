-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "image" TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/1911/1911087.png',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
