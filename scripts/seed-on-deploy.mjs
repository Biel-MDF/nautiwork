// Roda o seed durante o build da Vercel só quando SEED_ON_DEPLOY=1.
// O seed apaga e recria os dados de demonstração, então a variável deve ser removida
// depois do primeiro deploy, para que deploys seguintes não zerem esses dados.
import { execSync } from "node:child_process";

if (process.env.SEED_ON_DEPLOY === "1") {
  console.log("[seed-on-deploy] SEED_ON_DEPLOY=1: rodando o seed de demonstração.");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
} else {
  console.log("[seed-on-deploy] seed não executado (SEED_ON_DEPLOY diferente de 1).");
}
