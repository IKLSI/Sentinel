import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@mui/icons-material")) return "mui-icons";
          if (id.includes("@mui/") || id.includes("@emotion/")) return "mui";
          if (
            id.includes("/react-dom/") ||
            id.includes("/@tanstack/react-router/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          )
            return "react-vendor";
          if (id.includes("recharts") || id.includes("d3-")) return "recharts";
          if (
            id.includes("@codemirror/") ||
            id.includes("@uiw/react-codemirror") ||
            id.includes("@lezer/")
          )
            return "codemirror";
          if (id.includes("date-fns")) return "date";
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/hubs": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
