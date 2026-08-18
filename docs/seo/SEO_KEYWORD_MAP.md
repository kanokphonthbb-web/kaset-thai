# SEO Keyword Map — KasettakonThai (2026-08-18)

GSC ยังไม่ได้เชื่อม → คอลัมน์ Impressions/Position = unknown (ห้าม invent ตัวเลข)
หลักการ: 1 Search Intent = 1 Owner Page; supporting pages ลิงก์กลับ owner

## Tool owners (ใหม่รอบนี้)

| Cluster | Primary Keyword | Owner URL | Supporting | Impr. | Pos. | Priority |
|---|---|---|---|---|---|---|
| แปลงหน่วยพื้นที่ | 1 ไร่ กี่ตารางเมตร / ไร่ งาน ตารางวา | /tools/land-area-converter | บทความต้นทุนต่อไร่ทั้งหมด | unknown | unknown | สูง (volume คงที่ตลอดปี) |
| จำนวนต้นต่อไร่ | 1 ไร่ ปลูกได้กี่ต้น | /tools/plant-spacing-calculator | บทความปลูกพืชรายชนิด | unknown | unknown | สูง |
| คำนวณปุ๋ย | คำนวณปุ๋ย / ปุ๋ยกี่กระสอบ | /tools/fertilizer-calculator | /soil-water-fertilizer + บทความปุ๋ย | unknown | unknown | สูง |
| น้ำเพื่อการเกษตร | คำนวณน้ำ ระบบน้ำหยด | /tools/irrigation-calculator | /tools/pump-size-calculator, บทความระบบน้ำ | unknown | unknown | กลาง |
| กำไรเกษตร | คำนวณกำไรเกษตร รายได้ต่อไร่ | /tools/farm-income-calculator | /cost-profit cluster, /tools/farm-break-even-calculator | unknown | unknown | สูง |
| จุดคุ้มทุน | จุดคุ้มทุนเกษตร | /tools/farm-break-even-calculator | /tools/minimum-selling-price | unknown | unknown | กลาง |
| ผลผลิต | คำนวณผลผลิต | /tools/crop-yield-calculator | บทความ yield รายพืช | unknown | unknown | กลาง |
| FCR | FCR คืออะไร / คำนวณ FCR | /tools/fcr-calculator | /animals + /fishery cost articles | unknown | unknown | กลาง |
| เมล็ดพันธุ์ | คำนวณเมล็ดพันธุ์ต่อไร่ | /tools/seed-rate-calculator | บทความปลูกพืชไร่ | unknown | unknown | ต่ำ-กลาง |
| ปั๊มน้ำ | ขนาดปั๊มน้ำเกษตร | /tools/pump-size-calculator | /tools/irrigation-calculator, /tools/solar-pump-calculator | unknown | unknown | กลาง |
| เทียบราคาปุ๋ย | เปรียบเทียบราคาปุ๋ย ต้นทุนธาตุ | /tools/fertilizer-cost-comparison | /tools/fertilizer-calculator | unknown | unknown | กลาง |
| ไก่ไข่ | เลี้ยงไก่ไข่ กำไร | /tools/egg-farm-profit-calculator | บทความไก่ไข่ (/animals) | unknown | unknown | กลาง |
| ค่าอาหารสัตว์ | คำนวณค่าอาหารสัตว์ | /tools/livestock-feed-cost-calculator | /tools/fcr-calculator, /tools/animal-cost | unknown | unknown | ต่ำ-กลาง |
| โซลาร์ปั๊ม | โซลาร์เซลล์ปั๊มน้ำ คำนวณ | /tools/solar-pump-calculator | /agri-tech-tools | unknown | unknown | กลาง |

## Weather owners

| Cluster | Primary Keyword | Owner URL | Supporting | Priority |
|---|---|---|---|---|
| อากาศเกษตร | พยากรณ์อากาศเพื่อการเกษตร | /weather | /weather/[province] ×77 | สูง (repeat traffic) |
| อากาศรายจังหวัด | อากาศ{จังหวัด}วันนี้ | /weather/[slug] | rain tools | สูง สำหรับจังหวัดเกษตรหลัก |
| ฝนตกกี่โมง | ฝนตกกี่โมง / เช็คฝน | /tools/rain-window-planner | /weather | สูง |
| ฝนสะสม | พยากรณ์ฝนสะสม | /tools/rainfall-forecast-calculator | /weather | ต่ำ-กลาง |
| อากาศเก็บเกี่ยว | อากาศช่วงเก็บเกี่ยว | /tools/harvest-weather-planner | /weather, crop articles | ต่ำ-กลาง |

## Price owners (รอ data จริง — ห้ามสร้าง commodity pages ก่อนมีข้อมูล)

| Cluster | Primary Keyword | Owner URL | สถานะ |
|---|---|---|---|
| ราคาเกษตรรวม | ราคาสินค้าเกษตรวันนี้ | /prices | สร้างแล้ว (unavailable-state จนกว่า NABC เชื่อม) |
| ราคาปาล์ม/ข้าว/มัน/ยาง/ข้าวโพด/หมู/ไข่ | ราคา{สินค้า}วันนี้ | /prices/{slug} | ยังไม่สร้าง — สร้างเมื่อมี data จริง + intent ตรวจแล้วเท่านั้น |

## Platform

| Page | Keyword angle | หมายเหตุ |
|---|---|---|
| /farm-dashboard | แดชบอร์ดเกษตรกร (brand/repeat) | เป้าหมายคือ returning users ไม่ใช่ generic SEO |
| /data-sources, /data-methodology | trust/E-E-A-T signal | ลิงก์จาก footer + ทุกหน้า data |

## กระบวนการหลังมี GSC
รายสัปดาห์: ดู queries → map เข้า owner URL → ตำแหน่ง 4-10 = ลำดับความสำคัญสูงสุด (ปรับ content+internal links), impressions สูง CTR ต่ำ = ปรับ title/description
รายเดือน: หา cannibalization (intent ซ้ำ → merge/กำหนด supporting role), หาโอกาส tool/price page ใหม่จาก query จริง
