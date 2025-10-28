
import React from 'react';
import { Card, CardContent } from './ui/Card';

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
    ok: 'border-green-500',
    warn: 'border-yellow-500',
    bad: 'border-red-500'
  };
  
  const borderClass = highlight 
    ? 'border-blue-500' 
    : (tone ? toneClasses[tone] : 'border-gray-200');

  return (
    <Card className={`shadow-sm border-t-4 ${borderClass}`}>
      <CardContent className="pt-5 pb-5">
        <div className="text-sm text-gray-600">{title}</div>
        <div className="text-3xl font-semibold mt-1">{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
};