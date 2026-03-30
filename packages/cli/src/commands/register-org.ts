import { parseArgs } from "node:util";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { SoulboundOrgType } from "@adasouls/soulbound-core";

const VALID_ORG_TYPES: SoulboundOrgType[] = [
  "DAO", "CLUB", "HOSPITAL", "UNIVERSITY", "CORP", "COOPERATIVE", "GOVERNMENT", "OTHER",
];

const VALID_SCHEMAS = [
  "soulbound:v1:membership",
  "soulbound:v1:certificate",
  "soulbound:v1:professional",
  "soulbound:v1:access",
];

const VALID_NETWORKS = ["preprod", "mainnet"] as const;

interface OrgRegistration {
  name: string;
  type: SoulboundOrgType;
  wallet: string;
  schemas: string[];
  network: string;
  blockfrostKey?: string;
}

export async function registerOrg(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      name: { type: "string" },
      type: { type: "string" },
      wallet: { type: "string" },
      schemas: { type: "string" },
      network: { type: "string", default: "preprod" },
      "blockfrost-key": { type: "string" },
      interactive: { type: "boolean", short: "i", default: false },
    },
    strict: false,
  });

  let registration: OrgRegistration;

  if (values.name && values.type && values.wallet && values.schemas) {
    registration = parseCliArgs(values);
  } else {
    registration = await interactiveWizard(values);
  }

  await executeRegistration(registration);
}

function parseCliArgs(values: Record<string, unknown>): OrgRegistration {
  const name = values.name as string;
  const type = (values.type as string).toUpperCase() as SoulboundOrgType;
  const wallet = values.wallet as string;
  const schemas = (values.schemas as string).split(",").map((s) => s.trim());
  const network = (values.network as string) || "preprod";
  const blockfrostKey = values["blockfrost-key"] as string | undefined;

  if (!VALID_ORG_TYPES.includes(type)) {
    throw new Error(`Invalid org type: ${type}. Valid types: ${VALID_ORG_TYPES.join(", ")}`);
  }

  for (const schema of schemas) {
    if (!VALID_SCHEMAS.includes(schema)) {
      throw new Error(`Invalid schema: ${schema}. Valid schemas: ${VALID_SCHEMAS.join(", ")}`);
    }
  }

  if (!VALID_NETWORKS.includes(network as (typeof VALID_NETWORKS)[number])) {
    throw new Error(`Invalid network: ${network}. Valid networks: ${VALID_NETWORKS.join(", ")}`);
  }

  return { name, type, wallet, schemas, network, blockfrostKey };
}

async function interactiveWizard(
  defaults: Record<string, unknown>
): Promise<OrgRegistration> {
  const rl = readline.createInterface({ input, output });

  console.log("\n  Umbra Protocol — Organization Registration\n");

  const name =
    (defaults.name as string) ||
    (await rl.question("  Organization name: "));

  console.log(`\n  Organization types: ${VALID_ORG_TYPES.join(", ")}`);
  const typeInput =
    (defaults.type as string) ||
    (await rl.question("  Organization type: "));
  const type = typeInput.toUpperCase() as SoulboundOrgType;

  if (!VALID_ORG_TYPES.includes(type)) {
    rl.close();
    throw new Error(`Invalid org type: ${type}`);
  }

  const wallet =
    (defaults.wallet as string) ||
    (await rl.question("  Path to admin wallet signing key: "));

  console.log(`\n  Available schemas: ${VALID_SCHEMAS.join(", ")}`);
  const schemasInput =
    (defaults.schemas as string) ||
    (await rl.question("  Schemas (comma-separated): "));
  const schemas = schemasInput.split(",").map((s) => s.trim());

  const network =
    (defaults.network as string) ||
    (await rl.question("  Network (preprod/mainnet) [preprod]: ")) ||
    "preprod";

  const blockfrostKey =
    (defaults["blockfrost-key"] as string) ||
    (await rl.question("  Blockfrost project ID: "));

  console.log(`
  ┌─────────────────────────────────────────┐
  │  Registration Summary                   │
  ├─────────────────────────────────────────┤
  │  Name:     ${name.padEnd(29)}│
  │  Type:     ${type.padEnd(29)}│
  │  Wallet:   ${wallet.padEnd(29)}│
  │  Schemas:  ${schemas.join(", ").padEnd(29)}│
  │  Network:  ${network.padEnd(29)}│
  └─────────────────────────────────────────┘
`);

  const confirm = await rl.question("  Proceed with registration? (y/N): ");
  rl.close();

  if (confirm.toLowerCase() !== "y") {
    console.log("  Registration cancelled.");
    process.exit(0);
  }

  return { name, type, wallet, schemas, network, blockfrostKey };
}

async function executeRegistration(reg: OrgRegistration): Promise<void> {
  console.log("\n  Registering organization on Cardano...\n");

  try {
    // Dynamic import to handle optional peer dependencies
    const { CardanoProvider } = await import("@adasouls/soulbound-sdk/providers/cardano");

    const provider = new CardanoProvider({
      blockfrostProjectId: reg.blockfrostKey || process.env.BLOCKFROST_PROJECT_ID || "",
      network: reg.network as "preprod" | "mainnet",
      registryPolicyId: process.env.REGISTRY_POLICY_ID || "",
    });

    const orgId = await (provider as any).registerIssuer({
      orgName: reg.name,
      orgType: reg.type,
      schemas: reg.schemas,
    });

    console.log(`  Registration complete.\n`);
    console.log(`    Org ID:    ${orgId}`);
    console.log(`    Name:      ${reg.name}`);
    console.log(`    Type:      ${reg.type}`);
    console.log(`    Schemas:   ${reg.schemas.join(", ")}`);
    console.log(`    Network:   ${reg.network}`);
    console.log(`\n  Save your Org ID — you'll need it to configure the SDK.\n`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Cannot find module")) {
      console.error(
        "  Error: @meshsdk/core is required for Cardano operations.\n" +
        "  Install it with: npm install @meshsdk/core\n"
      );
      process.exit(1);
    }
    throw err;
  }
}
