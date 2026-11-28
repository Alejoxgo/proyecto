-- Códigos de verificación por correo para el ingreso al panel.
CREATE TABLE IF NOT EXISTS "MfaChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires" INTEGER NOT NULL,
    "sentAt" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "MfaChallenge_userId_idx" ON "MfaChallenge"("userId");
