
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type Tone = "ok" | "warn" | "bad";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, tone, highlight }) => {
  const toneClasses = {
    ok: 'border-emerald-400',
    warn: 'border-amber-400',
    bad: 'border-rose-500'
  } satisfies Record<Tone, string>;

  const borderClass = highlight
    ? 'border-brand'
    : (tone ? toneClasses[tone] : 'border-border');

  return (
    <Card className={`border-t-4 bg-card/80 shadow-sm backdrop-blur ${borderClass}`}>
      <CardContent className="space-y-1 px-6 py-5">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  );
};