// Dependency gate for CI. Wraps `npm audit` so a small, reviewed set of
// advisories can be acknowledged without lowering the threshold for everything
// else -- `npm audit --audit-level=high` would silently stop reporting real
// moderate findings across the whole tree, which is the outcome we want to avoid.
//
// Adding an entry here is a deliberate decision. Each one needs a reason and a
// recheck trigger, and it should be removed the moment an upgrade path exists.
//
// Run with: npm run audit:launch

import { spawnSync } from "node:child_process";

const THRESHOLD = "moderate";
const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

const ACKNOWLEDGED = [
  {
    id: "GHSA-f88m-g3jw-g9cj",
    package: "sharp",
    reason:
      "libvips CVEs inherited through next's optional image-optimisation dependency. " +
      "The only npm-offered fix is next@14.2.35 -- two majors back, which would undo " +
      "the App Router work this app is built on. Exposure is limited: images are " +
      "admin-uploaded only, content-sniffed in src/lib/admin/image.ts, and served from " +
      "a single allow-listed Supabase bucket.",
    recheck: "Drop this entry as soon as next ships a release depending on sharp >= 0.35.0.",
  },
  {
    id: "GHSA-mh99-v99m-4gvg",
    package: "brace-expansion",
    reason:
      "ReDoS reachable only through eslint's minimatch chain -- a devDependency that " +
      "never runs in production or in the deployed bundle. Verified 2026-07-27 that " +
      "overriding to the patched 5.0.8 breaks eslint outright (minimatch 3.x calls an " +
      "API that major removed), and npm's own fix is eslint@10, a breaking upgrade.",
    recheck: "Drop this entry when eslint-config-next supports an eslint/minimatch line that resolves it.",
  },
];

const acknowledgedIds = new Set(ACKNOWLEDGED.map((entry) => entry.id));

const result = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("Could not run npm audit:", result.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("Could not parse npm audit output.");
  console.error(result.stdout.slice(0, 2000));
  process.exit(1);
}

// Report every advisory URL attached to a package, whether it sits on the
// package itself or arrives through a dependency path.
function advisoryIds(vulnerability) {
  const ids = new Set();
  for (const via of vulnerability.via ?? []) {
    if (typeof via === "string") continue;
    const match = /GHSA-[a-z0-9-]+/i.exec(via.url ?? "");
    if (match) ids.add(match[0]);
  }
  return ids;
}

const blocking = [];
const acknowledgedSeen = new Set();

for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  if ((SEVERITY_RANK[vulnerability.severity] ?? 0) < SEVERITY_RANK[THRESHOLD]) continue;

  const ids = advisoryIds(vulnerability);
  // Packages that are only vulnerable *because* of an acknowledged advisory
  // deeper in the tree (next -> sharp, eslint -> minimatch -> brace-expansion)
  // carry no advisory of their own, so treat them as covered too.
  if (ids.size === 0) continue;

  const unacknowledged = [...ids].filter((id) => !acknowledgedIds.has(id));
  for (const id of ids) if (acknowledgedIds.has(id)) acknowledgedSeen.add(id);

  if (unacknowledged.length > 0) {
    blocking.push({ name: vulnerability.name, severity: vulnerability.severity, ids: unacknowledged });
  }
}

for (const entry of ACKNOWLEDGED) {
  const status = acknowledgedSeen.has(entry.id) ? "still present" : "NO LONGER REPORTED — remove this entry";
  console.log(`acknowledged: ${entry.package} (${entry.id}) — ${status}`);
}

const stale = ACKNOWLEDGED.filter((entry) => !acknowledgedSeen.has(entry.id));
if (stale.length > 0) {
  console.log("\nSome acknowledged advisories no longer appear. Delete them from");
  console.log("scripts/audit-launch.mjs so the gate does not quietly cover new issues.");
}

if (blocking.length === 0) {
  console.log(`\nNo unacknowledged advisories at or above "${THRESHOLD}".`);
  process.exit(0);
}

console.error(`\nUnacknowledged advisories at or above "${THRESHOLD}":\n`);
for (const item of blocking) {
  console.error(`  ${item.name} (${item.severity}) — ${item.ids.join(", ")}`);
}
console.error("\nFix them, or add a reviewed entry to ACKNOWLEDGED in scripts/audit-launch.mjs.");
process.exit(1);
