"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import { baht } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  addEntry,
  clearLocalStorage,
  deleteEntry,
  entryType,
  filterEntries,
  fromCsv,
  loadFromLocalStorage,
  saveToLocalStorage,
  summarize,
  toCsv,
  updateEntry,
  type FarmRecordEntry,
  type FarmRecordType,
} from "@/lib/farmRecord";

type N = number | "";

const TOOL_SLUG = "farm-record";

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  activity: "",
  plot: "",
  subject: "",
  expense: "" as N,
  income: "" as N,
  fertilizer: "",
  feed: "",
  watering: "",
  productUsage: "",
  yieldAmount: "",
  salePrice: "" as N,
  buyer: "",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-full bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[48px] w-full rounded-full bg-transparent px-4 text-base text-ink focus:outline-none"
        />
      </div>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-1.5 rounded-2xl bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
        <textarea
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl bg-transparent px-4 py-3 text-base text-ink focus:outline-none"
        />
      </div>
    </label>
  );
}

const TYPE_LABEL: Record<FarmRecordType, string> = {
  income: "รายรับ",
  expense: "รายจ่าย",
  general: "กิจกรรมทั่วไป",
};

export default function FarmRecord() {
  const [entries, setEntries] = useState<FarmRecordEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<FarmRecordType | "all">("all");

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const hasAddedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Client-only load — avoids hydration mismatch by rendering a loading
  // state on both server and initial client render, then swapping once
  // localStorage has been read.
  useEffect(() => {
    const { entries: loaded, error } = loadFromLocalStorage();
    setEntries(loaded);
    setLoadError(error);
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  function persist(next: FarmRecordEntry[]) {
    setEntries(next);
    const { error } = saveToLocalStorage(next);
    setSaveError(error);
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entries) return;
    const payload = {
      date: form.date,
      activity: form.activity,
      plot: form.plot,
      subject: form.subject,
      expense: form.expense === "" ? undefined : Number(form.expense),
      income: form.income === "" ? undefined : Number(form.income),
      fertilizer: form.fertilizer || undefined,
      feed: form.feed || undefined,
      watering: form.watering || undefined,
      productUsage: form.productUsage || undefined,
      yieldAmount: form.yieldAmount || undefined,
      salePrice: form.salePrice === "" ? undefined : Number(form.salePrice),
      buyer: form.buyer || undefined,
      notes: form.notes || undefined,
    };

    let next: FarmRecordEntry[];
    if (editingId) {
      next = updateEntry(entries, editingId, payload);
    } else {
      if (!hasAddedRef.current) {
        hasAddedRef.current = true;
        track(TOOL_EVENTS.tool_start, { tool: TOOL_SLUG });
      }
      next = addEntry(entries, payload);
    }
    persist(next);
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    resetForm();
  }

  function handleEdit(entry: FarmRecordEntry) {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      activity: entry.activity,
      plot: entry.plot,
      subject: entry.subject,
      expense: entry.expense ?? "",
      income: entry.income ?? "",
      fertilizer: entry.fertilizer ?? "",
      feed: entry.feed ?? "",
      watering: entry.watering ?? "",
      productUsage: entry.productUsage ?? "",
      yieldAmount: entry.yieldAmount ?? "",
      salePrice: entry.salePrice ?? "",
      buyer: entry.buyer ?? "",
      notes: entry.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    if (!entries) return;
    persist(deleteEntry(entries, id));
    if (editingId === id) resetForm();
  }

  function handleDeleteAll() {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }
    const { error } = clearLocalStorage();
    setSaveError(error);
    setEntries([]);
    setConfirmDeleteAll(false);
    resetForm();
    track(TOOL_EVENTS.tool_reset, { tool: TOOL_SLUG });
  }

  function handleExport() {
    if (!entries) return;
    const csv = toCsv(entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farm-record-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    track(TOOL_EVENTS.tool_export, { tool: TOOL_SLUG });
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const imported = fromCsv(text);
        const base = entries ?? [];
        // Merge by id: entries with a matching id are overwritten by the
        // imported row, entries with a new id are appended — this avoids
        // silently wiping out existing data on a casual import.
        const byId = new Map(base.map((e) => [e.id, e]));
        for (const e of imported) byId.set(e.id, e);
        const next = Array.from(byId.values());
        persist(next);
        setImportMsg(`นำเข้าแล้ว ${imported.length} รายการ`);
      } catch {
        setImportMsg("ไม่สามารถอ่านไฟล์ CSV นี้ได้ กรุณาตรวจสอบรูปแบบไฟล์");
      }
    };
    reader.onerror = () => setImportMsg("ไม่สามารถอ่านไฟล์นี้ได้");
    reader.readAsText(file, "utf-8");
  }

  const filtered = useMemo(() => {
    if (!entries) return [];
    return filterEntries(entries, { from: from || undefined, to: to || undefined, type: typeFilter, query });
  }, [entries, from, to, typeFilter, query]);

  const summary = useMemo(() => summarize(filtered), [filtered]);

  if (entries === null) {
    return (
      <div className="card">
        <p className="text-stone">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="card no-print">
        <p className="text-sm font-medium text-ink">
          🔒 ข้อมูลจะถูกบันทึกไว้ในเบราว์เซอร์นี้เท่านั้น ไม่ได้ส่งขึ้นเซิร์ฟเวอร์
        </p>
        {loadError && <p className="mt-2 text-sm text-red-600">{loadError}</p>}
        {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <h2 className="font-display text-xl font-bold text-ink">
          {editingId ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
        </h2>

        <div className="mt-6">
          <p className="eyebrow">ข้อมูลพื้นฐาน</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="วันที่" type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} required />
            <TextField label="กิจกรรม" value={form.activity} onChange={(v) => setForm((f) => ({ ...f, activity: v }))} placeholder="เช่น ให้ปุ๋ย, เก็บเกี่ยว" required />
            <TextField label="แปลง/บ่อ" value={form.plot} onChange={(v) => setForm((f) => ({ ...f, plot: v }))} placeholder="เช่น แปลงที่ 1" />
            <TextField label="พืช/สัตว์" value={form.subject} onChange={(v) => setForm((f) => ({ ...f, subject: v }))} placeholder="เช่น ข้าวโพด, ไก่ไข่" />
          </div>
        </div>

        <div className="mt-6">
          <p className="eyebrow">รายรับ-รายจ่าย</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField label="รายจ่าย" value={form.expense} onChange={(v) => setForm((f) => ({ ...f, expense: v }))} suffix="บาท" step={10} />
            <NumberField label="รายรับ" value={form.income} onChange={(v) => setForm((f) => ({ ...f, income: v }))} suffix="บาท" step={10} />
            <NumberField label="ราคาขาย" value={form.salePrice} onChange={(v) => setForm((f) => ({ ...f, salePrice: v }))} suffix="บาท" step={1} />
            <TextField label="ผู้ซื้อ" value={form.buyer} onChange={(v) => setForm((f) => ({ ...f, buyer: v }))} placeholder="เช่น พ่อค้าคนกลาง" />
          </div>
        </div>

        <div className="mt-6">
          <p className="eyebrow">การดูแล</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="ปุ๋ย" value={form.fertilizer} onChange={(v) => setForm((f) => ({ ...f, fertilizer: v }))} placeholder="ชนิด/ปริมาณ" />
            <TextField label="อาหารสัตว์" value={form.feed} onChange={(v) => setForm((f) => ({ ...f, feed: v }))} placeholder="ชนิด/ปริมาณ" />
            <TextField label="การให้น้ำ" value={form.watering} onChange={(v) => setForm((f) => ({ ...f, watering: v }))} placeholder="เช่น รดน้ำ 2 ครั้ง/วัน" />
            <TextField label="การใช้ผลิตภัณฑ์" value={form.productUsage} onChange={(v) => setForm((f) => ({ ...f, productUsage: v }))} placeholder="ยา/สารเคมี/อื่น ๆ" />
            <TextField label="ผลผลิตที่ได้" value={form.yieldAmount} onChange={(v) => setForm((f) => ({ ...f, yieldAmount: v }))} placeholder="เช่น 500 กก." />
          </div>
        </div>

        <div className="mt-6">
          <p className="eyebrow">บันทึกเพิ่มเติม</p>
          <div className="mt-3">
            <TextAreaField label="หมายเหตุ" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="รายละเอียดเพิ่มเติม" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 no-print">
          <button type="submit" className="btn-primary">
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary">
              ยกเลิกการแก้ไข
            </button>
          )}
        </div>
      </form>

      {/* Summary */}
      <div className="card grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-stone">รายรับรวม (ตามตัวกรอง)</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{baht(summary.totalIncome)} บาท</p>
        </div>
        <div>
          <p className="text-sm text-stone">รายจ่ายรวม (ตามตัวกรอง)</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{baht(summary.totalExpense)} บาท</p>
        </div>
        <div>
          <p className="text-sm text-stone">กำไร/ขาดทุน</p>
          <p
            className="mt-1 font-display text-2xl font-bold"
            style={{ color: summary.profit >= 0 ? "#2d8c3a" : "#e44b4b" }}
          >
            {baht(summary.profit)} บาท
          </p>
        </div>
      </div>

      {/* Related content */}
      <div className="card">
        <p className="eyebrow">อ่านเพิ่มเติม</p>
        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          <Link
            href="/articles/cost-profit-farm-record-book-why-it-matters"
            className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
            onClick={() =>
              track(TOOL_EVENTS.related_article_click, {
                tool: TOOL_SLUG,
                target: "/articles/cost-profit-farm-record-book-why-it-matters",
              })
            }
          >
            อ่านเพิ่มเติม: สมุดบันทึกฟาร์มสำคัญอย่างไร
          </Link>
          <Link
            href="/articles/agri-news-law-standards-gap-certification-guide"
            className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
            onClick={() =>
              track(TOOL_EVENTS.related_article_click, {
                tool: TOOL_SLUG,
                target: "/articles/agri-news-law-standards-gap-certification-guide",
              })
            }
          >
            บันทึกฟาร์มช่วยตอนขอ GAP ได้อย่างไร
          </Link>
        </div>
      </div>

      {/* Search / filter / export / import / print / delete-all */}
      <div className="card no-print">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField label="ค้นหา" value={query} onChange={setQuery} placeholder="ค้นหากิจกรรม พืช/สัตว์ หมายเหตุ" />
          <TextField label="ตั้งแต่วันที่" type="date" value={from} onChange={setFrom} />
          <TextField label="ถึงวันที่" type="date" value={to} onChange={setTo} />
          <label className="block">
            <span className="text-sm font-semibold text-ink">ประเภท</span>
            <div className="mt-1.5 flex items-center rounded-full bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FarmRecordType | "all")}
                className="min-h-[48px] w-full rounded-full bg-transparent px-4 text-base text-ink focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
                <option value="general">กิจกรรมทั่วไป</option>
              </select>
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={handleExport} className="btn-secondary">
            ⬇️ ส่งออก CSV
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            ⬆️ นำเข้า CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => {
              window.print();
              track(TOOL_EVENTS.tool_print, { tool: TOOL_SLUG });
            }}
            className="btn-secondary"
          >
            🖨️ พิมพ์ / บันทึก PDF
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            className="btn-secondary ml-auto"
            style={confirmDeleteAll ? { borderColor: "#e44b4b", color: "#e44b4b" } : undefined}
          >
            {confirmDeleteAll ? "ยืนยันลบข้อมูลทั้งหมด?" : "🗑️ ลบข้อมูลทั้งหมด"}
          </button>
          {confirmDeleteAll && (
            <button type="button" onClick={() => setConfirmDeleteAll(false)} className="btn-secondary">
              ยกเลิก
            </button>
          )}
        </div>
        {importMsg && <p className="mt-3 text-sm text-stone">{importMsg}</p>}
      </div>

      {/* Entries list */}
      <div className="card">
        <h2 className="font-display text-xl font-bold text-ink">
          รายการทั้งหมด ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <p className="mt-4 text-stone">ยังไม่มีรายการที่ตรงกับตัวกรอง</p>
        ) : (
          <div className="cc-table-wrap mt-4">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ประเภท</th>
                  <th>กิจกรรม</th>
                  <th>แปลง/บ่อ</th>
                  <th>พืช/สัตว์</th>
                  <th>รายรับ</th>
                  <th>รายจ่าย</th>
                  <th className="no-print">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>
                      <span className="tag-chip">{TYPE_LABEL[entryType(e)]}</span>
                    </td>
                    <td>{e.activity}</td>
                    <td>{e.plot}</td>
                    <td>{e.subject}</td>
                    <td>{e.income ? `${baht(e.income)} บาท` : "-"}</td>
                    <td>{e.expense ? `${baht(e.expense)} บาท` : "-"}</td>
                    <td className="no-print">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(e)} className="btn-secondary min-h-0 px-3 py-1 text-sm">
                          แก้ไข
                        </button>
                        <button type="button" onClick={() => handleDelete(e.id)} className="btn-secondary min-h-0 px-3 py-1 text-sm">
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
