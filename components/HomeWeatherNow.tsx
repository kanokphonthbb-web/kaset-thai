"use client";

// การ์ดอากาศวันนี้บนหน้าแรก — เห็นค่าจริงทันทีไม่ต้องกดเข้าไป
// ใช้จังหวัดที่ผู้ใช้เคยตั้งไว้ (localStorage เดียวกับแดชบอร์ด) ค่าเริ่มต้น: กรุงเทพมหานคร
import { useEffect, useState } from "react";
import Link from "next/link";
import { findProvinceBySlug, provincesByRegion } from "@/lib/weather/locations";
import { condInfo } from "@/lib/weather/condCodes";
import { num } from "@/lib/format";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "kaset-farm-settings-v1";
const DEFAULT_PROVINCE = "bangkok";

interface WeatherPayload {
  now: { tempC: number | null; humidityPct: number | null; cond: number | null } | null;
  rain24hMm: number;
  indicators: Array<{ id: string; labelTh: string; severity: string }>;
  lowRainWindows6h: Array<{ start: string; end: string; hours: number }>;
  fetchedAt: string;
}

function savedProvince(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as { provinceSlug?: string };
      if (s.provinceSlug && findProvinceBySlug(s.provinceSlug)) return s.provinceSlug;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PROVINCE;
}

function persistProvince(slug: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, provinceSlug: slug }));
  } catch {
    // localStorage ปิดอยู่ — ใช้ต่อแบบไม่จำค่า
  }
}

const dayTimeTh = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function HomeWeatherNow() {
  const [slug, setSlug] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSlug(savedProvince());
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setWeather(null);
    setError(false);
    fetch(`/api/weather/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancelled) setWeather(d as WeatherPayload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const province = slug ? findProvinceBySlug(slug) : null;
  const cond = condInfo(weather?.now?.cond);
  const caution = weather?.indicators?.length ?? 0;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-paper p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink">🌤️ อากาศเกษตรวันนี้</h3>
        <select
          value={slug ?? DEFAULT_PROVINCE}
          onChange={(e) => {
            setSlug(e.target.value);
            persistProvince(e.target.value);
            track("weather_location_search", {});
          }}
          aria-label="เลือกจังหวัด"
          className="min-h-[40px] rounded-full border border-ash bg-paper px-3 text-sm"
        >
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
      </div>

      {weather ? (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="font-display text-4xl font-bold text-ink">
              {weather.now?.tempC != null ? `${num(weather.now.tempC)}°C` : "-"}
            </span>
            <span className="text-stone">{cond.labelTh}</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-mist px-3 py-2">
              <dt className="text-xs text-stone">ฝนสะสม 24 ชม. (พยากรณ์)</dt>
              <dd className="font-semibold text-ink">{num(weather.rain24hMm)} มม.</dd>
            </div>
            <div className="rounded-xl bg-mist px-3 py-2">
              <dt className="text-xs text-stone">ความชื้น</dt>
              <dd className="font-semibold text-ink">
                {weather.now?.humidityPct != null ? `${num(weather.now.humidityPct)}%` : "-"}
              </dd>
            </div>
          </dl>
          {weather.lowRainWindows6h.length > 0 ? (
            <p className="mt-3 text-sm text-stone">
              ช่วงฝนน้อยถัดไป:{" "}
              <strong className="text-ink">
                {dayTimeTh.format(new Date(weather.lowRainWindows6h[0].start))} –{" "}
                {dayTimeTh.format(new Date(weather.lowRainWindows6h[0].end))}
              </strong>
            </p>
          ) : (
            <p className="mt-3 text-sm text-stone">
              ไม่พบช่วงฝนน้อยต่อเนื่อง 6 ชม. ใน 48 ชม. ข้างหน้า (ตามพยากรณ์)
            </p>
          )}
          {caution > 0 ? (
            <p className="mt-1 text-sm font-semibold text-coral">
              มีตัวชี้วัดควรระวัง {caution} รายการ — ดูรายละเอียดในหน้าจังหวัด
            </p>
          ) : null}
        </>
      ) : error ? (
        <p className="mt-4 text-sm text-stone">
          แหล่งข้อมูลพยากรณ์ยังไม่ตอบสนองในขณะนี้ กรุณาลองใหม่ภายหลัง
        </p>
      ) : (
        <p className="mt-4 text-sm text-stone">กำลังโหลดพยากรณ์…</p>
      )}

      <div className="mt-auto pt-4">
        <Link
          href={province ? `/weather/${province.slug}` : "/weather"}
          className="btn-secondary"
          onClick={() => track("weather_view", { province: slug ?? "", source_page: "home" })}
        >
          ดูพยากรณ์ละเอียด →
        </Link>
      </div>
      <p className="mt-3 text-xs text-stone">แหล่งข้อมูล: กรมอุตุนิยมวิทยา</p>
    </div>
  );
}
