import { parseArgs } from "node:util";

export async function checkOrg(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      "org-id": { type: "string" },
      network: { type: "string", default: "preprod" },
      "blockfrost-key": { type: "string" },
    },
    strict: false,
  });

  const orgId = values["org-id"] as string;
  if (!orgId) {
    console.error("  Error: --org-id is required.\n");
    console.log("  Usage: umbra-protocol check-org --org-id <policy-id> [--network preprod|mainnet]\n");
    process.exit(1);
  }

  console.log(`\n  Checking organization ${orgId} on ${values.network}...\n`);

  try {
    const { CardanoProvider } = await import("@adasouls/soulbound-sdk/providers/cardano");

    const provider = new CardanoProvider({
      blockfrostProjectId: (values["blockfrost-key"] as string) || process.env.BLOCKFROST_PROJECT_ID || "",
      network: (values.network as string) as "preprod" | "mainnet",
      registryPolicyId: process.env.REGISTRY_POLICY_ID || "",
    });

    const isValid = await (provider as any).isValidIssuer(orgId);

    if (isValid) {
      console.log("  Status: REGISTERED");
      console.log(`  Org ID: ${orgId}`);
      console.log(`  Network: ${values.network}\n`);
    } else {
      console.log("  Status: NOT FOUND");
      console.log(`  Organization ${orgId} is not registered on ${values.network}.\n`);
      process.exit(1);
    }
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
