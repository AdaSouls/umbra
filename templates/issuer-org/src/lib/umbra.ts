/**
 * Umbra SDK configuration for this organization.
 * Shared by scripts and the admin dashboard.
 */

import { SoulboundIssuer, SoulboundVerifier } from "@adasouls/soulbound-sdk";
import type { SoulboundOrgType } from "@adasouls/soulbound-core";

// Organization configuration from environment
const ORG_CONFIG = {
  orgId: process.env.ORG_ID || "",
  orgName: process.env.ORG_NAME || "My Organization",
  orgType: (process.env.ORG_TYPE || "OTHER") as SoulboundOrgType,
  publicKey: "", // Derived from admin wallet at runtime
} as const;

/**
 * Create a provider based on environment configuration.
 * Uses MockProvider in development, MidnightProvider in production.
 */
export async function createProvider() {
  if (process.env.NODE_ENV === "development" || !process.env.MIDNIGHT_CONTRACT_ADDRESS) {
    const { MockProvider } = await import("@adasouls/soulbound-sdk/providers/mock");
    return new MockProvider();
  }

  const { MidnightProvider } = await import("@adasouls/soulbound-sdk/providers/midnight");
  return new MidnightProvider({
    nodeUrl: process.env.MIDNIGHT_NODE_URL || "http://localhost:9944",
    proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || "http://localhost:6300",
    contractAddress: process.env.MIDNIGHT_CONTRACT_ADDRESS,
  });
}

/**
 * Create an issuer instance for this organization.
 */
export async function createIssuer(): Promise<SoulboundIssuer> {
  const provider = await createProvider();
  return new SoulboundIssuer(ORG_CONFIG, provider);
}

/**
 * Create a verifier instance.
 */
export async function createVerifier(): Promise<SoulboundVerifier> {
  const provider = await createProvider();
  return new SoulboundVerifier(provider);
}

export { ORG_CONFIG };
