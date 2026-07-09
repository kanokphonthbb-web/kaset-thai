// Applies the reassignment plan produced by scripts/audit-cover-duplicates.mjs.
// Reads the plan JSON from argv[2], runs one UPDATE per row (coverImage only),
// and verifies the write. User-approved 2026-07-07.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const t = readFileSync(new URL("../.env.vercel", import.meta.url), "utf8");
const env = {};
for (const l of t.split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

const planFile = process.argv[2];
if (!planFile) throw new Error("usage: apply-cover-reassign.mjs <plan.json>");
const { plan } = JSON.parse(readFileSync(planFile, "utf8"));

let ok = 0;
const failed = [];
for (const row of plan) {
  if (!row.proposedCoverImage) { failed.push({ slug: row.slug, reason: "no proposed image" }); continue; }
  const res = await db.execute({
    sql: `UPDATE Article SET coverImage=?, updatedAt=? WHERE slug=?`,
    args: [row.proposedCoverImage, new Date().toISOString().replace("Z", "+00:00"), row.slug],
  });
  if (res.rowsAffected === 1) ok++;
  else failed.push({ slug: row.slug, reason: `rowsAffected=${res.rowsAffected}` });
}
console.log(JSON.stringify({ updated: ok, failed }, null, 2));
