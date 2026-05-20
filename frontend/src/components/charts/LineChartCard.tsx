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
import { ChartContainer } from '@/components/charts/ChartContainer';
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
  height: _height = 280,
  noWrapper = false,
}: LineChartCardProps) {
  const chart = (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" width={32} />
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
