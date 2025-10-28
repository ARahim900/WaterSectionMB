
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { fmtNum } from '../utils/dataUtils';

interface RingGaugeProps {
  title: string;
  value: number;
  color: string;
}

export const RingGauge: React.FC<RingGaugeProps> = ({ title, value, color }) => {
  // Add a tiny value for the background to ensure the full circle is drawn
  const data = [ { name: title, value }, { name: "bg", value: value > 0 ? 0.0001 : 1 } ];

  return (
    <Card className="h-[220px]">
      <CardHeader className="pb-1 pt-5">
        <CardTitle className="text-sm text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[170px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              innerRadius="70%" 
              outerRadius="90%" 
              startAngle={90} 
              endAngle={-270} 
              paddingAngle={0}
              cornerRadius={10}
            >
              <Cell key="value-cell" fill={color} />
              <Cell key="bg-cell" fill="#eef2f7" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">{fmtNum(value, 0)}</div>
          <div className="text-xs text-gray-500">m³</div>
        </div>
      </CardContent>
    </Card>
  );
};
