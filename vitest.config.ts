import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@/data": path.resolve(__dirname, "./src/data"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/src": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
