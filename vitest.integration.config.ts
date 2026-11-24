import { defineConfig } from "vitest/config";
import path from "path";
// Testes de integração: rodam os serviços contra um PostgreSQL de teste (TEST_DATABASE_URL).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/integration/**/*.test.ts"],
    globalSetup: ["src/tests/integration/global-setup.ts"],
    setupFiles: ["src/tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
