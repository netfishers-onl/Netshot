import { defineConfig } from "i18next-cli"

export default defineConfig({
  locales: ["en", "fr"],
  extract: {
    input: "src/**/*.{js,jsx,ts,tsx}",
    output: "src/i18n/{{language}}.json",
  },
})
