-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isbioDataUpdated" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "image" SET DEFAULT 'https://assets.api.uizard.io/api/cdn/stream/72aa7c72-8bd6-4874-b4ad-36a00b6d5bf2.png',
ALTER COLUMN "cover_image" SET DEFAULT 'https://assets.api.uizard.io/api/cdn/stream/72aa7c72-8bd6-4874-b4ad-36a00b6d5bf2.png';
