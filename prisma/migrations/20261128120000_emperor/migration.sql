-- Imperador: o administrador maior. No máximo um (índice único parcial).
ALTER TABLE "User" ADD COLUMN "emperor" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "User_single_emperor" ON "User" ("emperor") WHERE "emperor" = true;

-- A conta de administrador do dono do projeto vira o Imperador (se existir e for administrador).
UPDATE "User" SET "emperor" = true WHERE lower("email") = 'ga14012009@gmail.com' AND "role" = 'ADMIN';
