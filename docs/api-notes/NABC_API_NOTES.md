# NABC API Notes — preflight attempted 2026-08-18

## Status: UNREACHABLE — integration built but disabled

- Documented base per spec: `https://api.nabc.oae.go.th`
- Preflight result (2026-08-18, from dev machine): **DNS does not resolve** (`curl: (6) Could not resolve host: api.nabc.oae.go.th`). No HTTP layer reachable at all.
- No `NABC_API_KEY` exists in any env file for this project.

## Consequences (per no-fake-data rule)
- The adapter (`lib/agri-data/nabcClient.ts`), schema validation, DB cache tables, and sync scripts are implemented and unit-tested against fixtures ONLY.
- All price UI renders the explicit unavailable state: "ยังไม่ได้เชื่อมต่อแหล่งข้อมูลราคา" — **no fake prices, no hardcoded "ราคาวันนี้" anywhere**.
- Feature flag: `NABC_ENABLED` (derived: true only when both `NABC_API_KEY` and `NABC_BASE_URL` are set AND a live preflight succeeds).
- Response schema in the adapter is a PLACEHOLDER inferred from the spec prompt (product_id, price_min/max/avg, market, unit, source_date). **On first successful live call: inspect the real JSON, update `lib/agri-data/schema.ts`, and update this file** — do not trust the placeholder.

## To activate later
1. Obtain the real base URL + API key from OAE/NABC developer portal (the documented host may be internal-only or renamed).
2. Set `NABC_BASE_URL`, `NABC_API_KEY` in Vercel env (server-side only).
3. Run `npx tsx scripts/agri-data/preflight-nabc.mts` — it tests auth, daily prices, crop production, livestock census, records the real schema here, and quarantines mismatches.
4. Flip nothing manually: price pages detect data presence in the DB cache and switch off the unavailable state automatically.
