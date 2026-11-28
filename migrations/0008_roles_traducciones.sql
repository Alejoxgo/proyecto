-- Rol de cada usuario del panel: admin (gestiona usuarios) o editor.
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';

-- Traducciones automáticas del sitio.
CREATE TABLE IF NOT EXISTS "Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lang" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Translation_lang_key_key" ON "Translation"("lang", "key");
