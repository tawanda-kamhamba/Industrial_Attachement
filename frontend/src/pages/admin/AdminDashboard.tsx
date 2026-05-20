import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { PieChartCard } from '@/components/charts/PieChartCard';
import type { AdminDashboardStats, ChartDataPoint } from '@/types';
import { api } from '@/services/api';

export interface AdminChartsData {
  registrationsByMonth: ChartDataPoint[];
  submissionsTrend: ChartDataPoint[];
  studentsByFaculty: ChartDataPoint[];
  studentsByRegion: ChartDataPoint[];
}

const defaultStats: AdminDashboardStats = {
  registeredStudents: 0,
  orientationChecklists: 0,
  elogbooksSubmitted: 0,
  contractsPending: 0,
  contractsApproved: 0,
  reportsSubmitted: 0,
  assumptionsCount: 0,
  visitingScoresCount: 0,
  companyScoresCount: 0,
};

function ChartCardWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card padding="none" className="overflow-hidden border border-slate-200 bg-white shadow-sm print-chart-card">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <h3 className="text-sm font-semibold text-slate-800 font-display">{title}</h3>
        <select
          className="no-print w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-auto"
          aria-label="Time range"
        >
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Yearly</option>
        </select>
      </div>
      <div className="min-w-0 overflow-hidden p-3 sm:p-5 print-chart-inner">{children}</div>
    </Card>
  );
}

const defaultCharts: AdminChartsData = {
  registrationsByMonth: [],
  submissionsTrend: [],
  studentsByFaculty: [],
  studentsByRegion: [],
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [charts, setCharts] = useState<AdminChartsData>(defaultCharts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<AdminDashboardStats>('/admin/stats'),
      api.get<AdminChartsData>('/admin/charts').catch(() => defaultCharts),
    ])
      .then(([statsData, chartsData]) => {
        if (cancelled) return;
        setStats(statsData);
        setCharts(chartsData);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const facultyChartData = charts.studentsByFaculty;
  const regionChartData = charts.studentsByRegion;
  const s = stats ?? defaultStats;

  if (loading) {
    return (
      <div className="page-stack min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-48 max-w-full rounded-lg bg-slate-200 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-9 w-20 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="stat-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-h-[7.5rem] rounded-2xl bg-white shadow-sm animate-pulse border border-slate-200" />
          ))}
        </div>
        <div className="chart-grid-2">
          <div className="h-80 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
          <div className="h-80 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Something went wrong</p>
          </div>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg text-amber-600" aria-hidden>
              !
            </span>
            <div>
              <h2 className="font-semibold text-amber-900">Could not load stats</h2>
              <p className="mt-1 text-sm text-amber-800">{error}</p>
              <p className="mt-2 text-xs text-amber-700">Check your connection and try refreshing the page.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleExport = () => {
    window.print();
  };

  const printDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div id="dashboard-export" className="dashboard-print-root page-stack min-w-0">
      {/* Print-only header: logo + Attachment Stats + date */}
      <div className="print-only border-b border-slate-200 pb-4" style={{ marginBottom: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/img/header_log.png" alt="" className="h-12 w-auto object-contain print-logo" />
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">Attachment Stats</h1>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Industrial attachment overview</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">{printDate}</p>
        </div>
      </div>

      {/* Title row — Dashboard + subtitle + Export / Filter (hidden when printing) */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s your overview of registrations, submissions and scores.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            title="Print or save as PDF"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Top row — 4 metric cards: 1 blue, 3 white with corner icon */}
      <section className="stat-grid-4">
        <StatCard
          title="Registered Students"
          value={s.registeredStudents}
          variant="primary"
          subtitle="Total in system"
          cornerIcon={false}
        />
        <StatCard
          title="Orientation Checklists"
          value={s.orientationChecklists}
          variant="light"
          subtitle="Submitted"
        />
        <StatCard
          title="E-Logbooks Submitted"
          value={s.elogbooksSubmitted}
          variant="light"
          subtitle="Weekly entries"
        />
        <StatCard
          title="Contracts Approved"
          value={s.contractsApproved}
          variant="light"
          subtitle={`${s.contractsPending} pending`}
        />
      </section>

      {/* Second row — Reports, Assumptions, Scores */}
      <section className="stat-grid-3">
        <StatCard
          title="Reports Submitted"
          value={s.reportsSubmitted}
          variant="light"
          subtitle="Final reports"
        />
        <StatCard
          title="Student Assumptions"
          value={s.assumptionsCount}
          variant="light"
          subtitle="Assumption of duty"
        />
        <StatCard
          title="Scores (Visiting / Company)"
          value={`${s.visitingScoresCount} / ${s.companyScoresCount}`}
          variant="light"
          subtitle="Assessment counts"
        />
      </section>

      {/* Chart cards — 2 large cards per row with header + dropdown */}
      <section className="chart-grid-2">
        <ChartCardWrapper title="Students by faculty">
          <BarChartCard data={facultyChartData} barColor="#0c8ee6" noWrapper />
        </ChartCardWrapper>
        <div className="dashboard-print-region">
          <ChartCardWrapper title="Students by region">
            <PieChartCard data={regionChartData} noWrapper />
          </ChartCardWrapper>
        </div>
      </section>

      <section className="chart-grid-2">
        <ChartCardWrapper title="Registrations by month">
          <LineChartCard
            data={charts.registrationsByMonth}
            noWrapper
          />
        </ChartCardWrapper>
        <ChartCardWrapper title="Submissions trend">
          <LineChartCard
            data={charts.submissionsTrend}
            strokeColor="#10b981"
            noWrapper
          />
        </ChartCardWrapper>
      </section>
    </div>
  );
}
