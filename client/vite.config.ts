import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    sourcemap: true, // Ensure sourcemaps are generated for debugging
  },
  server: {
    host: true, // Bind to 0.0.0.0 to make it accessible outside the container
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
});
