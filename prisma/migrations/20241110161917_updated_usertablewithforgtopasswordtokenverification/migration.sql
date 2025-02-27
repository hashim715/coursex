-- AlterTable
ALTER TABLE "User" ADD COLUMN     "forgotpassword_secret" TEXT,
ADD COLUMN     "forgotpassword_token" TEXT,
ADD COLUMN     "forgotpassword_token_expiry" TEXT;
