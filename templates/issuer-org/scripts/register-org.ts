/**
 * One-time script to register this organization on the Cardano registry.
 *
 * Usage: npm run register
 *
 * Prerequisites:
 *   - Set BLOCKFROST_PROJECT_ID in .env.local
 *   - Set ADMIN_WALLET_PATH to your signing key
 *   - Set ORG_NAME, ORG_TYPE, and SCHEMAS
 */

import { ORG_CONFIG } from "../src/lib/umbra.js";

async function main() {
  const { CardanoProvider } = await import("@adasouls/soulbound-sdk/providers/cardano");

  const blockfrostKey = process.env.BLOCKFROST_PROJECT_ID;
  if (!blockfrostKey) {
    console.error("Error: BLOCKFROST_PROJECT_ID is required. Set it in .env.local");
    process.exit(1);
  }

  const network = (process.env.CARDANO_NETWORK || "preprod") as "preprod" | "mainnet";
  const schemas = (process.env.SCHEMAS || "soulbound:v1:membership").split(",").map((s) => s.trim());

  console.log(`\nRegistering "${ORG_CONFIG.orgName}" on ${network}...`);
  console.log(`  Type: ${ORG_CONFIG.orgType}`);
  console.log(`  Schemas: ${schemas.join(", ")}\n`);

  const provider = new CardanoProvider({
    blockfrostProjectId: blockfrostKey,
    network,
    registryPolicyId: process.env.REGISTRY_POLICY_ID || "",
  });

  const orgId = await (provider as any).registerIssuer({
    orgName: ORG_CONFIG.orgName,
    orgType: ORG_CONFIG.orgType,
    schemas,
  });

  console.log(`Registration complete!\n`);
  console.log(`  Org ID: ${orgId}`);
  console.log(`\nAdd this to your .env.local:`);
  console.log(`  ORG_ID="${orgId}"\n`);
}

main().catch((err) => {
  console.error("Registration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
