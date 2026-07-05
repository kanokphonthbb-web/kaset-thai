"use client";

import { useMemo, useState } from "react";
import { CROPS, CROP_TYPES, MONTHS_TH, type CropType } from "@/lib/cropCalendar";

const TYPE_EMOJI: Record<CropType, string> = {
  ผัก: "🥬",
  พืชไร่: "🌾",
  ไม้ผล: "🥭",
  สมุนไพร: "🌿",
};

export default function PlantingCalendar({ initialCrop }: { initialCrop?: string }) {
  const highlighted = initialCrop
    ? CROPS.find((c) => c.name === initialCrop)
    : undefined;
  const now = new Date().getMonth() + 1;
  const [selected, setSelected] = useState<number>(now);
  const [type, setType] = useState<CropType | "ทั้งหมด">(
    highlighted?.type ?? "ทั้งหมด",
  );

  const filtered = useMemo(
    () => (type === "ทั้งหมด" ? CROPS : CROPS.filter((c) => c.type === type)),
    [type],
  );
  const recommended = filtered.filter((c) => c.months.includes(selected));

  return (
    <div className="space-y-10">
      {highlighted && (
        <div className="flex items-center gap-3 rounded-2xl bg-lime-canopy p-4">
          <span className="text-2xl" aria-hidden>{highlighted.emoji}</span>
          <p className="text-sm text-ink">
            แสดงข้อมูล <span className="font-bold">{highlighted.name}</span> ·{" "}
            {highlighted.harvest} — ดูแถวที่ไฮไลต์ในตารางด้านล่าง
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-ink">เลือกเดือนที่จะเริ่มปลูก</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MONTHS_TH.map((m, i) => {
              const monthNo = i + 1;
              const active = monthNo === selected;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelected(monthNo)}
                  className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors ${
                    active ? "bg-lime-canopy text-ink" : "bg-mist text-ink hover:bg-linen"
                  }`}
                  aria-pressed={active}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">ประเภทพืช</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["ทั้งหมด", ...CROP_TYPES] as const).map((t) => {
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors ${
                    active ? "bg-ink text-paper" : "bg-mist text-ink hover:bg-linen"
                  }`}
                  aria-pressed={active}
                >
                  {t === "ทั้งหมด" ? "🌱 ทั้งหมด" : `${TYPE_EMOJI[t]} ${t}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl bg-mist p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          🌱 แนะนำให้เริ่มปลูกในเดือน {MONTHS_TH[selected - 1]}
          {type !== "ทั้งหมด" && ` · ${type}`}
        </h2>
        {recommended.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <div key={c.name} className="rounded-2xl bg-paper p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>{c.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{c.name}</p>
                    <span className="tag-chip mt-1 text-[11px]">{c.type}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-lime-deep">⏱️ {c.harvest}</p>
                <p className="mt-1 text-sm text-stone">{c.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-stone">
            เดือนนี้ยังไม่มีพืชแนะนำในกลุ่มที่เลือก ลองเลือกเดือนหรือประเภทอื่นดูครับ
          </p>
        )}
      </div>

      {/* Full-year grid */}
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          ตารางช่วงเวลาปลูกทั้งปี{type !== "ทั้งหมด" && ` (${type})`}
        </h2>
        <p className="mt-1 text-sm text-stone">
          ช่องสีเขียวคือเดือนที่แนะนำให้เริ่มปลูก · เลื่อนซ้าย-ขวาได้บนมือถือ
        </p>
        <div className="mt-4 -mx-1 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-center text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-paper px-3 py-2 text-left font-semibold text-ink">พืช</th>
                {MONTHS_TH.map((m, i) => (
                  <th key={m} className={`px-2 py-2 font-semibold ${i + 1 === selected ? "text-ink" : "text-stone"}`}>
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.name}
                  className={`border-t border-linen ${highlighted?.name === c.name ? "bg-lime-canopy/30" : ""}`}
                >
                  <td className="sticky left-0 bg-paper px-3 py-2 text-left font-medium text-ink">
                    <span className="mr-1" aria-hidden>{c.emoji}</span>
                    {c.name}
                  </td>
                  {MONTHS_TH.map((_, i) => {
                    const on = c.months.includes(i + 1);
                    const isCol = i + 1 === selected;
                    return (
                      <td key={i} className="px-1 py-1.5">
                        <span
                          className="mx-auto block h-6 w-6 rounded-md"
                          style={{
                            backgroundColor: on
                              ? isCol ? "#2d8c3a" : "#d7eb80"
                              : isCol ? "#f0f0eb" : "transparent",
                          }}
                          aria-label={on ? "แนะนำ" : "ไม่แนะนำ"}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-stone">
        * ช่วงเวลาและอายุเก็บเกี่ยวเป็นแนวทางทั่วไปสำหรับพื้นที่ส่วนใหญ่ในไทย
        อาจต่างกันตามพันธุ์ สภาพอากาศ และปริมาณน้ำในพื้นที่ของคุณ
      </p>
    </div>
  );
}
