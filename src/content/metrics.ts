export type MetricKey = 'dre' | 'cfr' | 'mttr' | 'false-alarm';

export interface MetricMeta {
  key: MetricKey;
  label: string;
  title: string;
  description: string;
  accent: string;
}

export const METRICS: MetricMeta[] = [
  {
    key: 'dre',
    label: 'DRE',
    title: 'DRE — Eficiência de Remoção de Defeitos',
    description:
      'A DRE mede a fração dos defeitos de cada deploy que foi encontrada antes de chegar à produção. Bugs registrados nos momentos 0 a 5 contam como pré-produção; Incidentes e bugs de momento 6 contam como pós-produção. DRE = pré / (pré + pós): quanto mais perto de 100%, mais cedo o time capturou os problemas.',
    accent: 'var(--color-metric-dre)',
  },
  {
    key: 'cfr',
    label: 'CFR',
    title: 'CFR — Change Failure Rate',
    description:
      'A CFR acompanha, de forma acumulada desde o primeiro deploy registrado, a proporção de deploys que causaram algum incidente em produção. Cada ponto é CFR(k) = deploys com incidente entre 1 e k, dividido por k. A janela mais recente ainda está em aberto (right-censoring): pode acumular novos incidentes que só apareçam mais tarde.',
    accent: 'var(--color-metric-cfr)',
  },
  {
    key: 'mttr',
    label: 'MTTR',
    title: 'MTTR — Tempo Médio de Reparo',
    description:
      'O MTTR é a diferença entre a data de fechamento e a de criação de cada Incidente, em dias. A série é dividida em duas faixas de severidade — as mais críticas (1 e 2) e as menores (3 e 4) — porque elas têm expectativas de resposta diferentes. Incidentes ainda abertos são preservados como "aberto há X dias".',
    accent: 'var(--color-metric-mttr)',
  },
  {
    key: 'false-alarm',
    label: 'False Alarm',
    title: 'False Alarm — Alarmes Falsos por Deploy',
    description:
      'O False Alarm é a contagem manual de alarmes falsos associados a cada deploy: acionamentos que pareciam incidentes mas não eram problemas reais da entrega. É um número informado à mão por deploy e repassado sem transformação, apenas para dar contexto ao ruído operacional de cada janela.',
    accent: 'var(--color-metric-false-alarm)',
  },
];

export function metricByKey(key: MetricKey): MetricMeta {
  const meta = METRICS.find((metric) => metric.key === key);
  if (meta === undefined) {
    throw new Error(`Métrica desconhecida: ${key}`);
  }
  return meta;
}
