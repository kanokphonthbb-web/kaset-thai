// READ-ONLY audit: finds published articles that share a duplicate coverImage,
// and proposes (but does NOT write) a reassignment plan using the per-category
// photo pools from publish-batch.mts. No UPDATE statements — SELECT only.
// Usage: npx tsx scripts/audit-cover-duplicates.mjs > scratchpad/cover-reassign-plan.json
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const t = readFileSync(new URL("../.env.vercel", import.meta.url), "utf8");
const env = {};
for (const l of t.split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

// Kept in sync with CAT_IMAGE_POOLS in scripts/publish-batch.mts
const CAT_IMAGE_POOLS = {
  plants: [
    "1519082572439-7ed19908e47e", "1505471768190-275e2ad7b3f9", "1727099079513-952d40de9d78",
    "1615129825073-c47c67bdec5b", "1507637379087-515718ca7c58", "1529313780224-1a12b68bed16",
    "1519897831810-a9a01aceccd1", "1727120279660-5c28b8461609", "1683110752705-f474b57bebc6",
    "1735282260417-cb781d757604", "1762889278403-1d1a57d9a587", "1533792344354-ed5e8fc12494",
    "1679321750826-34c10afa2b7d",
  ],
  animals: [
    "1548550023-2bdb3c5beed7", "1538170989343-ce003278e1a3", "1548781518-d5f5e6a5e281",
    "1636998980792-63f27ddea4e3", "1498191923457-88552caeccb3", "1549488235-42996ae3b650",
    "1677851417571-fd39a3a8d1b9", "1640531783655-95eba670fb00", "1593750187970-84858a2aaf5e",
    "1622837699015-9a4cb8b7a94b",
  ],
  fishery: [
    "1541441056316-443fff347c40", "1674962296996-b17a771d44b3", "1717737853712-b6c0e9be4057",
    "1543285129-bfdac0db10b2", "1625241481569-65ff5465b148",
  ],
  "mixed-farming": [
    "1677741447046-2021fb219d3e", "1535379453347-1ffd615e2e08", "1533062618053-d51e617307ec",
    "1468253926858-331ac6e1e97f",
  ],
  diseases: [
    "1692481060581-98c224124f12", "1620055494738-248ba57ed714", "1604481986614-e48521951d81",
    "1758614307700-1e8ed56dd032", "1774427477281-9d4faf8d19d1",
    "1641118593381-ded30a11d4e1", "1725318868270-75c8bb45c083", "1633945375508-035305e4275d",
    "1758158476251-b1754057722e", "1607804384775-9a14cf1f12e5",
  ],
  "cost-profit": [
    "1626266061368-46a8f578ddd6", "1648201637025-1c77b9be3013", "1642043175009-5997b3a078d8",
    "1611125832047-1d7ad1e8e48f",
    "1678824564926-94a16547b42d", "1544761634-dc512f2238a3", "1710625040193-79a7728d7677",
    "1679920155510-1f238318756e", "1673874855449-e8620ddfa867",
    "1649209979970-f01d950cc5ed", "1546198632-9ef6368bef12", "1633158829875-e5316a358c6f",
    "1578091436046-ecd3f4fe6992",
  ],
  market: [
    "1579113800032-c38bd7635818", "1485637701894-09ad422f6de6", "1550989460-0adf9ea622e2",
    "1604200657090-ae45994b2451", "1488459716781-31db52582fe9",
    "1627989147125-a004d05946d3", "1624668430039-0175a0fbf006", "1609842947419-ba4f04d5d60f",
    "1631021967261-c57ee4dfa9bb", "1635774855717-0aec182f92cc", "1690934167884-08c184b6c606",
    "1720798706592-c516eceaade1",
  ],
  "soil-water-fertilizer": [
    "1611843467160-25afb8df1074", "1618212624319-3cd9681707e2", "1642952273588-ed6fa28870ac",
    "1692369584496-3216a88f94c1", "1738598665698-7fd7af4b5e0c", "1710223221719-6251cb1b5c5b",
    "1680125265832-ffaf364a8aca",
    "1587733761376-3f26fc81d17f", "1621459565706-3b7612533b15", "1693414853994-1080baaacb4d",
    "1708437237775-6c89e28913d4", "1523349312806-f5dde0a01c32",
  ],
  "agri-tech-tools": [
    "1500382017468-9049fed747ef", "1713952160156-bb59cac789a9", "1634143174678-ecd0c3c2375b",
    "1521405924368-64c5b84bec60",
  ],
  "agri-news-law-standards": [
    "1733310023563-3426b2525240", "1768399808130-abac2a8442e0", "1778080132813-d51b1b36b08e",
  ],
};

function photoUrl(id) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=70`;
}
function idFromUrl(url) {
  const m = String(url || "").match(/photo-([a-z0-9-]+)\?/);
  return m ? m[1] : null;
}

const rows = (
  await db.execute({
    sql: `SELECT a.slug, a.title, a.coverImage, c.slug catSlug
          FROM Article a LEFT JOIN ArticleCategory c ON a.categoryId=c.id
          WHERE a.status='published' AND a.coverImage IS NOT NULL AND a.coverImage<>''
          ORDER BY c.slug, a.slug`,
    args: [],
  })
).rows;

// Group by catSlug, then find which coverImage ids are duplicated within each category
const byCat = {};
for (const r of rows) {
  const cat = r.catSlug || "(none)";
  (byCat[cat] ||= []).push({ slug: r.slug, title: r.title, id: idFromUrl(r.coverImage) });
}

const plan = [];
let totalDup = 0;
for (const [cat, arts] of Object.entries(byCat)) {
  const countById = {};
  for (const a of arts) if (a.id) countById[a.id] = (countById[a.id] || 0) + 1;
  const dupIds = new Set(Object.entries(countById).filter(([, n]) => n > 1).map(([id]) => id));
  if (dupIds.size === 0) continue;

  const pool = CAT_IMAGE_POOLS[cat] || [];
  const usedInCat = new Set(arts.map((a) => a.id).filter(Boolean));
  const proposedThisCat = new Set();
  const firstSeen = new Set(); // keep the first article of each duplicated id untouched

  for (const a of arts) {
    if (!a.id || !dupIds.has(a.id)) continue;
    if (!firstSeen.has(a.id)) {
      firstSeen.add(a.id);
      continue; // this one keeps its current photo
    }
    // pick a replacement: prefer a pool photo not currently used anywhere in this category
    // and not already proposed to another article in this pass
    let candidates = pool.filter((id) => !usedInCat.has(id) && !proposedThisCat.has(id));
    if (candidates.length === 0) candidates = pool.filter((id) => !proposedThisCat.has(id));
    if (candidates.length === 0) candidates = pool; // pool exhausted, allow reuse as last resort
    let hash = 0;
    for (const ch of a.slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const newId = candidates[hash % candidates.length] || null;
    if (newId) {
      proposedThisCat.add(newId);
      usedInCat.add(newId);
      plan.push({
        catSlug: cat,
        slug: a.slug,
        title: a.title,
        currentPhotoId: a.id,
        proposedPhotoId: newId,
        proposedCoverImage: photoUrl(newId),
      });
      totalDup++;
    } else {
      plan.push({
        catSlug: cat,
        slug: a.slug,
        title: a.title,
        currentPhotoId: a.id,
        proposedPhotoId: null,
        note: "no pool defined for this category — manual sourcing needed",
      });
    }
  }
}

console.log(
  JSON.stringify(
    {
      readOnly: true,
      note: "This is a proposed reassignment plan only. No database writes were made. Review before applying.",
      totalPublishedWithCover: rows.length,
      totalArticlesNeedingReassignment: totalDup,
      plan,
    },
    null,
    2,
  ),
);
