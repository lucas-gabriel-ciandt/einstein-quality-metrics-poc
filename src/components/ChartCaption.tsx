import type { MetricMeta } from '@/content/metrics';
import { computeCfrSeries, computeMttrSeries } from '@/lib/metrics';
import type { Deploy, Incident } from '@/lib/types';

interface ChartCaptionProps {
  metric: MetricMeta;
  deploys: Deploy[];
  incidents: Incident[];
  asOf: string;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-300 bg-white px-4 py-3">
      <dt className="text-neutral-600 text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-lg text-neutral-900">{value}</dd>
    </div>
  );
}

function DreCaption({ deploys }: { deploys: Deploy[] }) {
  const values = deploys
    .map((deploy) => deploy.dre)
    .filter((dre): dre is number => dre !== null);
  const mean = average(values);
  return (
    <Tile
      label="DRE média"
      value={mean === null ? '—' : `${(mean * 100).toFixed(1)}%`}
    />
  );
}

function CfrCaption({ deploys }: { deploys: Deploy[] }) {
  const series = computeCfrSeries(deploys);
  const latest = series.at(-1);
  return (
    <>
      <Tile
        label="CFR acumulada"
        value={latest === undefined ? '—' : `${(latest.cfr * 100).toFixed(1)}%`}
      />
      <Tile
        label="Janela mais recente"
        value={latest?.partial ? 'parcial' : 'fechada'}
      />
    </>
  );
}

function MttrCaption({
  incidents,
  asOf,
}: {
  incidents: Incident[];
  asOf: string;
}) {
  const series = computeMttrSeries(incidents, asOf);
  const sev12 = average(series.sev12.map((point) => point.mttrDias));
  const sev34 = average(series.sev34.map((point) => point.mttrDias));
  return (
    <>
      <Tile
        label="Sev 1-2 (média)"
        value={sev12 === null ? '—' : `${sev12.toFixed(1)} d`}
      />
      <Tile
        label="Sev 3-4 (média)"
        value={sev34 === null ? '—' : `${sev34.toFixed(1)} d`}
      />
      <Tile
        label="Em aberto"
        value={`${series.open.length}`}
      />
    </>
  );
}

function FalseAlarmCaption({ deploys }: { deploys: Deploy[] }) {
  const total = deploys.reduce(
    (sum, deploy) => sum + (deploy.falseAlarms ?? 0),
    0,
  );
  return (
    <Tile
      label="Alarmes falsos (total)"
      value={`${total}`}
    />
  );
}

export default function ChartCaption({
  metric,
  deploys,
  incidents,
  asOf,
}: ChartCaptionProps) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metric.key === 'dre' && <DreCaption deploys={deploys} />}
      {metric.key === 'cfr' && <CfrCaption deploys={deploys} />}
      {metric.key === 'mttr' && (
        <MttrCaption
          asOf={asOf}
          incidents={incidents}
        />
      )}
      {metric.key === 'false-alarm' && <FalseAlarmCaption deploys={deploys} />}
    </dl>
  );
}
