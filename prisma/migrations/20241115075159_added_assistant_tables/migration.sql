-- CreateTable
CREATE TABLE "Assistant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantDocuments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "assistant_id" INTEGER NOT NULL,
    "document_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantDocuments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssistantDocuments" ADD CONSTRAINT "AssistantDocuments_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
