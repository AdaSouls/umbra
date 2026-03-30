import { SOULBOUND_SCHEMAS } from "@adasouls/soulbound-core";

export async function listSchemas(): Promise<void> {
  console.log("\n  Umbra Protocol — Standard Schemas\n");

  for (const [schemaId, schema] of Object.entries(SOULBOUND_SCHEMAS)) {
    console.log(`  ${schemaId}`);
    console.log(`    Required:    ${schema.requiredFields.join(", ")}`);
    console.log(`    Optional:    ${schema.optionalFields.join(", ")}`);
    console.log(`    Disclosable: ${schema.disclosableFields.join(", ")}`);
    console.log();
  }
}
