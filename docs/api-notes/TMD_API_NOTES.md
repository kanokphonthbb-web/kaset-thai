# TMD API Notes (นักพยากรณ์ nwpapi) — verified by live preflight 2026-08-18

## Base + Auth
- Base URL: `https://data.tmd.go.th/nwpapi/v1`
- Auth: `Authorization: Bearer <TMD_API_KEY>` (Laravel Passport JWT, RS256)
- Current key: env `TMD_API_KEY` (server-side only, stored in `.env.local` / Vercel env — never client bundle)
- Key payload: `sub=5752`, `scopes=[]`, expires **2027-08-18** (unix 1818555217)
- Bad/absent token → **HTTP 401** JSON error

## Endpoints verified working

### Hourly forecast at a point
`GET /forecast/location/hourly/at?lat={lat}&lon={lon}&fields={csv}&duration={n}`
- `duration` up to **48** (returns 48 items, hour granularity, starting current hour)
- Verified fields: `tc` (°C), `rh` (%), `rain` (mm), `ws10m` (m/s), `wd10m` (deg), `cond` (condition code int)
- Response shape:
```json
{"WeatherForecasts":[{"location":{"lat":13.7426,"lon":100.4965},
  "forecasts":[{"time":"2026-08-18T09:00:00+07:00","data":{"cond":2,"rain":0,"rh":68.59,"tc":28.38,"wd10m":234.62,"ws10m":2.91}}]}]}
```
- `time` is ISO-8601 **with +07:00 offset** (Asia/Bangkok). API snaps the requested lat/lon to the model grid point (13.75→13.7426).

### Daily forecast at a point
`GET /forecast/location/daily/at?lat={lat}&lon={lon}&fields={csv}&duration={n}`
- `duration=10` returned **9** items (horizon ≈ 9-10 days; do not assume exactly 10)
- Verified fields: `tc_max`, `tc_min`, `rh`, `rain` (mm/day), `cond`
- Daily `time` is midnight +07:00 of each day.

## Condition codes (`cond`)
Per TMD nwpapi documentation (1=ท้องฟ้าแจ่มใส, 2=มีเมฆบางส่วน, 3=เมฆเป็นส่วนมาก, 4=มีเมฆมาก, 5=ฝนตกเล็กน้อย, 6=ฝนปานกลาง, 7=ฝนตกหนัก, 8=ฝนฟ้าคะนอง, 9=อากาศหนาวจัด, 10=อากาศหนาว, 11=อากาศเย็น, 12=อากาศร้อนจัด). Mapping table lives in `lib/weather/condCodes.ts` — treat unknown codes as "ไม่ระบุ", never crash.

## Error / edge behavior (verified)
- Invalid token → 401 JSON
- **Out-of-Thailand coords (51.5, 0.1) → HTTP 302 redirect to the docs HTML page** (not a JSON error!). Server adapter MUST validate coords against a Thailand bounding box (~lat 5.5–20.6, lon 97.3–105.7) BEFORE calling, and must treat any non-200 or non-JSON response as failure.
- Province-name query (`/forecast/location/hourly?province=เชียงใหม่`) returns only a data-range envelope (`{"hourly_data":{"min":...,"max":...}}`), not forecasts — **do not use**; resolve provinces to lat/lon via our own mapping table (`lib/weather/locations.ts`) and always call the `/at` endpoints.

## Operational decisions
- Cache TTL: 60 minutes per (lat,lon rounded to 2dp, kind hourly|daily) — model updates a few times daily; 60m balances freshness vs quota.
- Never call TMD from the browser; all calls go through server adapter `lib/weather/tmdClient.ts` → public API route with rate limiting.
- Distinguish three timestamps in UI: forecast valid time (`time`), fetchedAt (our fetch), and data-generation time (not exposed by API — omit rather than fake).
- Attribution required on every page using this data: "แหล่งข้อมูล: กรมอุตุนิยมวิทยา" + link.
- Commercial-use permission not yet documented for this account → public weather pages ship behind env flag `TMD_PUBLIC_WEATHER_ENABLED` (default off until owner confirms; see deployment checklist).
