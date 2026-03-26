import { defineConfig, createLogger } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Filter out noisy proxy errors when API is not yet ready
const logger = createLogger();
const originalError = logger.error.bind(logger);
logger.error = (msg, options) => {
  if (typeof msg === "string" && msg.includes("ws proxy socket error")) return;
  originalError(msg, options);
};

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3001",
        ws: true,
      },
    },
    allowedHosts: true,
  },
});
