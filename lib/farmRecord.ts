// ─────────────────────────────────────────────────────────────
// สมุดบันทึกฟาร์ม (Farm Record) — storage-engine-agnostic CRUD + CSV logic.
// Everything below is pure (accepts/returns plain data) so it can be
// unit-tested without `window`. Only the *LocalStorage wrappers at the
// bottom touch `window.localStorage`, and only ever from client code
// (components/tools/FarmRecord.tsx), guarded with try/catch.
// ─────────────────────────────────────────────────────────────

export const FARM_RECORD_STORAGE_KEY = "kaset.farmRecord.v1";

export type FarmRecordEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  activity: string; // free text — what was done
  plot: string; // แปลง/บ่อ label
  subject: string; // พืช/สัตว์ label (crop or animal)
  expense?: number;
  income?: number;
  fertilizer?: string;
  feed?: string;
  watering?: string;
  productUsage?: string;
  yieldAmount?: string;
  salePrice?: number;
  buyer?: string;
  notes?: string;
};

// "ประเภท" for filtering is inferred, not stored explicitly:
//  - รายรับ    : income is set and > 0 (regardless of expense)
//  - รายจ่าย   : expense is set and > 0 and no income
//  - กิจกรรมทั่วไป : neither income nor expense set (or both 0/blank)
export type FarmRecordType = "income" | "expense" | "general";

export function entryType(e: FarmRecordEntry): FarmRecordType {
  const hasIncome = typeof e.income === "number" && e.income > 0;
  const hasExpense = typeof e.expense === "number" && e.expense > 0;
  if (hasIncome) return "income";
  if (hasExpense) return "expense";
  return "general";
}

function genId(): string {
  return `fr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Parse / serialize (plain JSON, defensive) ──────────────────

export function parseEntries(raw: string | null): FarmRecordEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is FarmRecordEntry =>
        e && typeof e === "object" && typeof e.id === "string" && typeof e.date === "string",
    );
  } catch {
    return [];
  }
}

export function serializeEntries(entries: FarmRecordEntry[]): string {
  return JSON.stringify(entries);
}

// ── CRUD (pure — operate on a plain array, return a new array) ─

export function addEntry(
  entries: FarmRecordEntry[],
  entry: Omit<FarmRecordEntry, "id"> & { id?: string },
): FarmRecordEntry[] {
  const newEntry: FarmRecordEntry = { ...entry, id: entry.id ?? genId() };
  return [...entries, newEntry];
}

export function updateEntry(
  entries: FarmRecordEntry[],
  id: string,
  patch: Partial<Omit<FarmRecordEntry, "id">>,
): FarmRecordEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch, id: e.id } : e));
}

export function deleteEntry(entries: FarmRecordEntry[], id: string): FarmRecordEntry[] {
  return entries.filter((e) => e.id !== id);
}

// ── Filter / summarize ─────────────────────────────────────────

export function filterEntries(
  entries: FarmRecordEntry[],
  opts: { from?: string; to?: string; type?: FarmRecordType | "all"; query?: string } = {},
): FarmRecordEntry[] {
  const { from, to, type, query } = opts;
  const q = query?.trim().toLowerCase();
  return entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (type && type !== "all" && entryType(e) !== type) return false;
    if (q) {
      const haystack = [e.activity, e.subject, e.notes, e.plot]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function summarize(entries: FarmRecordEntry[]): {
  totalIncome: number;
  totalExpense: number;
  profit: number;
} {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const e of entries) {
    if (typeof e.income === "number" && isFinite(e.income)) totalIncome += e.income;
    if (typeof e.expense === "number" && isFinite(e.expense)) totalExpense += e.expense;
  }
  return { totalIncome, totalExpense, profit: totalIncome - totalExpense };
}

// ── CSV (RFC 4180-ish: quote fields containing comma/quote/newline) ─

const CSV_COLUMNS: (keyof FarmRecordEntry)[] = [
  "id",
  "date",
  "activity",
  "plot",
  "subject",
  "expense",
  "income",
  "fertilizer",
  "feed",
  "watering",
  "productUsage",
  "yieldAmount",
  "salePrice",
  "buyer",
  "notes",
];

function csvEscape(value: unknown): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(entries: FarmRecordEntry[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = entries.map((e) => CSV_COLUMNS.map((col) => csvEscape(e[col])).join(","));
  return [header, ...rows].join("\r\n");
}

// Minimal RFC-4180 CSV line parser that handles quoted fields with embedded
// commas/newlines/escaped quotes ("").
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // last field/row (if the text didn't end with a newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

const NUMERIC_COLUMNS = new Set<keyof FarmRecordEntry>(["expense", "income", "salePrice"]);

export function fromCsv(csvText: string): FarmRecordEntry[] {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;
  return dataRows
    .filter((r) => r.some((cell) => cell !== ""))
    .map((r) => {
      const obj: Record<string, unknown> = {};
      header.forEach((col, idx) => {
        const key = col as keyof FarmRecordEntry;
        const raw = r[idx] ?? "";
        if (NUMERIC_COLUMNS.has(key)) {
          obj[col] = raw === "" ? undefined : Number(raw);
        } else {
          obj[col] = raw === "" ? undefined : raw;
        }
      });
      // id/date/activity/plot/subject are required strings — fall back to "" if missing
      obj.id = typeof obj.id === "string" && obj.id ? obj.id : genId();
      obj.date = typeof obj.date === "string" ? obj.date : "";
      obj.activity = typeof obj.activity === "string" ? obj.activity : "";
      obj.plot = typeof obj.plot === "string" ? obj.plot : "";
      obj.subject = typeof obj.subject === "string" ? obj.subject : "";
      return obj as FarmRecordEntry;
    });
}

// ── Browser-facing wrappers (client-only; never called from pure fns above) ─

export function loadFromLocalStorage(): { entries: FarmRecordEntry[]; error: string | null } {
  try {
    const raw = window.localStorage.getItem(FARM_RECORD_STORAGE_KEY);
    return { entries: parseEntries(raw), error: null };
  } catch {
    return { entries: [], error: "ไม่สามารถโหลดข้อมูลจากเบราว์เซอร์นี้ได้ (อาจเป็นโหมดส่วนตัวหรือพื้นที่จัดเก็บเต็ม)" };
  }
}

export function saveToLocalStorage(entries: FarmRecordEntry[]): { ok: boolean; error: string | null } {
  try {
    window.localStorage.setItem(FARM_RECORD_STORAGE_KEY, serializeEntries(entries));
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "ไม่สามารถบันทึกข้อมูลลงเบราว์เซอร์นี้ได้ (อาจเป็นโหมดส่วนตัวหรือพื้นที่จัดเก็บเต็ม)" };
  }
}

export function clearLocalStorage(): { ok: boolean; error: string | null } {
  try {
    window.localStorage.removeItem(FARM_RECORD_STORAGE_KEY);
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "ไม่สามารถลบข้อมูลในเบราว์เซอร์นี้ได้" };
  }
}
