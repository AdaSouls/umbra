#!/usr/bin/env node

import { parseArgs } from "node:util";
import { registerOrg } from "./commands/register-org.js";
import { checkOrg } from "./commands/check-org.js";
import { listSchemas } from "./commands/list-schemas.js";

const USAGE = `
Umbra Protocol CLI — Manage soulbound credentials from the command line

Usage:
  umbra-protocol <command> [options]

Commands:
  register-org    Register a new issuing organization on the Cardano registry
  check-org       Verify an organization's registration status
  list-schemas    List available credential schemas

Options:
  --help, -h      Show this help message
  --version, -v   Show version

Examples:
  npx umbra-protocol register-org
  npx umbra-protocol register-org --name "My Club" --type CLUB --network preprod
  npx umbra-protocol check-org --org-id policy1abc...
  npx umbra-protocol list-schemas
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    process.exit(0);
  }

  if (command === "--version" || command === "-v") {
    console.log("0.1.0-alpha.1");
    process.exit(0);
  }

  switch (command) {
    case "register-org":
      await registerOrg(args.slice(1));
      break;
    case "check-org":
      await checkOrg(args.slice(1));
      break;
    case "list-schemas":
      await listSchemas();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
