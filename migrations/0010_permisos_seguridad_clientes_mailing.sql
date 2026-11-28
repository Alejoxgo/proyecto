-- Roles con permisos, MFA con app autenticadora, llaves de acceso, portal de clientes con contraseña y email marketing.
-- CreateTable
CREATE TABLE IF NOT EXISTS "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "perms" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Passkey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "credId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT 'Llave de acceso',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "clientId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "preheader" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "ctaLabel" TEXT NOT NULL DEFAULT '',
    "ctaUrl" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT 'todos',
    "status" TEXT NOT NULL DEFAULT 'borrador',
    "sentAt" DATETIME,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CampaignSend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaignId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "User" ADD COLUMN "roleId" INTEGER;
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "totpOn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN "portalHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#e2471c';
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Passkey_credId_key" ON "Passkey"("credId");
CREATE INDEX IF NOT EXISTS "Passkey_userId_idx" ON "Passkey"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_email_key" ON "Contact"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_token_key" ON "Contact"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignSend_key_key" ON "CampaignSend"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignSend_campaignId_contactId_key" ON "CampaignSend"("campaignId", "contactId");
