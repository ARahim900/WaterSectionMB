
import { RawRow, FactRow, MonthMetrics, FactRowLevel, YM } from '../types';

export const MONTH_INDEX: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export function parseMMMYY(label: string): YM | null {
  const m = label.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const mon = MONTH_INDEX[m[1] as keyof typeof MONTH_INDEX];
  if (!mon) return null;
  const yy = parseInt(m[2], 10);
  const y = yy < 50 ? 2000 + yy : 1900 + yy;
  return { y, m: mon };
}

function toStringOrNull(v: unknown): string | null { if (v == null) return null; const s = String(v).trim(); return s || null; }
function toNumberOrNull(v: unknown): number | null { if (v == null) return null; const s = String(v).trim(); if (s === "") return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
function normalizeLevel(x: string | null): FactRowLevel { const v = (x||"").toUpperCase(); return (["L1","L2","L3","L4","DC"] as const).includes(v as any) ? v as any : "OTHER"; }

export function keyYM(y: number, m: number): string { return `${y}-${String(m).padStart(2,"0")}`; }
export function monthLabel(ym: YM): string { const m = Object.entries(MONTH_INDEX).find(([,v])=> v===ym.m)?.[0] || ym.m.toString(); return `${m} ${ym.y}`; }
export function fmtNum(n?: number|null, d=0): string { if (n==null || Number.isNaN(n)) return "—"; return n.toLocaleString(undefined,{maximumFractionDigits:d}); }
export function pct(n: number, d: number): number { return !d ? 0 : n/d; }
export function isNear(a: number, b: number, tol=0.05): boolean { const denom = Math.max(1, Math.abs(a)); return Math.abs(a-b)/denom <= tol; }

export function normalizeType(t: string | null): string {
  const s = (t||"").toLowerCase();
  if (s.includes("d_building_bulk")) return "D Building Bulk";
  if (s.includes("d_building_common")) return "D Building Common";
  if (s.includes("villa")) return "Residential (Villa)";
  if (s.includes("apart")) return "Residential (Apart)";
  if (s.includes("irr")) return "IRR Services";
  if (s.includes("zone bulk")) return "Zone Bulk";
  if (s.includes("mb_common")) return "MB Common";
  if (s.includes("main bulk")) return "Main BULK";
  if (s.includes("retail")) return "Retail";
  return (t||"Other");
}

export function unpivotRows(raw: RawRow[]): FactRow[] {
  if (!raw.length) return [];
  const headers = Object.keys(raw[0]||{});
  const monthHeaders = headers.filter(h => parseMMMYY(h));
  const out: FactRow[] = [];
  for (const r of raw) {
    const base = {
      meter_label: toStringOrNull(r["Meter Label"]) || "(unknown)",
      account_no: toStringOrNull(r["Acct #"]) || null,
      level: normalizeLevel(toStringOrNull(r["Label"])),
      zone: toStringOrNull(r["Zone"]) || null,
      parent_meter: toStringOrNull(r["Parent Meter"]) || null,
      type: toStringOrNull(r["Type"]) || null,
    };
    for (const mh of monthHeaders) {
      const ym = parseMMMYY(mh)!;
      const qty_m3 = toNumberOrNull(r[mh]);
      out.push({ ...base, y: ym.y, m: ym.m, qty_m3 });
    }
  }
  return out;
}

function sumFacts(facts: FactRow[], pred: (f: FactRow) => boolean): number {
  let s = 0; for (const f of facts) if (pred(f)) if (f.qty_m3!=null) s += f.qty_m3; return s;
}

export function groupBy<T, K extends string | number>(arr: T[], keyFn: (t: T)=>K): Record<K,T[]> { 
  return arr.reduce((acc: Record<K, T[]>, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}


export function calculateMetricsByMonth(facts: FactRow[]): Record<string, MonthMetrics> {
  const out: Record<string, MonthMetrics> = {};
  const byMonth = groupBy(facts, f=>keyYM(f.y,f.m));
  for (const k of Object.keys(byMonth)) {
    const [y,m] = k.split('-').map(Number);
    const rows = byMonth[k as keyof typeof byMonth];
    const a1 = sumFacts(rows, r=> r.level==="L1");
    const dc = sumFacts(rows, r=> r.level==="DC");
    const l2 = sumFacts(rows, r=> r.level==="L2");
    const l3_all = sumFacts(rows, r=> r.level==="L3");
    const l3_villas = sumFacts(rows, r=> r.level==="L3" && (r.type||"").toLowerCase().includes("villa"));
    const l3_buildings = sumFacts(rows, r=> r.level==="L3" && (((r.type||"") === "D_Building_Bulk") || (r.meter_label||"").toLowerCase().includes("building bulk meter")));
    const l4 = sumFacts(rows, r=> r.level==="L4");
    const a2 = l2 + dc;
    const a3_bulk = l3_all + dc;
    const a3_individual = l3_villas + l4 + dc;
    const s1 = a1 - a2;
    const s2 = a2 - a3_individual;
    const s3 = l3_buildings - l4;
    out[k] = { y, m, a1, dc, l2, l3_all, l3_villas, l3_buildings, l4, a2, a3_bulk, a3_individual, s1, s2, s3 };
  }
  return out;
}
