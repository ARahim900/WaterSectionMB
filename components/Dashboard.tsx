import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush
} from "recharts";
import { FileSpreadsheet, Share2, Sparkles, UploadCloud } from "lucide-react";
import { RawRow, FactRow, MonthMetrics, YM } from '../types';
import { 
  unpivotRows, calculateMetricsByMonth, groupBy, normalizeType, 
  keyYM, fmtNum, pct, isNear, monthLabel 
} from '../utils/dataUtils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeroSection } from "@/components/ui/hero-section";
import { Icons } from "@/components/ui/icons";
import { KpiCard } from "./KpiCard";
import { RingGauge } from "./RingGauge";
import { MonthPicker } from "./MonthPicker";
import Stats05 from './ui/stats-cards-with-links';
// FIX: Corrected import of Stats07 from demo component.
import Stats07 from './ui/demo';


// A more modern color palette for charts
const CHART_COLORS = {
  A1: '#3b82f6', // blue-500
  A2: '#22c55e', // green-500
  A3: '#f97316', // orange-500
  S1: '#ef4444', // red-500
  S2: '#eab308', // yellow-500
  S3: '#84cc16', // lime-500
};

// Custom Tooltip Component for a modern look
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-md transition-all duration-300">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.stroke || pld.fill }} className="text-sm flex justify-between items-center gap-4">
            <span>{pld.name}:</span>
            <span className="font-bold">{fmtNum(pld.value, 0)} m³</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};


const Dashboard: React.FC = () => {
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [facts, setFacts] = useState<FactRow[]>([]);
  const [allMonths, setAllMonths] = useState<YM[]>([]);
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(0);
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  
  // State for interactive chart legends
  const [hiddenSeriesA, setHiddenSeriesA] = useState<Set<string>>(new Set());
  const [hiddenSeriesLoss, setHiddenSeriesLoss] = useState<Set<string>>(new Set());

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    Papa.parse<RawRow>(f, { header: true, skipEmptyLines: true, dynamicTyping: false, complete: (res)=>{
      setRawRows(res.data as RawRow[]);
    }});
  }, []);

  useEffect(()=>{
    if (!rawRows.length) { 
      setFacts([]); setAllMonths([]); setStartIdx(0); setEndIdx(0); 
      return; 
    }
    const fx = unpivotRows(rawRows);
    setFacts(fx);
    const ym = Object.keys(groupBy(fx, r=>keyYM(r.y,r.m)))
      .map(k=>{const [y,m]=k.split('-').map(Number); return {y,m} as YM;})
      .sort((a,b)=> a.y === b.y ? a.m - b.m : a.y - b.y);
    setAllMonths(ym);
    if (ym.length) { setStartIdx(0); setEndIdx(ym.length-1); }
  },[rawRows]);

  const metricsByYM = useMemo(() => calculateMetricsByMonth(facts), [facts]);

  const rangeMonths = useMemo(()=> allMonths.slice(startIdx, endIdx+1), [allMonths, startIdx, endIdx]);
  const inRangeKeys = useMemo(() => new Set(rangeMonths.map(({y,m})=> keyYM(y,m))), [rangeMonths]);

  const agg = useMemo(()=>{
    const mm = Array.from(inRangeKeys).map(k=> metricsByYM[k]).filter(Boolean) as MonthMetrics[];
    if (mm.length === 0) return { a1: 0, a2: 0, a3: 0, a3_bulk: 0, s1: 0, s2: 0, s3: 0, efficiency: 0, totalLoss: 0, dc: 0 };
    
    const sum = (fn: (x:MonthMetrics)=>number) => mm.reduce((s,x)=> s+fn(x), 0);
    const a1 = sum(x=>x.a1); const a2 = sum(x=>x.a2); const a3 = sum(x=>x.a3_individual); const a3_bulk=sum(x=>x.a3_bulk);
    const s1 = sum(x=>x.s1); const s2 = sum(x=>x.s2); const s3 = sum(x=>x.s3);
    const dc = sum(x=>x.dc);
    const efficiency = pct(a3, a1);
    return { a1, a2, a3, a3_bulk, s1, s2, s3, dc, efficiency, totalLoss: a1 - a3 };
  },[metricsByYM, inRangeKeys]);

  const seriesA = useMemo(()=> rangeMonths.map(({y,m})=>{
    const k = keyYM(y,m); const mm = metricsByYM[k];
    return { name: `${y}-${String(m).padStart(2,"0")}`, A1: mm?.a1||0, A2: mm?.a2||0, A3: mm?.a3_individual||0 };
  }),[rangeMonths, metricsByYM]);

  const seriesLoss = useMemo(()=> rangeMonths.map(({y,m})=>{
    const k = keyYM(y,m); const mm = metricsByYM[k];
    const s1 = mm?.s1 || 0;
    const s2 = mm?.s2 || 0;
    const s3 = mm?.s3 || 0;
    return { name: `${y}-${String(m).padStart(2,"0")}`, Total: s1+s2+s3, Stage1: s1, Stage2: s2, Stage3: s3 };
  }),[rangeMonths, metricsByYM]);

  const zones = useMemo(()=>{
    const z = new Set<string>();
    for (const f of facts) if (inRangeKeys.has(keyYM(f.y,f.m)) && f.level==="L2" && f.zone) z.add(f.zone);
    return Array.from(z).sort();
  },[facts, inRangeKeys]);

  const [zoneSel, setZoneSel] = useState<string>("");
  useEffect(()=>{ if (zones.length && !zones.includes(zoneSel)) setZoneSel(zones[0]); },[zones, zoneSel]);

  const { zoneMetrics, zoneTrend, zoneMeters } = useMemo(() => {
    const sumRangeFacts = (rows: FactRow[], pred: (r: FactRow) => boolean) => rows.reduce((s, r) => s + (pred(r) && r.qty_m3 ? r.qty_m3 : 0), 0);
    
    const zoneRows = facts.filter(f=> inRangeKeys.has(keyYM(f.y,f.m)) && f.zone === zoneSel);
    const l2 = sumRangeFacts(zoneRows, r => r.level === "L2");
    const l3l4 = sumRangeFacts(zoneRows, r => r.level === "L3" || r.level === "L4");
    const zMetrics = { l2, l3l4, loss: l2 - l3l4 };

    const zTrend = rangeMonths.map(({y,m}) => {
      const monthRows = facts.filter(f => f.y === y && f.m === m && f.zone === zoneSel);
      const monthL2 = sumRangeFacts(monthRows, r => r.level === "L2");
      const monthL3L4 = sumRangeFacts(monthRows, r => r.level === "L3" || r.level === "L4");
      return { name: `${y}-${String(m).padStart(2,"0")}`, Individual: monthL3L4, Loss: monthL2 - monthL3L4, ZoneBulk: monthL2 };
    });

    const meterRows = facts.filter(f => inRangeKeys.has(keyYM(f.y,f.m)) && f.zone === zoneSel && (f.level === "L3" || f.level === "L4"));
    const byMeter = groupBy(meterRows, (r: FactRow) => r.meter_label);
    const zMeters = Object.keys(byMeter).map(label => {
      const items = byMeter[label];
      const total = items.reduce((s, x) => s + (x.qty_m3 || 0), 0);
      const acc = items[0]?.account_no || "";
      const type = normalizeType(items[0]?.type || "");
      const status = total > 0 ? "Active" : "Zero/Missing";
      const monthVals: Record<string, number> = {};
      for (const ym of rangeMonths) {
        const k = keyYM(ym.y, ym.m);
        monthVals[k] = items.filter(x => keyYM(x.y, x.m) === k).reduce((s, x) => s + (x.qty_m3 || 0), 0);
      }
      return { label, acc, type, total, status, monthVals };
    }).sort((a, b) => b.total - a.total);

    return { zoneMetrics: zMetrics, zoneTrend: zTrend, zoneMeters: zMeters };
  }, [facts, inRangeKeys, zoneSel, rangeMonths]);

  const [meterQuery, setMeterQuery] = useState("");
  const filteredZoneMeters = useMemo(() => zoneMeters.filter(r => 
    r.label.toLowerCase().includes(meterQuery.toLowerCase()) || (r.acc || "").includes(meterQuery)), [zoneMeters, meterQuery]);

  const typeAgg = useMemo(()=>{
    const byType: Record<string, number> = {};
    for (const r of facts) {
      if (!inRangeKeys.has(keyYM(r.y,r.m))) continue;
      const k = normalizeType(r.type);
      if (r.qty_m3!=null) byType[k] = (byType[k]||0) + r.qty_m3;
    }
    return Object.entries(byType).map(([type,val])=> ({ type, val })).sort((a,b)=> b.val-a.val);
  },[facts, inRangeKeys]);

  const typeChips = ["Residential (Villa)","Residential (Apart)","D Building Common","D Building Bulk","Retail","IRR Services","Zone Bulk","MB Common","Main BULK","Other"];
  const [typeSel, setTypeSel] = useState<string[]>([]);
  const typeChartData = useMemo(()=> typeAgg.filter(x=> typeSel.length ? typeSel.includes(x.type) : true), [typeAgg, typeSel]);
  
  const rateTone = (p: number) => p <= 0.10 ? "ok" : p <= 0.20 ? "warn" : "bad";
  
  const handleLegendClick = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, dataKey: string) => {
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  const renderLegendText = (value: string, entry: any, hiddenSet: Set<string>) => {
    const { color } = entry;
    const isHidden = hiddenSet.has(entry.dataKey);
    return <span style={{ color: isHidden ? '#ccc' : color }}>{value}</span>;
  };

  if (facts.length === 0) {
    return (
      <div className="space-y-12 pb-16">
        <HeroSection
          badge={{
            text: "Smart distribution insights",
            action: {
              text: "View sample report",
              href: "https://water.example.com/report",
            },
          }}
          title="Upload your network data and unlock instant analytics"
          description="Bring in your monthly consumption records and uncover hidden losses, efficiency trends, and actionable KPIs in a single dashboard."
          actions={[
            {
              text: "Upload CSV",
              href: "#upload",
              variant: "glow",
              icon: <UploadCloud className="h-5 w-5" />,
              onClick: (event) => {
                event.preventDefault();
                fileRef.current?.click();
              },
            },
            {
              text: "Read upload guide",
              href: "#upload-guide",
              icon: <Icons.gitHub className="h-5 w-5" />,
            },
          ]}
          image={{
            light:
              "https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&w=1248&q=80",
            dark:
              "https://images.unsplash.com/photo-1503424886308-418b744a73a3?auto=format&fit=crop&w=1248&q=80",
            alt: "Water network analytics dashboard preview",
          }}
        />

        <div id="upload" className="mx-auto w-full max-w-4xl -mt-24">
          <Card className="relative overflow-hidden border-dashed border-2 border-border bg-card/70 shadow-xl backdrop-blur">
            <CardHeader className="gap-2 text-center">
              <Badge variant="outline" className="mx-auto">Step 1</Badge>
              <CardTitle className="text-2xl">Upload your CSV data</CardTitle>
              <CardDescription>
                Drop in a CSV export that includes meter labels, account numbers, consumption per month, and any available zone metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 text-center">
              <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-muted-foreground/40 bg-background/60 px-8 py-12">
                <UploadCloud className="h-12 w-12 text-brand" />
                <div>
                  <p className="text-lg font-semibold">Drag &amp; drop your CSV here</p>
                  <p className="text-sm text-muted-foreground">or click the button below to browse from your device</p>
                </div>
                <Button variant="glow" size="lg" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={onFile}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">Accepted format: UTF-8 CSV (max 10MB)</p>
              </div>

              <div className="grid w-full gap-4 text-left sm:grid-cols-3">
                {[
                  {
                    title: "Automatic parsing",
                    description: "We use PapaParse to validate headers and normalize meter data instantly.",
                    icon: <FileSpreadsheet className="h-5 w-5 text-brand" />,
                  },
                  {
                    title: "Smart defaults",
                    description: "Meter groupings, KPIs, and charts update immediately once data is loaded.",
                    icon: <Sparkles className="h-5 w-5 text-brand" />,
                  },
                  {
                    title: "Download-ready",
                    description: "Export KPI snapshots or share dynamic charts with your operations team.",
                    icon: <Share2 className="h-5 w-5 text-brand" />,
                  },
                ].map((feature) => (
                  <Card key={feature.title} className="h-full border border-border/60 bg-background/70 p-4 text-left shadow-none">
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <p className="font-semibold text-sm text-foreground">{feature.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter id="upload-guide" className="flex flex-col items-start gap-2 rounded-b-2xl bg-muted/40 p-6 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Template tips</span>
              <ul className="list-inside list-disc space-y-1">
                <li>Include columns for <strong>year</strong>, <strong>month</strong>, <strong>meter_label</strong>, <strong>qty_m3</strong>, and optional <strong>zone</strong>.</li>
                <li>Ensure numeric values use a dot (<code>.</code>) as decimal separator.</li>
                <li>Remove any subtotal rows so the parser focuses on raw meter readings.</li>
              </ul>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Water System Analysis</h1>
          <p className="text-sm text-gray-500">Monthly trends and KPI analysis</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={()=>fileRef.current?.click()}>Upload New CSV</Button>
              <Input ref={fileRef} type="file" accept=".csv" onChange={onFile} className="hidden" />
            </div>
            <div className="flex items-center gap-2 text-sm">
                <div className="relative">
                    <Button variant="outline" onClick={() => setIsStartPickerOpen(o => !o)}>
                        {allMonths[startIdx] ? monthLabel(allMonths[startIdx]) : "Select Start"}
                    </Button>
                    {isStartPickerOpen && allMonths.length > 0 && (
                        <MonthPicker
                            allMonths={allMonths}
                            selectedYm={allMonths[startIdx]}
                            maxMonth={allMonths[endIdx]}
                            onSelectMonth={(ym) => {
                                const newIdx = allMonths.findIndex(m => m.y === ym.y && m.m === ym.m);
                                if (newIdx !== -1) setStartIdx(newIdx);
                                setIsStartPickerOpen(false);
                            }}
                            onClose={() => setIsStartPickerOpen(false)}
                        />
                    )}
                </div>
                <span>to</span>
                <div className="relative">
                    <Button variant="outline" onClick={() => setIsEndPickerOpen(o => !o)}>
                        {allMonths[endIdx] ? monthLabel(allMonths[endIdx]) : "Select End"}
                    </Button>
                    {isEndPickerOpen && allMonths.length > 0 && (
                        <MonthPicker
                            allMonths={allMonths}
                            selectedYm={allMonths[endIdx]}
                            minMonth={allMonths[startIdx]}
                            onSelectMonth={(ym) => {
                                const newIdx = allMonths.findIndex(m => m.y === ym.y && m.m === ym.m);
                                if (newIdx !== -1) setEndIdx(newIdx);
                                setIsEndPickerOpen(false);
                            }}
                            onClose={() => setIsEndPickerOpen(false)}
                        />
                    )}
                </div>
                <Button variant="ghost" onClick={() => { setStartIdx(0); setEndIdx(Math.max(0, allMonths.length - 1)); }}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">Performance KPIs</TabsTrigger>
          <TabsTrigger value="zones">Zone Analysis</TabsTrigger>
          <TabsTrigger value="types">Consumption by Type</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <KpiCard title="A1 - Main Source" value={`${fmtNum(agg.a1)} m³`} subtitle="Total water input" highlight />
            <KpiCard title="A2 - Zone Distribution" value={`${fmtNum(agg.a2)} m³`} subtitle="L2 Zone Bulks + DC" highlight />
            <KpiCard title="A3 - Individual Use" value={`${fmtNum(agg.a3)} m³`} subtitle="L3 Villas + L4 + DC" highlight />
            <KpiCard title="System Efficiency" value={`${(agg.efficiency*100).toFixed(1)}%`} subtitle="Target: >85%" tone={agg.efficiency>=0.85?"ok":agg.efficiency>=0.75?"warn":"bad"} />
            <KpiCard title="Stage 1 Loss" value={`${fmtNum(agg.s1)} m³`} subtitle={`Rate: ${(pct(agg.s1, agg.a1)*100).toFixed(1)}%`} tone={rateTone(pct(agg.s1,agg.a1))} />
            <KpiCard title="Stage 2 Loss" value={`${fmtNum(agg.s2)} m³`} subtitle={`Rate: ${(pct(agg.s2, agg.a1)*100).toFixed(1)}%`} tone={rateTone(pct(agg.s2,agg.a1))} />
            <KpiCard title="Stage 3 Loss" value={`${fmtNum(agg.s3)} m³`} subtitle={`Rate: ${(pct(agg.s3, agg.a1)*100).toFixed(1)}%`} tone={rateTone(pct(agg.s3,agg.a1))} />
            <KpiCard title="Total System Loss" value={`${fmtNum(agg.totalLoss)} m³`} subtitle={`Rate: ${(pct(agg.totalLoss, agg.a1)*100).toFixed(1)}%`} tone={rateTone(pct(agg.totalLoss,agg.a1))} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="h-[400px]">
              <CardHeader><CardTitle className="text-sm">A-Values Distribution</CardTitle></CardHeader>
              <CardContent className="h-[320px] -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seriesA} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorA1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.A1} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.A1} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorA2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.A2} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.A2} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorA3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.A3} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.A3} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'red', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                    <Legend onClick={(e) => handleLegendClick(setHiddenSeriesA, e.dataKey)} formatter={(v, e) => renderLegendText(v, e, hiddenSeriesA)} />
                    
                    {!hiddenSeriesA.has('A1') && <Area type="monotone" dataKey="A1" stroke={CHART_COLORS.A1} strokeWidth={2} fillOpacity={1} fill="url(#colorA1)" />}
                    {!hiddenSeriesA.has('A2') && <Area type="monotone" dataKey="A2" stroke={CHART_COLORS.A2} strokeWidth={2} fillOpacity={1} fill="url(#colorA2)" />}
                    {!hiddenSeriesA.has('A3') && <Area type="monotone" dataKey="A3" stroke={CHART_COLORS.A3} strokeWidth={2} fillOpacity={1} fill="url(#colorA3)" />}
                    <Brush dataKey="name" height={25} stroke={CHART_COLORS.A1} travellerWidth={20} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="h-[400px]">
              <CardHeader><CardTitle className="text-sm">Water Loss Analysis (Stacked)</CardTitle></CardHeader>
              <CardContent className="h-[320px] -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seriesLoss} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorS1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.S1} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.S1} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorS2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.S2} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.S2} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorS3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.S3} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.S3} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={(e) => handleLegendClick(setHiddenSeriesLoss, e.dataKey)} formatter={(v, e) => renderLegendText(v, e, hiddenSeriesLoss)} />
                    {!hiddenSeriesLoss.has('Stage1') && <Area type="monotone" dataKey="Stage1" stackId="1" stroke={CHART_COLORS.S1} strokeWidth={2} fill="url(#colorS1)" />}
                    {!hiddenSeriesLoss.has('Stage2') && <Area type="monotone" dataKey="Stage2" stackId="1" stroke={CHART_COLORS.S2} strokeWidth={2} fill="url(#colorS2)" />}
                    {!hiddenSeriesLoss.has('Stage3') && <Area type="monotone" dataKey="Stage3" stackId="1" stroke={CHART_COLORS.S3} strokeWidth={2} fill="url(#colorS3)" />}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <Stats05 />
          <Stats07 />
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <select className="border rounded-md px-3 py-2 bg-white" value={zoneSel} onChange={(e)=> setZoneSel(e.target.value)}>
                      {zones.map(z=> (<option key={z} value={z}>{z}</option>))}
                    </select>
                </CardContent>
            </Card>
          
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RingGauge title="Zone Bulk Total" value={zoneMetrics.l2} color="#3b82f6" />
            <RingGauge title="Individual Meters Sum" value={zoneMetrics.l3l4} color="#22c55e" />
            <RingGauge title="Water Loss" value={zoneMetrics.loss} color="#ef4444" />
          </section>

          <Card className="h-[360px]">
            <CardHeader><CardTitle className="text-sm">Zone Consumption Trend</CardTitle></CardHeader>
            <CardContent className="h-[300px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={zoneTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="Individual" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="Loss" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                  <Line type="monotone" dataKey="ZoneBulk" stroke="#3b82f6" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Individual Meters – {zoneSel || "—"}</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Search meters or accounts..." value={meterQuery} onChange={(e)=> setMeterQuery(e.target.value)} className="max-w-sm mb-4" />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="text-gray-600 bg-gray-50">
                    <tr>
                      <th className="p-2">Meter Label</th><th className="p-2">Account #</th><th className="p-2">Type</th>
                      {rangeMonths.map((ym)=> (<th key={keyYM(ym.y,ym.m)} className="p-2 text-center">{monthLabel(ym).split(' ').join('\n')}</th>))}
                      <th className="p-2">Total</th><th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredZoneMeters.map(r=> (
                      <tr key={r.label} className="border-t hover:bg-gray-50">
                        <td className="p-2 font-medium text-blue-600">{r.label}</td>
                        <td className="p-2 text-gray-700">{r.acc}</td>
                        <td className="p-2"><Badge>{r.type}</Badge></td>
                        {rangeMonths.map((ym) => <td key={keyYM(ym.y, ym.m)} className="p-2 text-center">{fmtNum(r.monthVals[keyYM(ym.y, ym.m)])}</td>)}
                        <td className="p-2 font-semibold">{fmtNum(r.total)}</td>
                        <td className="p-2">{r.status === "Active" ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge className="bg-red-100 text-red-800">Zero/Missing</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-2">
              {typeChips.map(t=> (
                <button key={t} onClick={()=> setTypeSel(s=> s.includes(t)? s.filter(x=>x!==t): [...s,t])} className={`px-3 py-1 text-sm rounded-full border transition-colors ${typeSel.includes(t)?"bg-gray-900 text-white border-gray-900":"bg-white hover:bg-gray-100"}`}>{t}</button>
              ))}
              {typeSel.length > 0 && <Button variant="ghost" onClick={()=> setTypeSel([])}>Clear</Button>}
            </CardContent>
          </Card>

          <Card className="min-h-[460px]">
            <CardHeader><CardTitle className="text-sm">Consumption by Type (m³)</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height={Math.max(400, typeChartData.length * 40)}>
                <BarChart data={typeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12}/>
                  <YAxis type="category" dataKey="type" width={150} fontSize={12} interval={0} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(238, 242, 247, 0.5)'}} />
                  <Bar dataKey="val" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
           <Card>
            <CardHeader><CardTitle className="text-sm">Full Meter Database</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="text-gray-600 bg-gray-50">
                     <tr>
                      <th className="p-2">Meter Label</th><th className="p-2">Account #</th><th className="p-2">Level</th>
                      <th className="p-2">Zone</th><th className="p-2">Parent Meter</th><th className="p-2">Type</th>
                      {rangeMonths.slice(-3).map(ym=> (<th key={keyYM(ym.y,ym.m)} className="p-2 text-center">{monthLabel(ym).split(' ').join('\n')}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupBy(facts.filter(f => inRangeKeys.has(keyYM(f.y, f.m))), (r: FactRow) => r.meter_label))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([label, rows]) => {
                        const latest = rows[rows.length - 1];
                        return (
                          <tr key={label} className="border-t hover:bg-gray-50">
                            <td className="p-2 font-medium text-blue-600">{label}</td>
                            <td className="p-2">{latest.account_no || '—'}</td>
                            <td className="p-2"><Badge variant="outline">{latest.level}</Badge></td>
                            <td className="p-2">{latest.zone || '—'}</td>
                            <td className="p-2">{latest.parent_meter || '—'}</td>
                            <td className="p-2">{normalizeType(latest.type)}</td>
                            {rangeMonths.slice(-3).map(ym => {
                                const val = rows.find(r => r.y === ym.y && r.m === ym.m)?.qty_m3;
                                return <td key={keyYM(ym.y, ym.m)} className="p-2 text-center">{fmtNum(val)}</td>;
                            })}
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default Dashboard;