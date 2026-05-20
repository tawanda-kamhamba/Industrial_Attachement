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
import { ChartContainer } from '@/components/charts/ChartContainer';
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
  height: _height = 280,
  noWrapper = false,
}: BarChartCardProps) {
  const chart = (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" interval={0} angle={-25} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" width={32} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          formatter={(value: number) => [value, 'Count']}
        />
        <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
    </ChartContainer>
  );

  if (noWrapper) return chart;
  return (
    <Card>
      {title ? <h3 className="mb-4 text-sm font-semibold text-slate-800 font-display">{title}</h3> : null}
      {chart}
    </Card>
  );
}
