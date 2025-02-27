-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "theme_name" TEXT NOT NULL,
    "album_cover" TEXT NOT NULL,
    "album_photos" TEXT[],

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
