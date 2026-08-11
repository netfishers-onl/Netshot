import { DiagnosticType } from "@/types"

export const QUERIES = {
  DIAGNOSTIC_LIST: "diagnostic-list",
  DIAGNOSTIC_INFINITE_LIST: "diagnostic-infinite-list",
  DIAGNOSTIC_SEARCH_LIST: "diagnostic-search-list",
  DIAGNOSTIC_DETAIL: "diagnostic-detail",
}

export const SCRIPT_TEMPLATES = {
  [DiagnosticType.Javascript]: `
    function diagnose(client, device, diagnostic) {
      const cli = client.create("cli");
      cli.macro("enable");
      const output = cli.command("show something");
      // Process output somewhat
      diagnostic.set(output);
    }
  `,
  [DiagnosticType.Python]: `
    def diagnose(client, device, diagnostic):
      cli = client.create("cli")
      cli.macro("enable")
      output = cli.command("show something")
      # Process output somewhat
      diagnostic.set(output)
  `,
}
