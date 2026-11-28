-- Perfil de los usuarios del panel y correo interno.
ALTER TABLE "User" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "avatar" TEXT NOT NULL DEFAULT 'aldo-1';
CREATE TABLE IF NOT EXISTS "InternalMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "fromDeleted" BOOLEAN NOT NULL DEFAULT false,
    "toDeleted" BOOLEAN NOT NULL DEFAULT false,
    "replyTo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "InternalMessage_toId_readAt_idx" ON "InternalMessage"("toId", "readAt");
CREATE INDEX IF NOT EXISTS "InternalMessage_fromId_idx" ON "InternalMessage"("fromId");
