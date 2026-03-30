/**
 * Issue a single credential from the command line.
 *
 * Usage:
 *   npm run emit -- --wallet addr1... --schema soulbound:v1:membership
 *   npm run emit -- --wallet addr1... --schema soulbound:v1:access --resource my-platform:main --level MEMBER
 */

import { parseArgs } from "node:util";
import { createIssuer } from "../src/lib/umbra.js";
import type { SoulboundSchemaId, SoulboundEmitInput } from "@adasouls/soulbound-core";

async function main() {
  const { values } = parseArgs({
    options: {
      wallet: { type: "string" },
      schema: { type: "string", default: "soulbound:v1:membership" },
      resource: { type: "string" },
      level: { type: "string" },
      tier: { type: "string" },
      "expires-at": { type: "string" },
    },
    strict: false,
  });

  if (!values.wallet) {
    console.error("Error: --wallet is required.\n");
    console.log("Usage: npm run emit -- --wallet addr1... [--schema soulbound:v1:membership] [--tier FULL_MEMBER]");
    process.exit(1);
  }

  const issuer = await createIssuer();

  const input: SoulboundEmitInput = {
    schema: values.schema as SoulboundSchemaId,
    subject: {
      walletAddress: values.wallet as string,
      ...(values.resource && { resourceId: values.resource as string }),
      ...(values.level && { accessLevel: values.level as string }),
      ...(values.tier && { tier: values.tier as string }),
    },
    ...(values["expires-at"] && { expiresAt: new Date(values["expires-at"] as string) }),
  };

  console.log(`\nIssuing ${values.schema} credential to ${values.wallet}...`);

  const credentialId = await issuer.emit(input);

  console.log(`\nCredential issued!`);
  console.log(`  ID: ${credentialId}`);
  console.log(`  Schema: ${values.schema}`);
  console.log(`  Status: PENDING (holder must claim)\n`);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
