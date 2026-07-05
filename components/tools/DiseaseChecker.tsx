"use client";

import { useMemo, useState } from "react";
import { DISEASES, DISEASE_GROUPS } from "@/lib/diseaseData";

export default function DiseaseChecker({ initialName }: { initialName?: string }) {
  const initial = initialName
    ? DISEASES.find((d) => d.name === initialName)
    : undefined;
  const [group, setGroup] = useState(initial?.group ?? DISEASE_GROUPS[0]);
  const options = useMemo(() => DISEASES.filter((d) => d.group === group), [group]);
  const [name, setName] = useState(initial?.name ?? options[0].name);

  const result = useMemo(
    () => DISEASES.find((d) => d.group === group && d.name === name),
    [group, name],
  );

  function onGroupChange(g: string) {
    setGroup(g);
    const first = DISEASES.find((d) => d.group === g);
    if (first) setName(first.name);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      {/* Selector */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-mist p-6">
          <h2 className="font-display text-xl font-bold text-ink">เลือกสิ่งที่คุณพบ</h2>
          <p className="mt-1 text-sm text-stone">
            ครอบคลุม {DISEASE_GROUPS.length} กลุ่ม · {DISEASES.length} โรค/ปัญหาที่พบบ่อย
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-ink">กลุ่ม</span>
            <select
              value={group}
              onChange={(e) => onGroupChange(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-full bg-paper px-4 text-base text-ink ring-1 ring-ash focus:outline-none focus:ring-2 focus:ring-ink"
            >
              {DISEASE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-ink">โรค / อาการ</span>
            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-full bg-paper px-4 text-base text-ink ring-1 ring-ash focus:outline-none focus:ring-2 focus:ring-ink"
            >
              {options.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </label>

          {/* quick list of diseases in this group */}
          <div className="mt-5">
            <p className="eyebrow">โรคในกลุ่มนี้</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((d) => (
                <button
                  key={d.name}
                  onClick={() => setName(d.name)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    d.name === name ? "bg-lime-canopy text-ink" : "bg-paper text-stone hover:bg-linen"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl bg-mist p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag-chip text-xs">{result.group}</span>
            {result.aka && <span className="text-xs text-stone">({result.aka})</span>}
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink">{result.name}</h2>
          <p className="mt-2 text-[15px] text-ink/90">
            <span className="font-semibold">อาการเด่น:</span> {result.signs}
          </p>

          {result.urgent && (
            <p
              className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold text-paper"
              style={{ backgroundColor: "#e44b4b" }}
            >
              ⚠️ โรคติดต่อร้ายแรง — แยกสัตว์/พืชทันที งดเคลื่อนย้าย และแจ้งปศุสัตว์หรือเจ้าหน้าที่เกษตรในพื้นที่โดยเร็ว
            </p>
          )}

          {/* วิธีเช็ค */}
          <Section icon="🔍" title="วิธีเช็ค / สังเกตให้แน่ใจ" items={result.check} />

          {/* สาเหตุ */}
          <div className="mt-5 rounded-2xl bg-paper p-5">
            <p className="font-display font-bold text-ink">🧫 สาเหตุ</p>
            <p className="mt-2 text-[15px] text-ink/90">{result.cause}</p>
          </div>

          {/* วิธีแก้ไข */}
          <Section icon="🩹" title="วิธีแก้ไข / รักษา" items={result.treat} accent />

          {/* วิธีป้องกัน */}
          <Section icon="🛡️" title="วิธีป้องกัน" items={result.prevent} />

          <p className="mt-6 text-xs text-stone">
            * เป็นข้อมูลเบื้องต้นเพื่อการดูแล ไม่ใช่การวินิจฉัยทางการแพทย์ ปริมาณยา/สารและวิธีใช้อาจเปลี่ยนแปลงได้
            หากอาการรุนแรงหรือลุกลาม ควรปรึกษานักวิชาการเกษตร ประมงอำเภอ หรือสัตวแพทย์/ปศุสัตว์ในพื้นที่
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  items,
  accent,
}: {
  icon: string;
  title: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`mt-5 rounded-2xl p-5 ${
        accent ? "border-l-4 border-lime-canopy bg-paper" : "bg-paper"
      }`}
    >
      <p className="font-display font-bold text-ink">
        {icon} {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime-canopy text-xs text-ink"
            >
              ✓
            </span>
            <span className="text-[15px] text-ink/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
