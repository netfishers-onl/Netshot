import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "0.0.0.0",
      open: false,
      port: 3000,
      proxy: {
        "/api": {
          target: env.PROXY_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    optimizeDeps: {
      include: [
        `monaco-editor/esm/vs/language/typescript/ts.worker`,
        `monaco-editor/esm/vs/editor/editor.worker`,
      ],
    },
    rollupOptions: {
      output: {
        sourcemap: false,
        manualChunks: {
          router: ["react-router"],
          "framer-motion": ["framer-motion"],
          chakra: ["@chakra-ui/react"],
          "chart.js": ["chart.js"],
          "@tanstack/react-query": ["@tanstack/react-query"],
          "@tanstack/react-table": ["@tanstack/react-table"],
        },
      },
    },
  };
});
