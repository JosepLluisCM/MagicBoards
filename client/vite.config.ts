import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true, // Ensure sourcemaps are generated for debugging
  },
  server: {
    host: true, // Bind to 0.0.0.0 to make it accessible outside the container
    port: 5173,
    watch: {
      usePolling: true,
    },
    // headers: {
    //   "Cross-Origin-Embedder-Policy": "unsafe-none",
    //   "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    // },
  },
});
