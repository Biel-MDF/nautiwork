import { defineConfig } from "vitest/config";
import path from "path";
// Testes unitários (sem banco). Os de integração ficam em vitest.integration.config.ts.
export default defineConfig({
  test: { environment: "node", include: ["src/tests/**/*.test.ts"], exclude: ["src/tests/integration/**", "node_modules/**"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
