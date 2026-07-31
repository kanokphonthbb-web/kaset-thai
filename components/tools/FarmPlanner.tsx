"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  recommendFarmingOptions,
  type FarmPlannerInput,
  type FarmPlannerOption,
  type FarmingCategory,
  type WaterSource,
  type TimeAvailable,
  type ExperienceLevel,
  type Interest,
  type IncomeSpeed,
  type Purpose,
} from "@/lib/farmPlanner";

// Curated short list of Thai provinces (representative of major farming
// regions, not exhaustive) — province is collected for context only and
// isn't part of the scoring logic, so a free-text field would work just as
// well; a select keeps the form simple and avoids typos/analytics noise.
const PROVINCES = [
  "กรุงเทพมหานคร",
  "เชียงใหม่",
  "เชียงราย",
  "ลำปาง",
  "พิษณุโลก",
  "นครสวรรค์",
  "ขอนแก่น",
  "อุดรธานี",
  "นครราชสีมา",
  "อุบลราชธานี",
  "บุรีรัมย์",
  "สุรินทร์",
  "ชัยภูมิ",
  "สระบุรี",
  "นครปฐม",
  "ราชบุรี",
  "กาญจนบุรี",
  "ชลบุรี",
  "ระยอง",
  "จันทบุรี",
  "สุราษฎร์ธานี",
  "นครศรีธรรมราช",
  "สงขลา",
  "กระบี่",
  "อื่นๆ",
];

const WATER_SOURCES: WaterSource[] = ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล", "ต้องซื้อน้ำ", "ไม่แน่ใจ"];
const TIME_OPTIONS: TimeAvailable[] = ["เต็มเวลา", "ครึ่งวัน", "ไม่กี่ชั่วโมง/วัน", "วันหยุดเท่านั้น"];
const EXPERIENCE_OPTIONS: ExperienceLevel[] = ["ไม่มีประสบการณ์", "เคยลองทำ", "มีประสบการณ์"];
const INTEREST_OPTIONS: Interest[] = ["พืชผัก/ไม้ผล", "ปศุสัตว์", "ประมง/สัตว์น้ำ", "แบบผสมผสาน"];
const INCOME_SPEED_OPTIONS: IncomeSpeed[] = [
  "เร็ว(น้อยกว่า 6 เดือน)",
  "ปานกลาง(6-12 เดือน)",
  "ระยะยาว(มากกว่า1ปี)",
];
const PURPOSE_OPTIONS: Purpose[] = ["เพื่อบริโภคเอง", "รายได้เสริม", "เป็นอาชีพหลัก"];

const DEFAULTS: FarmPlannerInput = {
  province: PROVINCES[0],
  landSizeRai: 1,
  waterSource: "ไม่แน่ใจ",
  budget: 10000,
  timeAvailable: "ครึ่งวัน",
  experience: "ไม่มีประสบการณ์",
  interest: "พืชผัก/ไม้ผล",
  incomeSpeed: "ปานกลาง(6-12 เดือน)",
  purpose: "รายได้เสริม",
};

const CATEGORY_LABELS: Record<FarmingCategory, string> = {
  plants: "พืชผัก/ไม้ผล",
  animals: "ปศุสัตว์",
  fishery: "ประมง/สัตว์น้ำ",
  "mixed-farming": "เกษตรผสมผสาน",
};

type N = number | "";

export default function FarmPlanner({
  affiliateSlots,
}: {
  affiliateSlots?: Partial<Record<FarmingCategory, ReactNode>>;
}) {
  const [province, setProvince] = useState(DEFAULTS.province);
  const [landSizeRai, setLandSizeRai] = useState<N>(DEFAULTS.landSizeRai);
  const [waterSource, setWaterSource] = useState<WaterSource>(DEFAULTS.waterSource);
  const [budget, setBudget] = useState<N>(DEFAULTS.budget);
  const [timeAvailable, setTimeAvailable] = useState<TimeAvailable>(DEFAULTS.timeAvailable);
  const [experience, setExperience] = useState<ExperienceLevel>(DEFAULTS.experience);
  const [interest, setInterest] = useState<Interest>(DEFAULTS.interest);
  const [incomeSpeed, setIncomeSpeed] = useState<IncomeSpeed>(DEFAULTS.incomeSpeed);
  const [purpose, setPurpose] = useState<Purpose>(DEFAULTS.purpose);

  const [results, setResults] = useState<FarmPlannerOption[] | null>(null);

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: "farm-planner" });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    track(TOOL_EVENTS.tool_submit, { tool: "farm-planner" });

    const input: FarmPlannerInput = {
      province,
      landSizeRai: typeof landSizeRai === "number" ? landSizeRai : 0,
      waterSource,
      budget: typeof budget === "number" ? budget : 0,
      timeAvailable,
      experience,
      interest,
      incomeSpeed,
      purpose,
    };
    const options = recommendFarmingOptions(input);
    setResults(options);

    track(TOOL_EVENTS.tool_result, {
      tool: "farm-planner",
      result_count: options.length,
      top_category: options[0]?.category,
    });
  }

  function handleReset() {
    setProvince(DEFAULTS.province);
    setLandSizeRai(DEFAULTS.landSizeRai);
    setWaterSource(DEFAULTS.waterSource);
    setBudget(DEFAULTS.budget);
    setTimeAvailable(DEFAULTS.timeAvailable);
    setExperience(DEFAULTS.experience);
    setInterest(DEFAULTS.interest);
    setIncomeSpeed(DEFAULTS.incomeSpeed);
    setPurpose(DEFAULTS.purpose);
    setResults(null);
    track(TOOL_EVENTS.tool_reset, { tool: "farm-planner" });
  }

  function handlePrint() {
    track(TOOL_EVENTS.tool_print, { tool: "farm-planner" });
    window.print();
  }

  const affiliateSlot = useMemo(() => {
    if (!results || results.length === 0 || !affiliateSlots) return null;
    return affiliateSlots[results[0].category] ?? null;
  }, [results, affiliateSlots]);

  return (
    <div className="grid gap-8">
      <form onSubmit={handleSubmit} className="card">
        <h2 className="font-display text-xl font-bold text-ink">กรอกข้อมูลของคุณ</h2>
        <p className="mt-1 text-sm text-stone">
          ตอบตามความจริงของพื้นที่และทรัพยากรที่มี เพื่อให้ผลลัพธ์ใกล้เคียงที่สุด
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SelectField label="จังหวัด" value={province} onChange={setProvince} options={PROVINCES} />
          <NumberField
            label="ขนาดพื้นที่"
            value={landSizeRai}
            onChange={setLandSizeRai}
            suffix="ไร่"
            step={0.5}
          />
          <SelectField
            label="แหล่งน้ำ"
            value={waterSource}
            onChange={(v) => setWaterSource(v as WaterSource)}
            options={WATER_SOURCES}
          />
          <NumberField label="งบเริ่มต้น" value={budget} onChange={setBudget} suffix="บาท" step={500} />
          <SelectField
            label="เวลาที่มีต่อวัน"
            value={timeAvailable}
            onChange={(v) => setTimeAvailable(v as TimeAvailable)}
            options={TIME_OPTIONS}
          />
          <SelectField
            label="ประสบการณ์"
            value={experience}
            onChange={(v) => setExperience(v as ExperienceLevel)}
            options={EXPERIENCE_OPTIONS}
          />
          <SelectField
            label="ความสนใจ"
            value={interest}
            onChange={(v) => setInterest(v as Interest)}
            options={INTEREST_OPTIONS}
          />
          <SelectField
            label="ความเร็วของรายได้ที่ต้องการ"
            value={incomeSpeed}
            onChange={(v) => setIncomeSpeed(v as IncomeSpeed)}
            options={INCOME_SPEED_OPTIONS}
          />
          <SelectField
            label="เป้าหมาย"
            value={purpose}
            onChange={(v) => setPurpose(v as Purpose)}
            options={PURPOSE_OPTIONS}
          />
        </div>

        <div className="no-print mt-6 flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            ดูผลลัพธ์
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            ล้างข้อมูล
          </button>
          {results && (
            <button type="button" onClick={handlePrint} className="btn-secondary">
              🖨️ พิมพ์ / บันทึก PDF
            </button>
          )}
        </div>
      </form>

      {results && (
        <div className="print-card">
          <p className="rounded-2xl bg-lime-canopy p-4 text-sm text-ink">
            ผลลัพธ์นี้เป็นการคัดกรองเบื้องต้น เป็นทางเลือกที่ควรศึกษาเพิ่มเติม
            ไม่ใช่คำแนะนำที่รับประกันผลลัพธ์
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {results.map((option, i) => (
              <FarmingOptionCard key={option.id} rank={i + 1} option={option} />
            ))}
          </div>

          {affiliateSlot}
        </div>
      )}
    </div>
  );
}

function FarmingOptionCard({ rank, option }: { rank: number; option: FarmPlannerOption }) {
  return (
    <div className="rounded-2xl bg-mist p-6">
      <span className="tag-chip text-xs">
        อันดับ {rank} · {CATEGORY_LABELS[option.category]}
      </span>
      <h3 className="mt-3 font-display text-lg font-bold text-ink">{option.name}</h3>
      <p className="mt-2 text-[15px] text-ink/90">{option.whyItFits}</p>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="งบประมาณโดยประมาณ" value={option.budgetRange} />
        <Row label="ระยะเวลาก่อนได้ผลผลิตแรก" value={option.timeToFirstYield} />
        <Row label="ภาระงาน" value={option.workload} />
        <Row label="ความเสี่ยง" value={option.risk} />
      </dl>

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">ควรศึกษาเพิ่มเติม</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-ink/90">
          {option.whatToStudy.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">อุปกรณ์ที่อาจต้องเตรียม</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {option.equipment.map((eq) => (
            <span key={eq} className="tag-chip text-xs">
              {eq}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {option.relatedTools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="tag-chip text-xs hover:bg-linen"
            onClick={() =>
              track(TOOL_EVENTS.related_tool_click, { tool: "farm-planner", target: t.href })
            }
          >
            🧮 {t.label}
          </Link>
        ))}
        {option.relatedArticles.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="tag-chip text-xs hover:bg-linen"
            onClick={() =>
              track(TOOL_EVENTS.related_article_click, { tool: "farm-planner", target: a.href })
            }
          >
            📖 {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-ash/60 pt-2">
      <dt className="text-xs text-stone">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-[48px] w-full rounded-full bg-paper px-4 text-base text-ink ring-1 ring-ash focus:outline-none focus:ring-2 focus:ring-ink"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
