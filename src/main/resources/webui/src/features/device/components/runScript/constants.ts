export const NEW_SCRIPT_TEMPLATE = [
  "function run(cli, device) {",
  '   cli.macro("configure");',
  '   cli.command("no ip domain-lookup");',
  '   cli.macro("end");',
  '   cli.macro("save");',
  "}",
].join("\n")
