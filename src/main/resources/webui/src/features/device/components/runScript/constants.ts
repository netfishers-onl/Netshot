export const NEW_SCRIPT_TEMPLATE = [
  "function run(client, device) {",
  '   const cli = client.create("cli");',
  '   cli.macro("configure");',
  '   cli.command("no ip domain-lookup");',
  '   cli.macro("end");',
  '   cli.macro("save");',
  "}",
].join("\n")

// For drivers with no CLI (SSH/Telnet) access: request an HTTP client instead.
export const NEW_HTTP_SCRIPT_TEMPLATE = [
  "function run(client, device) {",
  '   const http = client.create("http");',
  '   http.post("/some/api/path", { some: "payload" });',
  "}",
].join("\n")
