import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./env";

// Recria o banco de teste do zero aplicando as migrations (sem seed).
export default function setup() {
  const url = testDatabaseUrl();
  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "inherit", env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url },
  });
}
