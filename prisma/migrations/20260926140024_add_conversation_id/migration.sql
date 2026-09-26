/*
  Warnings:

  - Added the required column `conversationId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "conversationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Chat_conversationId_createdAt_idx" ON "Chat"("conversationId", "createdAt");
