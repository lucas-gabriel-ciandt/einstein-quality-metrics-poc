export type MetricKey = 'dre' | 'cfr' | 'mttr' | 'false-alarm';

export interface MetricMeta {
  key: MetricKey;
  label: string;
  title: string;
  /** Human-readable, business-facing summary: what the metric is and which
   *  direction is good. Rendered as the first paragraph. */
  summary: string;
  /** Technical notes: how it is computed and how edge cases are handled.
   *  Rendered as a second paragraph, below the summary. */
  detail: string;
  accent: string;
}

export const METRICS: MetricMeta[] = [
  {
    key: 'dre',
    label: 'DRE',
    title: 'DRE — Eficiência de Remoção de Defeitos',
    summary:
      'Relação de defeitos (incidentes e bugs) capturados antes do deploy em comparação com o total. A métrica não é cumulativa: cada deploy tem sua porcentagem independente, e quanto mais alta, melhor.',
    detail:
      'Bugs registrados nos momentos 0 a 5 contam como pré-produção; Incidentes e bugs de momento 6 contam como pós-produção. DRE = pré / (pré + pós), calculada por deploy.',
    accent: 'var(--color-metric-dre)',
  },
  {
    key: 'cfr',
    label: 'CFR',
    title: 'CFR — Change Failure Rate',
    summary:
      'Métrica cumulativa: proporção de deploys que causaram incidentes ao longo do tempo observado. Quanto menor, melhor.',
    detail:
      'Cada ponto é CFR(k) = deploys com incidente entre 1 e k, dividido por k, acumulado desde o primeiro deploy registrado. A janela mais recente ainda está em aberto (right-censoring): pode acumular novos incidentes que só apareçam mais tarde.',
    accent: 'var(--color-metric-cfr)',
  },
  {
    key: 'mttr',
    label: 'MTTR',
    title: 'MTTR — Tempo Médio de Reparo',
    summary:
      'Quanto tempo o time demora para reagir a incidentes, separados por severidade. Crítico e Alto têm prioridade para subir e não devem esperar o próximo deploy; Médio e Baixo podem.',
    detail:
      'É a diferença, em dias, entre a data de fechamento e a de criação de cada Incidente, dividida nas faixas "Crítico e Alto" (Severidade 1-2) e "Médio e Baixo" (Severidade 3-4). Incidentes ainda abertos são preservados como "aberto há X dias".',
    accent: 'var(--color-metric-mttr)',
  },
  {
    key: 'false-alarm',
    label: 'False Alarm',
    title: 'False Alarm — Alarmes Falsos por Deploy',
    summary:
      'Número de falsos positivos que os testes automatizados trouxeram a cada deploy. A meta é que diminuam ao passar do tempo.',
    detail:
      'É um número informado à mão por deploy (não é extraído do board) e repassado sem transformação, apenas para dar contexto ao ruído operacional de cada janela.',
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
