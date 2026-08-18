# NABC API Notes — verified LIVE 2026-08-18

## Status: ACTIVE ✅ (public API — ไม่ต้องใช้ key)

- **Base URL จริง: `https://agriapi.nabc.go.th/api/`** (NABC Agricultural Data Service, สศก./OAE)
  — โฮสต์ `api.nabc.oae.go.th` ในสเปคเดิมไม่มีอยู่จริง (DNS ไม่ resolve)
- **ไม่มี auth** — ทดสอบแล้วทั้ง curl และ node fetch ธรรมดาได้ HTTP 200
  (หน้า HTML docs ของเว็บโดน Cloudflare UA-gate แต่ endpoint `/api/*` ไม่โดน)
- Client: `lib/agri-data/nabcClient.ts` · Sync core: `lib/agri-data/syncDailyPrices.ts`
- Cron: `vercel.json` → `/api/cron/sync-prices` วันละ 2 รอบ (08:30 / 14:30 เวลาไทย)

## Daily prices endpoints (verified)

| Endpoint | ผล |
|---|---|
| `GET daily-prices/latest-date` | `{"success":true,"data":{"latest_date":"2026-08-17"}}` |
| `GET daily-prices/date?date=YYYY-MM-DD&limit=100&page=1` | แถวราคาทั้งหมดของวัน (~50 แถว) + `pagination:{limit,offset,page,count,total}` |
| `GET daily-prices/categories` | 13 หมวด: กุ้งขาว สับปะรดโรงงาน ข้าวโพดเลี้ยงสัตว์ ไก่ ข้าวหอมมะลิ ยางพารา มะพร้าว ไข่ไก่ ปาล์มน้ำมัน ลำไย มันสำปะหลัง มะนาว สุกร |
| `GET daily-prices/product-names` | ~21 ชื่อสินค้า(เกรด) |
| `GET daily-prices/product?product_name=...` | ราคาย้อนหลังรายสินค้า |
| `GET daily-prices/category?product_category=...` | ราคาย้อนหลังรายหมวด |
| `GET daily-prices/stats?product_category=...` | สถิติ |

## Row schema จริง (daily-prices/date)
```json
{
  "data_date": "2026-08-17", "day": "17", "month": "8", "year_th": "2569",
  "product_category": "กุ้งขาว",
  "product_name": "กุ้งขาวแวนนาไม ขนาด 70 ตัว/กก.",
  "market_name": "ตลาดกลางกุ้งสมุทรสาคร", "province": "สมุทรสาคร",
  "day_price": 140, "unit": "บาท/กก."
}
```
- หนึ่งแถว = ราคาหนึ่งสินค้า(เกรด) ณ หนึ่งตลาด/จังหวัด — **ราคาเดียว** (`day_price`) ไม่มี min/max
- ปีเป็น พ.ศ. ใน `year_th`; `data_date` เป็น ค.ศ. ISO
- ไม่มี numeric id → ใช้ natural key: `product_name` = sourceProductId, `market_name|province` = sourceMarketId
- เก็บใน DB เป็น `priceType="market"` โดย `day_price` → `priceAvg` (min/max null ที่ระดับ snapshot;
  หน้า /prices คำนวณช่วงราคาระหว่างตลาดของวันล่าสุดตอนแสดงผล)

## Endpoints อื่นที่มีแต่ยังไม่ preflight (สำหรับ Phase ถัดไป)
`weekly-prices/*`, `monthly-prices/*`, `price-index-{month,quarter,year}/*`,
`production`, `production-index-*`, `farmer-family` — ต้องตรวจ schema จริงก่อนใช้
(fetchCropProduction/fetchLivestockCensus ใน client ชี้ path จริงแล้วแต่ validator ยังเป็นโครงจากสเปค)

## Sync behavior
- `syncDailyPrices()`: latest-date → ไล่ทุกหน้า → validate/quarantine (ราคา ≤0, วันที่อนาคต, ชื่อว่าง)
  → upsert AgriProduct/AgriMarket → insert snapshot แบบ append-only (เช็คซ้ำด้วย findFirst
  เพราะ marketId nullable + SQLite ถือ NULL ไม่ซ้ำกันใน unique index) → บันทึก DataSyncRun เสมอ
- ครั้งแรก (2026-08-18): received=50, inserted=50, quarantined=0 → 21 products / 40 markets
- ปิดระบบได้ด้วย env `NABC_DISABLED=true`
