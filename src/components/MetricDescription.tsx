import type { MetricMeta } from '@/content/metrics';

interface MetricDescriptionProps {
  metric: MetricMeta;
}

export default function MetricDescription({ metric }: MetricDescriptionProps) {
  return (
    <section
      aria-label="Descrição da métrica"
      className="mt-6 rounded border border-neutral-300 bg-white px-5 py-4"
    >
      <h2 className="font-semibold text-einstein text-lg">{metric.title}</h2>
      <p className="mt-2 text-neutral-700 text-sm leading-relaxed">
        {metric.summary}
      </p>
      <p className="mt-3 text-neutral-500 text-sm leading-relaxed">
        {metric.detail}
      </p>
    </section>
  );
}
