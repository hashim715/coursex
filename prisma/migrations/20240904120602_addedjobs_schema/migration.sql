-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "postingDate" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "college" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
