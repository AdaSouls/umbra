/**
 * Check if this organization is registered on the Cardano registry.
 *
 * Usage: npm run check
 */

async function main() {
  const orgId = process.env.ORG_ID;
  if (!orgId) {
    console.error("Error: ORG_ID is required. Set it in .env.local (run `npm run register` first).");
    process.exit(1);
  }

  const { CardanoProvider } = await import("@adasouls/soulbound-sdk/providers/cardano");

  const network = (process.env.CARDANO_NETWORK || "preprod") as "preprod" | "mainnet";

  const provider = new CardanoProvider({
    blockfrostProjectId: process.env.BLOCKFROST_PROJECT_ID || "",
    network,
    registryPolicyId: process.env.REGISTRY_POLICY_ID || "",
  });

  const isValid = await (provider as any).isValidIssuer(orgId);

  if (isValid) {
    console.log(`\n  Organization ${orgId} is REGISTERED on ${network}.\n`);
  } else {
    console.log(`\n  Organization ${orgId} is NOT FOUND on ${network}.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
