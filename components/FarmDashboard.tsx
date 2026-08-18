"use client";

// Farm Dashboard — การ์ดเรียบง่ายสไตล์เว็บเดิม ไม่ใช่ admin dashboard
// การตั้งค่า (จังหวัด/พืช/พื้นที่) เก็บใน localStorage เท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
import { useEffect, useState } from "react";
import Link from "next/link";
import { PROVINCES, findProvinceBySlug, provincesByRegion } from "@/lib/weather/locations";
import { CROPS } from "@/lib/cropCalendar";
import { condInfo } from "@/lib/weather/condCodes";
import { track } from "@/lib/analytics";
import { num } from "@/lib/format";

const STORAGE_KEY = "kaset-farm-settings-v1";

interface FarmSettings {
  provinceSlug: string;
  cropName: string;
  areaRai: number | null;
}

interface WeatherPayload {
  now: {
    time: string;
    tempC: number | null;
    humidityPct: number | null;
    rainMm: number | null;
    windSpeedMs: number | null;
    cond: number | null;
  } | null;
  rain24hMm: number;
  indicators: Array<{ id: string; labelTh: string; severity: string; messageTh: string }>;
  lowRainWindows6h: Array<{ start: string; end: string; hours: number }>;
  fetchedAt: string;
}

function loadSettings(): FarmSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as FarmSettings;
    if (!s.provinceSlug || !findProvinceBySlug(s.provinceSlug)) return null;
    return s;
  } catch {
    return null;
  }
}

const timeTh = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
});
const dayTimeTh = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const QUICK_TOOLS = [
  { href: "/tools/irrigation-calculator", label: "คำนวณน้ำ", icon: "💧" },
  { href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ย", icon: "🧪" },
  { href: "/tools/farm-income-calculator", label: "รายได้-กำไร", icon: "💰" },
  { href: "/tools/rain-window-planner", label: "ช่วงฝนน้อย", icon: "🌦️" },
  { href: "/tools/farm-record", label: "บันทึกฟาร์ม", icon: "📒" },
  { href: "/tools/disease-check", label: "เช็กอาการโรค", icon: "🔎" },
];

export default function FarmDashboard() {
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  // ฟอร์มตั้งค่า
  const [formProvince, setFormProvince] = useState("");
  const [formCrop, setFormCrop] = useState("");
  const [formArea, setFormArea] = useState<string>("");

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setLoaded(true);
    track("farm_dashboard_view", { configured: Boolean(s) });
    if (s) {
      setFormProvince(s.provinceSlug);
      setFormCrop(s.cropName);
      setFormArea(s.areaRai != null ? String(s.areaRai) : "");
    }
  }, []);

  useEffect(() => {
    if (!settings) return;
    let cancelled = false;
    setWeather(null);
    setWeatherError(false);
    fetch(`/api/weather/${settings.provinceSlug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setWeather(data as WeatherPayload);
      })
      .catch(() => {
        if (!cancelled) setWeatherError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!formProvince) return;
    const next: FarmSettings = {
      provinceSlug: formProvince,
      cropName: formCrop,
      areaRai: formArea !== "" && Number(formArea) > 0 ? Number(formArea) : null,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage อาจถูกปิด — ใช้งานต่อแบบ in-memory
    }
    setSettings(next);
    setEditing(false);
    track("farm_crop_select", { province: next.provinceSlug, has_crop: Boolean(next.cropName) });
  }

  if (!loaded) {
    return <div className="rounded-2xl bg-mist p-8 text-center text-stone">กำลังโหลด…</div>;
  }

  const province = settings ? findProvinceBySlug(settings.provinceSlug) : null;
  const crop = settings?.cropName ? CROPS.find((c) => c.name === settings.cropName) ?? null : null;
  const currentMonth = new Date().getMonth() + 1;

  if (!settings || editing) {
    return (
      <form onSubmit={saveSettings} className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">ตั้งค่าฟาร์มของคุณ</h2>
        <p className="mt-2 text-sm text-stone">
          ข้อมูลนี้เก็บไว้ในเครื่องของคุณเท่านั้น ไม่ต้องสมัครสมาชิก ไม่ส่งขึ้นเซิร์ฟเวอร์
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-semibold text-ink">จังหวัด</span>
            <select
              value={formProvince}
              onChange={(e) => setFormProvince(e.target.value)}
              required
              className="mt-2 w-full min-h-[48px] rounded-full border border-ash bg-paper px-4"
            >
              <option value="">— เลือกจังหวัด —</option>
              {provincesByRegion().map((g) => (
                <optgroup key={g.region} label={g.labelTh}>
                  {g.provinces.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.nameTh}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink">พืชหลัก (ไม่บังคับ)</span>
            <select
              value={formCrop}
              onChange={(e) => setFormCrop(e.target.value)}
              className="mt-2 w-full min-h-[48px] rounded-full border border-ash bg-paper px-4"
            >
              <option value="">— ไม่ระบุ —</option>
              {CROPS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink">พื้นที่ (ไร่ ไม่บังคับ)</span>
            <input
              type="number"
              min="0"
              step="0.25"
              value={formArea}
              onChange={(e) => setFormArea(e.target.value)}
              className="mt-2 w-full min-h-[48px] rounded-full border border-ash bg-paper px-4"
              placeholder="เช่น 5"
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            บันทึกการตั้งค่า
          </button>
          {settings ? (
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-stone">
          ฟาร์มของคุณ: <strong className="text-ink">{province?.nameTh}</strong>
          {crop ? (
            <>
              {" "}
              · {crop.emoji} {crop.name}
            </>
          ) : null}
          {settings.areaRai ? <> · {num(settings.areaRai)} ไร่</> : null}
        </p>
        <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>
          แก้ไขการตั้งค่า
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* อากาศวันนี้ */}
        <div className="rounded-2xl bg-mist p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">อากาศเกษตรวันนี้</h2>
            <Link
              href={`/weather/${settings.provinceSlug}`}
              className="text-sm font-semibold text-ink underline"
              onClick={() => track("farm_weather_click", { province: settings.provinceSlug })}
            >
              ดูรายละเอียด →
            </Link>
          </div>
          {weather ? (
            <>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="font-display text-3xl font-bold text-ink">
                  {weather.now?.tempC != null ? `${num(weather.now.tempC)}°C` : "-"}
                </span>
                <span className="text-stone">{condInfo(weather.now?.cond).labelTh}</span>
                <span className="text-sm text-stone">
                  ความชื้น {weather.now?.humidityPct != null ? `${num(weather.now.humidityPct)}%` : "-"}
                </span>
              </div>
              <p className="mt-3 text-sm text-stone">
                ฝนสะสม 24 ชม. ตามพยากรณ์:{" "}
                <strong className="text-ink">{num(weather.rain24hMm)} มม.</strong>
              </p>
              {weather.indicators.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {weather.indicators.map((ind) => (
                    <li
                      key={ind.id}
                      className={`rounded-xl border-l-4 bg-paper p-3 text-sm ${
                        ind.severity === "caution" ? "border-coral" : "border-gold"
                      }`}
                    >
                      <strong className="text-ink">{ind.labelTh}</strong>{" "}
                      <span className="text-stone">{ind.messageTh}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-stone">ไม่มีตัวชี้วัดที่ต้องเฝ้าระวังใน 24 ชม. ข้างหน้า</p>
              )}
              {weather.lowRainWindows6h.length > 0 ? (
                <p className="mt-3 text-sm text-stone">
                  ช่วงฝนน้อยตามพยากรณ์ถัดไป:{" "}
                  <strong className="text-ink">
                    {dayTimeTh.format(new Date(weather.lowRainWindows6h[0].start))} –{" "}
                    {dayTimeTh.format(new Date(weather.lowRainWindows6h[0].end))}
                  </strong>{" "}
                  ({weather.lowRainWindows6h[0].hours} ชม.)
                </p>
              ) : null}
              <p className="mt-3 text-xs text-stone">
                แหล่งข้อมูล: กรมอุตุนิยมวิทยา · ข้อมูลเมื่อ {timeTh.format(new Date(weather.fetchedAt))} น.
              </p>
            </>
          ) : weatherError ? (
            <p className="mt-4 text-sm text-stone">
              แหล่งข้อมูลพยากรณ์ยังไม่ตอบสนองในขณะนี้ —{" "}
              <Link href={`/weather/${settings.provinceSlug}`} className="underline">
                ลองเปิดหน้าอากาศ
              </Link>
            </p>
          ) : (
            <p className="mt-4 text-sm text-stone">กำลังโหลดพยากรณ์…</p>
          )}
        </div>

        {/* พืชและปฏิทิน */}
        <div className="rounded-2xl bg-mist p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">พืชของคุณ</h2>
            <Link
              href="/tools/calendar"
              className="text-sm font-semibold text-ink underline"
              onClick={() => track("farm_tool_click", { tool: "calendar" })}
            >
              ปฏิทินเพาะปลูก →
            </Link>
          </div>
          {crop ? (
            <>
              <p className="mt-4 text-stone">
                <span className="text-2xl" aria-hidden>
                  {crop.emoji}
                </span>{" "}
                <strong className="text-ink">{crop.name}</strong> · {crop.harvest}
              </p>
              <p className="mt-2 text-sm text-stone">{crop.note}</p>
              <p className="mt-3 text-sm">
                {crop.months.includes(currentMonth) ? (
                  <span className="font-semibold text-forest">เดือนนี้อยู่ในช่วงที่นิยมเริ่มปลูก</span>
                ) : (
                  <span className="text-stone">
                    เดือนนี้ไม่ใช่ช่วงเริ่มปลูกที่นิยมของพืชนี้ (ดูรายละเอียดในปฏิทินเพาะปลูก)
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-stone">
              ยังไม่ได้เลือกพืชหลัก — กด &quot;แก้ไขการตั้งค่า&quot; เพื่อเลือก
              แล้วเราจะแสดงช่วงปลูกและเครื่องมือที่เกี่ยวข้องให้
            </p>
          )}
        </div>

        {/* ราคา */}
        <div className="rounded-2xl bg-mist p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">ราคาสินค้าเกษตร</h2>
            <Link
              href="/prices"
              className="text-sm font-semibold text-ink underline"
              onClick={() => track("farm_price_click", {})}
            >
              ดูหน้าราคา →
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone">
            ระบบราคายังไม่ได้เชื่อมต่อแหล่งข้อมูลทางการ เมื่อเชื่อมต่อแล้วการ์ดนี้จะแสดงราคาล่าสุด
            ของสินค้าที่คุณติดตามโดยอัตโนมัติ — เราแสดงเฉพาะข้อมูลจริงเท่านั้น
          </p>
        </div>

        {/* เครื่องมือด่วน */}
        <div className="rounded-2xl bg-mist p-6">
          <h2 className="font-display text-lg font-bold text-ink">เครื่องมือด่วน</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-xl bg-paper p-3 text-center text-sm font-semibold text-ink hover:bg-linen"
                onClick={() => track("farm_tool_click", { tool: t.href })}
              >
                <span className="block text-2xl" aria-hidden>
                  {t.icon}
                </span>
                <span className="mt-1 block">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
