'use client';

import { METRICS, type MetricKey } from '@/content/metrics';

interface MetricSelectProps {
  active: MetricKey;
  onSelect: (key: MetricKey) => void;
}

export default function MetricSelect({ active, onSelect }: MetricSelectProps) {
  return (
    <div
      aria-label="Métricas"
      className="flex flex-wrap gap-1 border-neutral-300 border-b"
      role="tablist"
    >
      {METRICS.map((metric) => {
        const selected = metric.key === active;
        return (
          <button
            aria-selected={selected}
            className={
              selected
                ? 'border-primary border-b-2 px-4 py-2 font-semibold text-primary'
                : 'border-transparent border-b-2 px-4 py-2 text-neutral-600 hover:text-neutral-900'
            }
            id={`tab-${metric.key}`}
            key={metric.key}
            onClick={() => onSelect(metric.key)}
            role="tab"
            type="button"
          >
            {metric.label}
          </button>
        );
      })}
    </div>
  );
}
