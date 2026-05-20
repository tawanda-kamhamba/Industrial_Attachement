import { useId } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/Card';
import { ChartContainer } from '@/components/charts/ChartContainer';
import type { ChartDataPoint } from '@/types';

/** Modern donut style: pink, purples, teal, greenish-teal, olive (matches reference image) */
const DEFAULT_COLORS = [
  '#ec4899', // vibrant pink
  '#a855f7', // medium purple
  '#7c3aed', // darker purple
  '#14b8a6', // teal/blue
  '#0d9488', // greenish-teal
  '#65a30d', // olive green
  '#0c8ee6',
  '#f59e0b',
  '#f97316',
  '#84cc16',
];

interface PieChartCardProps {
  title?: string;
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
  noWrapper?: boolean;
  /** When true, renders as modern donut: separated slices, shadow, rounded, percent on slice */
  donutStyle?: boolean;
  /** When true, shows a styled region/list legend on the right (uses name + value from data) */
  showRegionList?: boolean;
}

function RegionList({
  data,
  nameKey,
  dataKey,
  colors,
  compact,
}: {
  data: ChartDataPoint[];
  nameKey: string;
  dataKey: string;
  colors: string[];
  compact?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + Number((d as Record<string, unknown>)[dataKey] ?? 0), 0);
  const items = data.map((d, index) => {
    const name = String((d as Record<string, unknown>)[nameKey] ?? '');
    const value = Number((d as Record<string, unknown>)[dataKey] ?? 0);
    const percent = total > 0 ? (value / total) * 100 : 0;
    return { name, value, percent, color: colors[index % colors.length] };
  });

  if (compact) {
    return (
      <div className="flex flex-col">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">By region</p>
        <div className="max-h-[180px] flex flex-col gap-0.5 overflow-y-auto pr-0.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-50"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{item.name}</span>
              <span className="shrink-0 text-xs text-slate-500">
                {item.value} <span className="text-slate-400">({item.percent.toFixed(0)}%)</span>
              </span>
            </div>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-2 border-t border-slate-100 pt-2">
            <p className="flex justify-between text-[10px] font-semibold text-slate-600">
              <span>Total</span>
              <span>{total}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">By region</p>
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
              <p className="mt-0.5 flex items-baseline gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">{item.value}</span>
                <span>students</span>
                <span className="text-slate-400">·</span>
                <span className="font-medium text-slate-600">{item.percent.toFixed(1)}%</span>
              </p>
            </div>
            <div className="flex h-8 w-1.5 shrink-0 flex-col justify-end overflow-hidden rounded-full bg-slate-100">
              <div
                className="w-full rounded-full transition-all group-hover:opacity-90"
                style={{ height: `${Math.max(8, item.percent)}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Total</span>
            <span>{total} students</span>
          </p>
        </div>
      )}
    </div>
  );
}

export function PieChartCard({
  title = '',
  data,
  dataKey = 'value',
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  height: _height = 280,
  noWrapper = false,
  donutStyle = true,
  showRegionList = true,
}: PieChartCardProps) {
  const filterId = `pie-shadow-${useId().replace(/:/g, '')}`;
  const total = data.reduce((sum, d) => sum + Number((d as Record<string, unknown>)[dataKey] ?? 0), 0);
  const showList = showRegionList && donutStyle && data.length > 0 && total > 0;

  const chart = (
    <ChartContainer tall={showList}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={donutStyle ? '55%' : 0}
          outerRadius="80%"
          paddingAngle={donutStyle ? 4 : 0}
          cornerRadius={donutStyle ? 8 : 0}
          stroke="none"
          label={
            donutStyle
              ? (props: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; index: number }) => {
                  const RADIAN = Math.PI / 180;
                  const r = (props.innerRadius + props.outerRadius) / 2;
                  const x = props.cx + r * Math.cos(-props.midAngle * RADIAN);
                  const y = props.cy + r * Math.sin(-props.midAngle * RADIAN);
                  const pct = (props.percent * 100).toFixed(0);
                  const isLarge = props.percent >= 0.24;
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={isLarge ? '#1e293b' : '#fff'}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={600}
                    >
                      {pct}%
                    </text>
                  );
                }
              : ({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={colors[index % colors.length]}
              filter={donutStyle ? `url(#${filterId})` : undefined}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={(name) => name}
        />
        {!donutStyle && <Legend />}
      </PieChart>
    </ResponsiveContainer>
    </ChartContainer>
  );

  const content = showList ? (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-4">
      <div className="min-w-0 flex-1">{chart}</div>
      <div className="min-w-0 w-full shrink-0 border-t border-slate-100 pt-4 lg:w-44 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0 xl:w-52">
        <RegionList data={data} nameKey={nameKey} dataKey={dataKey} colors={colors} compact />
      </div>
    </div>
  ) : (
    chart
  );

  if (noWrapper) return content;
  return (
    <Card>
      {title ? <h3 className="mb-4 text-sm font-semibold text-slate-800 font-display">{title}</h3> : null}
      {content}
    </Card>
  );
}
