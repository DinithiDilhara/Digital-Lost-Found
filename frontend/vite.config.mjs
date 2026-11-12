import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },

  preview: { host: "127.0.0.1", proxy: { "/api": { target: process.env.VITE_API_TARGET || "http://127.0.0.1:5000", changeOrigin: true } } },
  build: { outDir: "dist", emptyOutDir: true },
});
