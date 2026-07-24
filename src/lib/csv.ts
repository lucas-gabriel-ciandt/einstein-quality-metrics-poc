import { csvFormat, csvParse } from 'd3-dsv';
import type { Deploy, Incident, Severity } from '@/lib/types';

const DEPLOY_COLUMNS = [
  'enabler_id',
  'data',
  'titulo',
  'bugs_antes',
  'incidentes_pos',
  'dre',
  'causou_incidente',
  'false_alarms',
] as const;

const INCIDENT_COLUMNS = [
  'id',
  'titulo',
  'severity',
  'state',
  'created',
  'closed',
  'deploy_tag',
  'mttr_dias',
] as const;

function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined || value === '') {
    return null;
  }
  return Number(value);
}

function toTextOrNull(value: string | undefined): string | null {
  if (value === undefined || value === '') {
    return null;
  }
  return value;
}

export function parseDeploys(csv: string): Deploy[] {
  return csvParse(csv).map((row) => ({
    enablerId: row.enabler_id ?? '',
    data: row.data ?? '',
    titulo: row.titulo ?? '',
    bugsAntes: Number(row.bugs_antes),
    incidentesPos: Number(row.incidentes_pos),
    dre: toNumberOrNull(row.dre),
    causouIncidente: Number(row.causou_incidente) === 1 ? 1 : 0,
    falseAlarms: toNumberOrNull(row.false_alarms),
  }));
}

export function serializeDeploys(rows: Deploy[]): string {
  const records = rows.map((row) => ({
    enabler_id: row.enablerId,
    data: row.data,
    titulo: row.titulo,
    bugs_antes: row.bugsAntes,
    incidentes_pos: row.incidentesPos,
    dre: row.dre,
    causou_incidente: row.causouIncidente,
    false_alarms: row.falseAlarms,
  }));
  return csvFormat(records, DEPLOY_COLUMNS);
}

export function parseIncidents(csv: string): Incident[] {
  return csvParse(csv).map((row) => ({
    id: row.id ?? '',
    titulo: row.titulo ?? '',
    severity: Number(row.severity) as Severity,
    state: row.state ?? '',
    created: row.created ?? '',
    closed: toTextOrNull(row.closed),
    deployTag: toTextOrNull(row.deploy_tag),
    mttrDias: toNumberOrNull(row.mttr_dias),
  }));
}

export function serializeIncidents(rows: Incident[]): string {
  const records = rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    severity: row.severity,
    state: row.state,
    created: row.created,
    closed: row.closed,
    deploy_tag: row.deployTag,
    mttr_dias: row.mttrDias,
  }));
  return csvFormat(records, INCIDENT_COLUMNS);
}
