import type {
  Classification,
  Deploy,
  Finding,
  Incident,
  Severity,
} from '@/lib/types';

const MS_PER_DAY = 86_400_000;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

export function classifyFinding(finding: Finding): Classification {
  if (finding.type === 'Incident') {
    return { phase: 'post', flag: null };
  }
  if (finding.momento === null) {
    return { phase: 'pre', flag: 'dado-incompleto' };
  }
  if (finding.momento === 6) {
    return { phase: 'post', flag: 'furo-convencao' };
  }
  return { phase: 'pre', flag: null };
}

export function computeDre(findings: Finding[]): number {
  let pre = 0;
  let post = 0;
  for (const finding of findings) {
    if (classifyFinding(finding).phase === 'pre') {
      pre += 1;
    } else {
      post += 1;
    }
  }
  const total = pre + post;
  return total === 0 ? 0 : pre / total;
}

export interface CfrPoint {
  enablerId: string;
  data: string;
  cfr: number;
  partial: boolean;
}

export function computeCfrSeries(deploys: Deploy[]): CfrPoint[] {
  let failures = 0;
  return deploys.map((deploy, index) => {
    failures += deploy.causouIncidente === 1 ? 1 : 0;
    return {
      enablerId: deploy.enablerId,
      data: deploy.data,
      cfr: failures / (index + 1),
      partial: index === deploys.length - 1,
    };
  });
}

export interface MttrClosedPoint {
  id: string;
  severity: Severity;
  mttrDias: number;
  /** Closure date (YYYY-MM-DD): the real x position of the point. */
  closed: string;
}

export interface MttrOpenPoint {
  id: string;
  severity: Severity;
  openDias: number;
}

export interface MttrSeries {
  sev12: MttrClosedPoint[];
  sev34: MttrClosedPoint[];
  open: MttrOpenPoint[];
}

export function computeMttrSeries(
  incidents: Incident[],
  asOf: string,
): MttrSeries {
  const series: MttrSeries = { sev12: [], sev34: [], open: [] };
  for (const incident of incidents) {
    if (incident.closed === null) {
      series.open.push({
        id: incident.id,
        severity: incident.severity,
        openDias: daysBetween(incident.created, asOf),
      });
      continue;
    }
    const point: MttrClosedPoint = {
      id: incident.id,
      severity: incident.severity,
      mttrDias: daysBetween(incident.created, incident.closed),
      closed: incident.closed,
    };
    if (incident.severity <= 2) {
      series.sev12.push(point);
    } else {
      series.sev34.push(point);
    }
  }
  return series;
}

export interface FalseAlarmPoint {
  enablerId: string;
  data: string;
  falseAlarms: number | null;
}

export function computeFalseAlarmSeries(deploys: Deploy[]): FalseAlarmPoint[] {
  return deploys.map((deploy) => ({
    enablerId: deploy.enablerId,
    data: deploy.data,
    falseAlarms: deploy.falseAlarms,
  }));
}
