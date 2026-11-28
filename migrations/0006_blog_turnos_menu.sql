-- Blog, turnos con QR y menú del día (idempotente: el Worker también lo ejecuta al arrancar).
CREATE TABLE IF NOT EXISTS "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT 'Equipo Aldore',
    "publishedAt" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Queue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#e2471c',
    "prefix" TEXT NOT NULL DEFAULT 'A',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "avgMinutes" INTEGER NOT NULL DEFAULT 5,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "staffKey" TEXT NOT NULL DEFAULT '',
    "clientId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "queueId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'esperando',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "MenuBoard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#e2471c',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL DEFAULT '',
    "items" TEXT NOT NULL DEFAULT '',
    "price" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "hours" TEXT NOT NULL DEFAULT '',
    "staffKey" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "clientId" INTEGER,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "Queue_slug_key" ON "Queue"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_code_key" ON "Ticket"("code");

CREATE INDEX IF NOT EXISTS "Ticket_queueId_status_idx" ON "Ticket"("queueId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "MenuBoard_slug_key" ON "MenuBoard"("slug");
