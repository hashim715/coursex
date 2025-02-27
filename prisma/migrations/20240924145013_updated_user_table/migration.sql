/*
  Warnings:

  - Made the column `college` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `faternity` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `relationship_status` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `major` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `courses` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "college" SET NOT NULL,
ALTER COLUMN "college" SET DEFAULT 'University of Houston-Downtown',
ALTER COLUMN "faternity" SET NOT NULL,
ALTER COLUMN "faternity" SET DEFAULT 'Sigma Alpha Epsilon',
ALTER COLUMN "relationship_status" SET NOT NULL,
ALTER COLUMN "relationship_status" SET DEFAULT 'Single',
ALTER COLUMN "year" SET NOT NULL,
ALTER COLUMN "year" SET DEFAULT 'Freshmen',
ALTER COLUMN "major" SET NOT NULL,
ALTER COLUMN "major" SET DEFAULT 'Majors',
ALTER COLUMN "courses" SET NOT NULL,
ALTER COLUMN "courses" SET DEFAULT 'courses';
