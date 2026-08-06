import { defineConfig, loadEnv } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from '@rolldown/plugin-babel';


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

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
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
    ],
    optimizeDeps: {
      include: [
        `monaco-editor/language/typescript/ts.worker`,
        `monaco-editor/editor/editor.worker`,
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
  }
})
