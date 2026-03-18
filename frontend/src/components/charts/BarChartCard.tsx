import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import type { ChartDataPoint } from '@/types';

interface BarChartCardProps {
  title?: string;
  data: ChartDataPoint[];
  dataKey?: string;
  barColor?: string;
  height?: number;
  noWrapper?: boolean;
}

export function BarChartCard({
  title = '',
  data,
  dataKey = 'value',
  barColor = '#0c8ee6',
  height = 280,
  noWrapper = false,
}: BarChartCardProps) {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
        <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          formatter={(value: number) => [value, 'Count']}
        />
        <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  if (noWrapper) return chart;
  return (
    <Card>
      {title ? <h3 className="mb-4 text-sm font-semibold text-slate-800 font-display">{title}</h3> : null}
      {chart}
    </Card>
  );
}
