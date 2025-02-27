-- AlterTable
ALTER TABLE "User" ALTER COLUMN "theme" SET DEFAULT 'https://w0.peakpx.com/wallpaper/469/175/HD-wallpaper-pitch-black-dark-phone-plain-solid-thumbnail.jpg',
ALTER COLUMN "theme_color" SET DEFAULT '000000';

-- CreateTable
CREATE TABLE "FlashCard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "questions" TEXT[],
    "answers" TEXT[],
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "FlashCard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FlashCard" ADD CONSTRAINT "FlashCard_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
