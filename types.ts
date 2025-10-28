
export type YM = { y: number; m: number };

export type RawRow = {
  [key: string]: string | number | null | undefined;
  "Meter Label"?: string;
  "Acct #"?: string;
  "Label"?: string;
  "Zone"?: string;
  "Parent Meter"?: string;
  "Type"?: string;
};

export type FactRowLevel = "L1" | "L2" | "L3" | "L4" | "DC" | "OTHER";

export type FactRow = {
  meter_label: string;
  account_no: string | null;
  level: FactRowLevel;
  zone: string | null;
  parent_meter: string | null;
  type: string | null;
  y: number;
  m: number;
  qty_m3: number | null;
};

export type MonthMetrics = YM & {
  a1: number;
  dc: number;
  l2: number;
  l3_all: number;
  l3_villas: number;
  l3_buildings: number;
  l4: number;
  a2: number;
  a3_bulk: number;
  a3_individual: number;
  s1: number;
  s2: number;
  s3: number;
};
