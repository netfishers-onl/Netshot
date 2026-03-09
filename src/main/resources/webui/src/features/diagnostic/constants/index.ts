import { DiagnosticType } from "@/types"

export const QUERIES = {
  DIAGNOSTIC_LIST: "diagnostic-list",
  DIAGNOSTIC_INFINITE_LIST: "diagnostic-infinite-list",
  DIAGNOSTIC_SEARCH_LIST: "diagnostic-search-list",
  DIAGNOSTIC_DETAIL: "diagnostic-detail",
}

export const SCRIPT_TEMPLATES = {
  [DiagnosticType.Javascript]: `
    function diagnose(cli, device, diagnostic) {
      cli.macro("enable");
      const output = cli.command("show something");
      // Process output somewhat
      diagnostic.set(output);
    }
  `,
  [DiagnosticType.Python]: `
    def diagnose(cli, device, diagnostic):
      cli.macro("enable")
      output = cli.command("show something")
      # Process output somewhat
      diagnostic.set(output)
  `,
}
