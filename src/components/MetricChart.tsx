'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MetricMeta } from '@/content/metrics';
import {
  computeCfrSeries,
  computeFalseAlarmSeries,
  computeMttrSeries,
} from '@/lib/metrics';
import type { Deploy, Incident } from '@/lib/types';

interface MetricChartProps {
  metric: MetricMeta;
  deploys: Deploy[];
  incidents: Incident[];
  asOf: string;
}

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

function DreChart({ deploys, accent }: { deploys: Deploy[]; accent: string }) {
  const data = deploys.map((deploy) => ({
    label: shortDate(deploy.data),
    dre: deploy.dre === null ? null : Math.round(deploy.dre * 1000) / 10,
  }));
  return (
    <ResponsiveContainer
      height="100%"
      width="100%"
    >
      <AreaChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-neutral-300)"
        />
        <XAxis dataKey="label" />
        <YAxis
          domain={[0, 100]}
          unit="%"
        />
        <Tooltip />
        <Area
          connectNulls
          dataKey="dre"
          fill={accent}
          fillOpacity={0.2}
          name="DRE (%)"
          stroke={accent}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CfrChart({ deploys, accent }: { deploys: Deploy[]; accent: string }) {
  const data = computeCfrSeries(deploys).map((point) => ({
    label: shortDate(point.data),
    cfr: Math.round(point.cfr * 1000) / 10,
  }));
  return (
    <ResponsiveContainer
      height="100%"
      width="100%"
    >
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-neutral-300)"
        />
        <XAxis dataKey="label" />
        <YAxis
          domain={[0, 100]}
          unit="%"
        />
        <Tooltip />
        <Line
          dataKey="cfr"
          dot
          name="CFR (%)"
          stroke={accent}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MttrChart({
  incidents,
  asOf,
  accent,
}: {
  incidents: Incident[];
  asOf: string;
  accent: string;
}) {
  const series = computeMttrSeries(incidents, asOf);
  // Both bands share one real x axis: the closure date. Indexing the two series
  // positionally instead would pair unrelated incidents and cut the shorter
  // band off partway across the chart.
  const data = [
    ...series.sev12.map((point) => ({ point, band: 'sev12' as const })),
    ...series.sev34.map((point) => ({ point, band: 'sev34' as const })),
  ]
    .sort((a, b) => a.point.closed.localeCompare(b.point.closed))
    .map(({ point, band }) => ({
      label: shortDate(point.closed),
      sev12: band === 'sev12' ? point.mttrDias : null,
      sev34: band === 'sev34' ? point.mttrDias : null,
    }));
  return (
    <ResponsiveContainer
      height="100%"
      width="100%"
    >
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-neutral-300)"
        />
        <XAxis
          dataKey="label"
          minTickGap={24}
        />
        <YAxis unit="d" />
        <Tooltip />
        <Legend />
        <Line
          connectNulls
          dataKey="sev12"
          name="Crítico e Alto"
          stroke="var(--color-severity-alta)"
          strokeWidth={2}
          type="monotone"
        />
        <Line
          connectNulls
          dataKey="sev34"
          name="Médio e Baixo"
          stroke="var(--color-severity-baixa)"
          strokeDasharray="4 2"
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function FalseAlarmChart({
  deploys,
  accent,
}: {
  deploys: Deploy[];
  accent: string;
}) {
  const data = computeFalseAlarmSeries(deploys).map((point) => ({
    label: shortDate(point.data),
    falseAlarms: point.falseAlarms ?? 0,
  }));
  return (
    <ResponsiveContainer
      height="100%"
      width="100%"
    >
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-neutral-300)"
        />
        <XAxis dataKey="label" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar
          dataKey="falseAlarms"
          fill={accent}
          name="Alarmes falsos"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function MetricChart({
  metric,
  deploys,
  incidents,
  asOf,
}: MetricChartProps) {
  return (
    <figure
      aria-label={`Gráfico da métrica ${metric.label}`}
      className="h-80 w-full"
      role="img"
    >
      {metric.key === 'dre' && (
        <DreChart
          accent={metric.accent}
          deploys={deploys}
        />
      )}
      {metric.key === 'cfr' && (
        <CfrChart
          accent={metric.accent}
          deploys={deploys}
        />
      )}
      {metric.key === 'mttr' && (
        <MttrChart
          accent={metric.accent}
          asOf={asOf}
          incidents={incidents}
        />
      )}
      {metric.key === 'false-alarm' && (
        <FalseAlarmChart
          accent={metric.accent}
          deploys={deploys}
        />
      )}
    </figure>
  );
}
