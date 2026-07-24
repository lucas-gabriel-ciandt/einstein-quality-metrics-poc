'use client';

import { useMemo, useState } from 'react';
import ChartCaption from '@/components/ChartCaption';
import MetricChart from '@/components/MetricChart';
import MetricDescription from '@/components/MetricDescription';
import MetricSelect from '@/components/MetricSelect';
import { type MetricKey, metricByKey } from '@/content/metrics';
import type { Deploy, Incident } from '@/lib/types';

interface DashboardProps {
  deploys: Deploy[];
  incidents: Incident[];
  asOf: string;
}

interface Period {
  value: string;
  label: string;
  deploys?: number;
  months?: number;
}

const PERIODS: Period[] = [
  { value: 'all', label: 'Todo o período' },
  { value: 'last-3', label: 'Últimos 3 deploys', deploys: 3 },
  { value: 'last-6', label: 'Últimos 6 deploys', deploys: 6 },
  { value: 'months-3', label: 'Últimos 3 meses', months: 3 },
  { value: 'months-6', label: 'Últimos 6 meses', months: 6 },
];

function periodByValue(value: string): Period {
  return PERIODS.find((period) => period.value === value) ?? PERIODS[0];
}

function statusText(period: Period): string {
  if (period.deploys !== undefined) {
    return `Mostrando os últimos ${period.deploys} deploys`;
  }
  if (period.months !== undefined) {
    return `Mostrando os últimos ${period.months} meses`;
  }
  return 'Mostrando todos os deploys';
}

function cutoff(asOf: string, months: number): number {
  const date = new Date(asOf);
  date.setMonth(date.getMonth() - months);
  return date.getTime();
}

export default function Dashboard({
  deploys,
  incidents,
  asOf,
}: DashboardProps) {
  const [active, setActive] = useState<MetricKey>('dre');
  const [periodValue, setPeriodValue] = useState('all');

  const period = periodByValue(periodValue);
  const metric = metricByKey(active);

  const visibleDeploys = useMemo(() => {
    if (period.deploys !== undefined) {
      return deploys.slice(-period.deploys);
    }
    if (period.months !== undefined) {
      const limit = cutoff(asOf, period.months);
      return deploys.filter((deploy) => Date.parse(deploy.data) >= limit);
    }
    return deploys;
  }, [deploys, period, asOf]);

  const visibleIncidents = useMemo(() => {
    if (period.value === 'all') {
      return incidents;
    }
    const first = visibleDeploys[0];
    if (first === undefined) {
      return [];
    }
    const start = Date.parse(first.data);
    return incidents.filter(
      (incident) => Date.parse(incident.created) >= start,
    );
  }, [incidents, visibleDeploys, period.value]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <MetricSelect
        active={active}
        onSelect={setActive}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-neutral-600 text-sm">
          <span>Período</span>
          <select
            aria-label="Período"
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-neutral-900"
            onChange={(event) => setPeriodValue(event.target.value)}
            value={periodValue}
          >
            {PERIODS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-neutral-600 text-sm">{statusText(period)}</p>
      </div>

      <div className="mt-4">
        <MetricChart
          asOf={asOf}
          deploys={visibleDeploys}
          incidents={visibleIncidents}
          metric={metric}
        />
        <ChartCaption
          asOf={asOf}
          deploys={visibleDeploys}
          incidents={visibleIncidents}
          metric={metric}
        />
      </div>

      <MetricDescription metric={metric} />
    </section>
  );
}
