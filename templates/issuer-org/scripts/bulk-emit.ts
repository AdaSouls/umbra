/**
 * Bulk issue credentials from a CSV file.
 *
 * Usage: npm run bulk-emit -- --file members.csv
 *
 * CSV format:
 *   walletAddress,schema,resourceId,accessLevel,tier,expiresAt
 *   addr1abc...,soulbound:v1:membership,,,FULL_MEMBER,2027-12-31
 */

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { createIssuer } from "../src/lib/umbra.js";
import type { SoulboundSchemaId, SoulboundEmitInput } from "@adasouls/soulbound-core";

interface CsvRow {
  walletAddress: string;
  schema: string;
  resourceId?: string;
  accessLevel?: string;
  tier?: string;
  expiresAt?: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      if (values[i]) row[header] = values[i];
    });
    return row as unknown as CsvRow;
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      file: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
    strict: false,
  });

  if (!values.file) {
    console.error("Error: --file is required.\n");
    console.log("Usage: npm run bulk-emit -- --file members.csv [--dry-run]");
    process.exit(1);
  }

  const content = readFileSync(values.file as string, "utf-8");
  const rows = parseCsv(content);

  console.log(`\nBulk emit: ${rows.length} credentials from ${values.file}`);

  if (values["dry-run"]) {
    console.log("\n[DRY RUN] — no credentials will be issued.\n");
    for (const row of rows) {
      console.log(`  ${row.walletAddress} → ${row.schema || "soulbound:v1:membership"}`);
    }
    console.log(`\nTotal: ${rows.length} credentials would be issued.\n`);
    return;
  }

  const issuer = await createIssuer();

  let succeeded = 0;
  let failed = 0;

  for (const row of rows) {
    const input: SoulboundEmitInput = {
      schema: (row.schema || "soulbound:v1:membership") as SoulboundSchemaId,
      subject: {
        walletAddress: row.walletAddress,
        ...(row.resourceId && { resourceId: row.resourceId }),
        ...(row.accessLevel && { accessLevel: row.accessLevel }),
        ...(row.tier && { tier: row.tier }),
      },
      ...(row.expiresAt && { expiresAt: new Date(row.expiresAt) }),
    };

    try {
      const credId = await issuer.emit(input);
      console.log(`  OK  ${row.walletAddress} → ${credId}`);
      succeeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ERR ${row.walletAddress} → ${msg}`);
      failed++;
    }
  }

  console.log(`\nResults: ${succeeded} succeeded, ${failed} failed out of ${rows.length} total.\n`);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
