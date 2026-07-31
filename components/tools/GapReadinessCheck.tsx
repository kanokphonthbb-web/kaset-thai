"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  CHECKLIST,
  ALL_ITEMS,
  scoreGapReadiness,
  type AnswerValue,
  type ResultBucket,
} from "@/lib/gapReadiness";

const TOOL_SLUG = "gap-readiness-check";
const STORAGE_KEY = "kaset.gapReadiness.v1";

const BUCKET_BADGE_STYLE: Record<ResultBucket, { background: string; color: string }> = {
  "พร้อมเบื้องต้น": { background: "#bfe6a0", color: "#173a17" },
  "ต้องปรับปรุงบางส่วน": { background: "#f3d9a4", color: "#4a3400" },
  "ยังขาดข้อมูลสำคัญ": { background: "#f3b6b6", color: "#5c1414" },
};

function resultGroupFor(bucket: ResultBucket): string {
  if (bucket === "พร้อมเบื้องต้น") return "ready";
  if (bucket === "ต้องปรับปรุงบางส่วน") return "partial";
  return "not_ready";
}

const ANSWER_OPTIONS: { key: string; label: string; value: AnswerValue }[] = [
  { key: "yes", label: "ใช่", value: true },
  { key: "no", label: "ไม่ใช่", value: false },
  { key: "unsure", label: "ไม่แน่ใจ", value: "unsure" },
];

function answerButtonClass(active: boolean, value: AnswerValue): string {
  if (!active) return "bg-paper text-stone ring-1 ring-ash hover:bg-linen";
  if (value === true) return "bg-lime-canopy text-ink";
  if (value === false) return "bg-ink text-paper";
  return "bg-stone text-paper";
}

export default function GapReadinessCheck({
  affiliateRecommendations,
}: {
  affiliateRecommendations?: ReactNode;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "unavailable">("idle");
  const [restoredNotice, setRestoredNotice] = useState(false);

  const hasStartedRef = useRef(false);
  const lastTrackedBucketRef = useRef<string | null>(null);

  // View event — fires once on mount.
  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  // Restore previously saved answers (if any) on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setAnswers(parsed);
        setRestoredNotice(true);
      }
    } catch {
      // localStorage unavailable or data corrupted — start fresh, never throw
    }
  }, []);

  const result = useMemo(() => scoreGapReadiness(answers), [answers]);
  const answeredCount = Object.keys(answers).length;

  // Result event — fires when the computed bucket changes, only after the
  // user has answered at least one item (avoid firing on the initial,
  // all-unanswered "ยังขาดข้อมูลสำคัญ" default state).
  useEffect(() => {
    if (answeredCount === 0) return;
    if (lastTrackedBucketRef.current === result.bucket) return;
    lastTrackedBucketRef.current = result.bucket;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: resultGroupFor(result.bucket),
    });
  }, [result.bucket, answeredCount]);

  function handleAnswer(itemId: string, value: AnswerValue) {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      track(TOOL_EVENTS.tool_start, { tool: TOOL_SLUG });
    }
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    setSaveStatus("idle");
  }

  function handleReset() {
    setAnswers({});
    setSaveStatus("idle");
    setRestoredNotice(false);
    lastTrackedBucketRef.current = null;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore — nothing to clean up if storage is unavailable
    }
    track(TOOL_EVENTS.tool_reset, { tool: TOOL_SLUG });
  }

  function handleSave() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unavailable");
    }
  }

  function handlePrint() {
    track(TOOL_EVENTS.tool_print, { tool: TOOL_SLUG });
    window.print();
  }

  const badgeStyle = BUCKET_BADGE_STYLE[result.bucket];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      {/* Checklist */}
      <div>
        {restoredNotice && (
          <div className="card no-print mb-6">
            <p className="text-sm text-stone">
              📂 กู้คืนคำตอบที่บันทึกไว้ก่อนหน้านี้แล้ว — ตอบต่อหรือแก้ไขได้ตามต้องการ
            </p>
          </div>
        )}

        {CHECKLIST.map((category) => (
          <div key={category.id} className="card mb-6">
            <div className="flex items-center gap-2">
              <span className="tag-chip text-xs">{category.label}</span>
              <span className="text-xs text-stone">
                ตอบแล้ว {category.items.filter((i) => i.id in answers).length}/{category.items.length}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {category.items.map((item) => {
                const current = answers[item.id];
                return (
                  <div key={item.id} className="rounded-xl bg-paper p-4">
                    <p className="text-[15px] text-ink/90">{item.question}</p>
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={item.question}>
                      {ANSWER_OPTIONS.map((opt) => {
                        const active = current === opt.value;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleAnswer(item.id, opt.value)}
                            aria-pressed={active}
                            className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors ${answerButtonClass(active, opt.value)}`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Live result */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card">
          <p className="eyebrow">ผลตรวจความพร้อมเบื้องต้น</p>
          <p className="mt-1 text-xs text-stone">
            ตอบแล้ว {answeredCount}/{ALL_ITEMS.length} ข้อ
          </p>

          <div
            className="mt-3 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold"
            style={badgeStyle}
          >
            {result.bucket}
          </div>

          <div className="mt-3">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-linen">
              <div
                className="h-full rounded-full bg-lime-canopy"
                style={{ width: `${result.overallPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-stone">
              ผ่าน {result.totalPassed}/{result.totalItems} ข้อ ({result.overallPercent}%)
            </p>
          </div>

          <p className="mt-4 rounded-xl bg-linen p-3 text-xs text-ink/90">
            ⚠️ ผลนี้เป็นเพียงการประเมินตนเองเบื้องต้น ไม่ใช่การตรวจประเมินอย่างเป็นทางการ และไม่รับประกันว่าจะผ่านการรับรองมาตรฐาน
            GAP ข้อกำหนดจริงอาจเปลี่ยนแปลงได้ โปรดตรวจสอบข้อมูลล่าสุดจากหน่วยงานที่เกี่ยวข้องด้วยตนเอง
          </p>

          <div className="no-print mt-4 flex flex-col gap-2">
            <button type="button" onClick={handleSave} className="btn-secondary w-full">
              💾 บันทึกไว้ในเบราว์เซอร์
            </button>
            {saveStatus === "saved" && (
              <p className="text-center text-xs text-stone">บันทึกคำตอบไว้ในเบราว์เซอร์นี้แล้ว</p>
            )}
            {saveStatus === "unavailable" && (
              <p className="text-center text-xs text-stone">อุปกรณ์นี้ไม่รองรับการบันทึกในเบราว์เซอร์</p>
            )}
            <button type="button" onClick={handlePrint} className="btn-secondary w-full">
              🖨️ พิมพ์ / บันทึก PDF
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary w-full">
              ล้างคำตอบทั้งหมด
            </button>
          </div>
        </div>

        {/* Per-category scores */}
        <div className="card mt-6">
          <p className="eyebrow">คะแนนรายหมวด</p>
          <div className="mt-4 space-y-3">
            {result.categoryScores.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{c.label}</span>
                  <span className="text-stone">
                    {c.passed}/{c.total}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-linen">
                  <div
                    className="h-full rounded-full bg-lime-canopy"
                    style={{ width: `${c.total > 0 ? Math.round((c.passed / c.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items to fix */}
        {result.itemsToFix.length > 0 && (
          <div className="card mt-6">
            <p className="eyebrow">รายการที่ต้องปรับปรุง</p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
              {result.itemsToFix.map((it) => (
                <li key={it.id} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-stone">
                    •
                  </span>
                  <span className="text-ink/90">
                    {it.question}
                    {it.status === "unsure" && <span className="text-stone"> (ไม่แน่ใจ)</span>}
                    {it.status === "unanswered" && <span className="text-stone"> (ยังไม่ตอบ)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents to prepare */}
        {result.documentsToPrepare.length > 0 && (
          <div className="card mt-6">
            <p className="eyebrow">เอกสารที่ควรเตรียม</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/90">
              {result.documentsToPrepare.map((doc) => (
                <li key={doc} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-stone">
                    •
                  </span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Official agencies */}
        <div className="card mt-6">
          <p className="eyebrow">ควรตรวจสอบข้อมูลล่าสุดจากหน่วยงาน</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/90">
            {result.officialAgencies.map((agency) => (
              <li key={agency} className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-stone">
                  •
                </span>
                <span>{agency}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone">
            รายชื่อหน่วยงานข้างต้นเป็นข้อมูลทั่วไปเท่านั้น กรุณาตรวจสอบข้อกำหนด ขั้นตอน และช่องทางติดต่อล่าสุดจากหน่วยงานโดยตรง
          </p>
        </div>
      </aside>

      {answeredCount > 0 && affiliateRecommendations && (
        <div className="lg:col-span-2">{affiliateRecommendations}</div>
      )}
    </div>
  );
}
