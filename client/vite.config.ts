import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const preconnectToApi = (apiUrl: string | undefined): Plugin => ({
  name: "preconnect-to-api",
  transformIndexHtml: () =>
    apiUrl
      ? [
          {
            tag: "link",
            attrs: {
              rel: "preconnect",
              href: new URL(apiUrl).origin,
              crossorigin: "use-credentials",
            },
            injectTo: "head-prepend",
          },
        ]
      : [],
});

export default defineConfig(({ mode }) => ({
  plugins: [
    preconnectToApi(loadEnv(mode, __dirname).VITE_API_URL),
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
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              test: /node_modules[\\/](react|react-dom|scheduler|@emotion|@tanstack[\\/](react-query|query-core|react-router|router-core|history))[\\/]/,
            },
          ],
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
}));
