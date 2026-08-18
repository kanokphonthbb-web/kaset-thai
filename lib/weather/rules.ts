// Agricultural Weather Rule Engine — deterministic เท่านั้น ไม่มี AI
//
// นโยบายสำคัญ (ตาม docs/api-notes/TMD_API_NOTES.md และสเปคโปรเจกต์):
// - ทุก threshold ต้องมีแหล่งอ้างอิงทางการ ระบุใน `source` ของแต่ละ rule
// - ผลลัพธ์เป็น "ตัวชี้วัดสภาพอากาศ (Weather Indicator)" ของเว็บไซต์เท่านั้น
//   ไม่ใช่ประกาศเตือนภัยของกรมอุตุนิยมวิทยา และไม่ใช่คำวินิจฉัยทางวิชาการเกษตร
// - ห้ามฟันธงโรคพืช/สั่งการเกษตร — ใช้ภาษา "อาจ/ควรติดตาม" เสมอ

export type Severity = "info" | "watch" | "caution";

export interface WeatherRule {
  id: string;
  metric: "rain24h" | "rainDaily" | "wind" | "tempMax" | "humidityHigh";
  labelTh: string;
  severity: Severity;
  messageTh: string;
  /** แหล่งอ้างอิงของเกณฑ์ — ต้องเป็นเกณฑ์ทางการ */
  source: string;
  sourceVersion: string;
  test: (v: number) => boolean;
}

// เกณฑ์ปริมาณฝน (มม./24 ชม.) — เกณฑ์ทางการของกรมอุตุนิยมวิทยา:
// ฝนเล็กน้อย 0.1–10.0, ฝนปานกลาง 10.1–35.0, ฝนหนัก 35.1–90.0, ฝนหนักมาก > 90.0
const RAIN_SOURCE = "เกณฑ์ปริมาณฝนสะสม 24 ชม. กรมอุตุนิยมวิทยา (tmd.go.th)";
// เกณฑ์อุณหภูมิสูงสุด — เกณฑ์ทางการของกรมอุตุนิยมวิทยา:
// อากาศร้อน 35.0–39.9°C, อากาศร้อนจัด ≥ 40.0°C
const TEMP_SOURCE = "เกณฑ์อากาศร้อน/ร้อนจัด กรมอุตุนิยมวิทยา (tmd.go.th)";
// เกณฑ์ลมแรง — มาตรา Beaufort ที่กรมอุตุนิยมวิทยาใช้:
// ลมแรง (strong breeze ขึ้นไป) ≥ 10.8 m/s (Beaufort 6)
const WIND_SOURCE = "มาตราลม Beaufort ตามที่กรมอุตุนิยมวิทยาเผยแพร่ (tmd.go.th)";

export const AGRI_WEATHER_RULES: WeatherRule[] = [
  {
    id: "rain24h-heavy",
    metric: "rain24h",
    labelTh: "ฝนหนักตามพยากรณ์",
    severity: "caution",
    messageTh:
      "พยากรณ์ฝนสะสม 24 ชม. อยู่ในเกณฑ์ฝนหนัก (มากกว่า 35 มม.) ควรตรวจการระบายน้ำของแปลง/บ่อ และติดตามประกาศของกรมอุตุนิยมวิทยา",
    source: RAIN_SOURCE,
    sourceVersion: "2026-08",
    test: (mm) => mm > 35.0,
  },
  {
    id: "rain24h-moderate",
    metric: "rain24h",
    labelTh: "ฝนปานกลางตามพยากรณ์",
    severity: "watch",
    messageTh:
      "พยากรณ์ฝนสะสม 24 ชม. อยู่ในเกณฑ์ฝนปานกลาง (10.1–35 มม.) งานกลางแจ้งบางประเภทอาจต้องเผื่อเวลา",
    source: RAIN_SOURCE,
    sourceVersion: "2026-08",
    test: (mm) => mm > 10.0 && mm <= 35.0,
  },
  {
    id: "temp-very-hot",
    metric: "tempMax",
    labelTh: "อากาศร้อนจัดตามพยากรณ์",
    severity: "caution",
    messageTh:
      "อุณหภูมิสูงสุดตามพยากรณ์อยู่ในเกณฑ์ร้อนจัด (ตั้งแต่ 40°C) ควรดูแลน้ำสำหรับพืชและสัตว์ให้เพียงพอ และเลี่ยงงานหนักกลางแดดช่วงบ่าย",
    source: TEMP_SOURCE,
    sourceVersion: "2026-08",
    test: (tc) => tc >= 40.0,
  },
  {
    id: "temp-hot",
    metric: "tempMax",
    labelTh: "อากาศร้อนตามพยากรณ์",
    severity: "watch",
    messageTh:
      "อุณหภูมิสูงสุดตามพยากรณ์อยู่ในเกณฑ์อากาศร้อน (35–39.9°C) ควรจัดการน้ำและการระบายอากาศโรงเรือนล่วงหน้า",
    source: TEMP_SOURCE,
    sourceVersion: "2026-08",
    test: (tc) => tc >= 35.0 && tc < 40.0,
  },
  {
    id: "wind-strong",
    metric: "wind",
    labelTh: "ลมแรงตามพยากรณ์",
    severity: "caution",
    messageTh:
      "ความเร็วลมตามพยากรณ์อยู่ในเกณฑ์ลมแรง (ตั้งแต่ 10.8 ม./วินาที) ควรตรวจความมั่นคงของโรงเรือน ค้าง และตาข่าย",
    source: WIND_SOURCE,
    sourceVersion: "2026-08",
    test: (ms) => ms >= 10.8,
  },
];

export interface TriggeredIndicator {
  id: string;
  labelTh: string;
  severity: Severity;
  messageTh: string;
  source: string;
  value: number;
}

/** ประเมิน indicators จากค่าพยากรณ์ — คืนเฉพาะ rule ที่เข้าเกณฑ์ (rule แรกที่ match ต่อ metric) */
export function evaluateIndicators(values: {
  rain24hMm?: number | null;
  tempMaxC?: number | null;
  maxWindMs?: number | null;
}): TriggeredIndicator[] {
  const out: TriggeredIndicator[] = [];
  const byMetric: Array<[WeatherRule["metric"], number | null | undefined]> = [
    ["rain24h", values.rain24hMm],
    ["tempMax", values.tempMaxC],
    ["wind", values.maxWindMs],
  ];
  for (const [metric, value] of byMetric) {
    if (value == null || !Number.isFinite(value)) continue;
    const rule = AGRI_WEATHER_RULES.find((r) => r.metric === metric && r.test(value));
    if (rule) {
      out.push({
        id: rule.id,
        labelTh: rule.labelTh,
        severity: rule.severity,
        messageTh: rule.messageTh,
        source: rule.source,
        value,
      });
    }
  }
  return out;
}

/**
 * หา "ช่วงฝนน้อยตามข้อมูลพยากรณ์" (rain window) จาก hourly forecast
 * นิยาม: ช่วงต่อเนื่องที่ฝนรายชั่วโมง <= thresholdMmPerHour (ค่าเริ่มต้น 0.1 มม.
 * = ต่ำกว่าเกณฑ์ "ฝนเล็กน้อย" ของกรมอุตุนิยมวิทยา ซึ่งเริ่มที่ 0.1 มม.)
 * ห้ามเรียกผลลัพธ์ว่า "ช่วงปลอดฝนแน่นอน" — เป็นพยากรณ์เท่านั้น
 */
export function findLowRainWindows(
  hours: Array<{ time: string; rainMm: number }>,
  minHours: number,
  thresholdMmPerHour = 0.1,
): Array<{ start: string; end: string; hours: number }> {
  const windows: Array<{ start: string; end: string; hours: number }> = [];
  let runStart = -1;
  for (let i = 0; i <= hours.length; i++) {
    const dry = i < hours.length && hours[i].rainMm <= thresholdMmPerHour;
    if (dry && runStart === -1) runStart = i;
    if (!dry && runStart !== -1) {
      const len = i - runStart;
      if (len >= minHours) {
        windows.push({ start: hours[runStart].time, end: hours[i - 1].time, hours: len });
      }
      runStart = -1;
    }
  }
  return windows;
}

/** ฝนสะสมรวมของช่วง n ชั่วโมงแรก (ใช้ทำ 24/48/72 ชม.) */
export function sumRain(hours: Array<{ rainMm: number }>, take: number): number {
  return hours.slice(0, take).reduce((s, h) => s + (Number.isFinite(h.rainMm) ? h.rainMm : 0), 0);
}
