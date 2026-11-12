-- AlterTable
ALTER TABLE "User" ADD COLUMN "llmProvider" TEXT,
ADD COLUMN "llmModel" TEXT,
ADD COLUMN "llmBaseUrl" TEXT,
ADD COLUMN "llmApiKeyEncrypted" TEXT;
