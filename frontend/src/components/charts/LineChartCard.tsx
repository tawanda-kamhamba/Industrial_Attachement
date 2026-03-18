import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import type { ChartDataPoint } from '@/types';

interface LineChartCardProps {
  title?: string;
  data: ChartDataPoint[];
  dataKey?: string;
  strokeColor?: string;
  height?: number;
  /** When true, render only the chart (no Card wrapper). For use inside a custom card. */
  noWrapper?: boolean;
}

export function LineChartCard({
  title = '',
  data,
  dataKey = 'value',
  strokeColor = '#0c8ee6',
  height = 280,
  noWrapper = false,
}: LineChartCardProps) {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
        <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          formatter={(value: number) => [value, 'Count']}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor}
          strokeWidth={2}
          dot={{ fill: strokeColor, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
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
