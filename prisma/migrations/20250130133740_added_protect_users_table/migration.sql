-- CreateTable
CREATE TABLE "ProtectAppUsers" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "deviceToken" TEXT,

    CONSTRAINT "ProtectAppUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtectAppPosts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtectAppPosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtectAppUsers_username_key" ON "ProtectAppUsers"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ProtectAppUsers_phone_number_key" ON "ProtectAppUsers"("phone_number");

-- AddForeignKey
ALTER TABLE "ProtectAppPosts" ADD CONSTRAINT "ProtectAppPosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ProtectAppUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
