import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Same "@/..." import alias as tsconfig.json, so tests can load any app module.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["test/**/*.test.ts"] },
});
