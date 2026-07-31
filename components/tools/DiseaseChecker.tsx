"use client";

import { useMemo, useState } from "react";
import { DISEASES, DISEASE_GROUPS } from "@/lib/diseaseData";
import { getDiseaseProducts, ROLE_LABELS, type DiseaseProductRoles } from "@/lib/diseaseProducts";
import { getSafetyContent, splitTreatByRisk } from "@/lib/diseaseSafety";
import ProductCard from "@/components/ProductCard";

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

  const diseaseProducts = useMemo(() => (result ? getDiseaseProducts(result) : null), [result]);
  const safety = useMemo(() => (result ? getSafetyContent(result) : null), [result]);
  const treatSplit = useMemo(() => (result ? splitTreatByRisk(result) : null), [result]);

  function onGroupChange(g: string) {
    setGroup(g);
    const first = DISEASES.find((d) => d.group === g);
    if (first) setName(first.name);
  }

  const hasAnyProduct = diseaseProducts
    ? (Object.keys(ROLE_LABELS) as (keyof DiseaseProductRoles)[]).some(
        (role) => diseaseProducts.roles[role].length > 0,
      )
    : false;

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
      {result && safety && treatSplit && (
        <div className="rounded-2xl bg-mist p-6 sm:p-8">
          {result.urgent && (
            <p
              className="mb-6 rounded-2xl px-4 py-3 text-sm font-semibold text-paper"
              style={{ backgroundColor: "#e44b4b" }}
            >
              ⚠️ โรคติดต่อร้ายแรง — แยกสัตว์/พืชทันที งดเคลื่อนย้าย และแจ้งปศุสัตว์หรือเจ้าหน้าที่เกษตรในพื้นที่โดยเร็ว
            </p>
          )}

          {/* 1. สิ่งที่คุณเลือก */}
          <div className="rounded-2xl bg-paper p-5">
            <p className="font-display font-bold text-ink">1. สิ่งที่คุณเลือก</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tag-chip text-xs">{result.group}</span>
              {result.aka && <span className="text-xs text-stone">({result.aka})</span>}
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink">{result.name}</h2>
            <p className="mt-2 text-[15px] text-ink/90">
              <span className="font-semibold">อาการเด่น:</span> {result.signs}
            </p>
          </div>

          {/* 2. สาเหตุที่เป็นไปได้ */}
          <div className="mt-5 rounded-2xl bg-paper p-5">
            <p className="font-display font-bold text-ink">2. สาเหตุที่เป็นไปได้</p>
            <p className="mt-2 text-[15px] text-ink/90">{result.cause}</p>
            <p className="mt-2 text-sm text-stone">
              อาการนี้อาจเกิดได้จากหลายสาเหตุ ข้อมูลนี้เป็นแนวทางเบื้องต้น ไม่ใช่การวินิจฉัยที่แน่นอน
            </p>
          </div>

          {/* 3. สิ่งที่ควรตรวจสอบเพิ่มเติม */}
          <Section icon="🔍" title="3. สิ่งที่ควรตรวจสอบเพิ่มเติม" items={result.check} />

          {/* 4. แนวทางดูแลเบื้องต้น (ความเสี่ยงต่ำ) */}
          <Section
            icon="🩹"
            title="4. แนวทางดูแลเบื้องต้น (ความเสี่ยงต่ำ)"
            items={treatSplit.lowRisk}
            accent
          />
          {treatSplit.needsConsult.length > 0 && (
            <div className="mt-3 rounded-2xl bg-linen px-5 py-4">
              <p className="text-sm font-semibold text-ink">รายการที่ควรปรึกษาผู้เชี่ยวชาญก่อนใช้</p>
              <ul className="mt-2 space-y-1.5">
                {treatSplit.needsConsult.map((it) => (
                  <li key={it} className="text-sm text-ink/80">
                    · {it}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. สัญญาณที่ควรหยุดดูแลเอง */}
          <Section
            icon="⚠️"
            title="5. สัญญาณที่ควรหยุดดูแลเอง"
            items={safety.stopSignals}
            warn
          />

          {/* 6. เมื่อไรควรปรึกษาผู้เชี่ยวชาญ */}
          <Section icon="🧑‍⚕️" title="6. เมื่อไรควรปรึกษาผู้เชี่ยวชาญ" items={safety.consult} />

          {/* 7. แหล่งข้อมูลทางการ */}
          <div className="mt-5 rounded-2xl bg-paper p-5">
            <p className="font-display font-bold text-ink">7. ข้อมูลอ้างอิงหน่วยงานราชการ</p>
            <ul className="mt-3 space-y-2">
              {safety.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="text-[15px] font-medium text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 8. อุปกรณ์วัด/อุปกรณ์ป้องกัน (PPE) */}
          <Section icon="🥾" title="8. อุปกรณ์วัด/อุปกรณ์ป้องกัน (PPE)" items={safety.ppe} />
          {diseaseProducts && diseaseProducts.roles.ppe.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {diseaseProducts.roles.ppe.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.slug}
                  product={{ id: p.slug!, slug: p.slug!, name: p.name, imageUrl: p.imageUrl }}
                  compact
                />
              ))}
            </div>
          )}

          {/* 9. สินค้าที่เกี่ยวข้อง */}
          {diseaseProducts && hasAnyProduct && (
            <div className="mt-5 rounded-2xl bg-paper p-5">
              <p className="font-display font-bold text-ink">9. สินค้าที่เกี่ยวข้อง</p>

              {diseaseProducts.safetyNote && (
                <p className="mt-2 rounded-xl bg-linen px-4 py-3 text-sm text-ink/90">
                  ⚠️ {diseaseProducts.safetyNote}
                  {result.urgent &&
                    " สินค้าเหล่านี้ช่วยลดความเสี่ยงและดูแลความสะอาดฟาร์มเท่านั้น ไม่ใช่การรักษาหรือรับประกันว่าจะหายจากโรค ควรติดต่อเจ้าหน้าที่ปศุสัตว์หรือสัตวแพทย์ทันทีเมื่อสงสัยโรคติดต่อ"}
                </p>
              )}

              {(["diagnose", "manage", "prevent"] as (keyof DiseaseProductRoles)[]).map((role) => {
                const items = diseaseProducts.roles[role];
                if (items.length === 0) return null;
                const label = ROLE_LABELS[role];
                return (
                  <div key={role} className="mt-4">
                    <p className="text-sm font-semibold text-ink">
                      {label.icon} {label.title}
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {items.slice(0, 4).map((p) => (
                        <ProductCard
                          key={p.slug}
                          product={{ id: p.slug!, slug: p.slug!, name: p.name, imageUrl: p.imageUrl }}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* วิธีป้องกันไม่ให้เกิดซ้ำ */}
          <Section icon="🛡️" title="วิธีป้องกันไม่ให้เกิดซ้ำ" items={result.prevent} />

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
  warn,
}: {
  icon: string;
  title: string;
  items: string[];
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`mt-5 rounded-2xl p-5 ${
        warn
          ? "border-l-4 border-[#e44b4b] bg-paper"
          : accent
            ? "border-l-4 border-lime-canopy bg-paper"
            : "bg-paper"
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
              className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs text-ink ${
                warn ? "bg-[#f3b3b3]" : "bg-lime-canopy"
              }`}
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
