import { classifyFinding } from '@/lib/metrics';
import type {
  Deploy,
  Finding,
  Incident,
  Momento,
  Severity,
  WorkItemType,
} from '@/lib/types';

const MS_PER_DAY = 86_400_000;
// Real board titles are not uniform: `[Portal] Deploy - 01/06/2026`,
// `[Portal] Deploy -06/07/2026` and `[Portal] Deploy 21-07-2026` all occur.
// Accept an optional dash separator and either `-` or `/` inside the date.
const DEPLOY_DATE_PATTERN = /Deploy\s*-?\s*(\d{2})[-/](\d{2})[-/](\d{4})/;

export interface RawWorkItem {
  id: number;
  fields: Record<string, unknown>;
}

function field(item: RawWorkItem, key: string): unknown {
  return item.fields[key];
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function leadingInteger(value: unknown): number | null {
  const text = toStringOrNull(value);
  if (text === null) {
    return null;
  }
  const match = text.match(/^\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

export function parseMomento(raw: unknown): Momento {
  const value = leadingInteger(raw);
  if (value === null || value < 0 || value > 6) {
    return null;
  }
  return value as Momento;
}

export function parseSeverity(raw: unknown): Severity {
  const value = leadingInteger(raw);
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  return 4;
}

export function toDateOnly(raw: unknown): string | null {
  const text = toStringOrNull(raw);
  if (text === null) {
    return null;
  }
  const separator = text.indexOf('T');
  return separator === -1 ? text : text.slice(0, separator);
}

export function extractDeployTag(tags: unknown): string | null {
  const text = toStringOrNull(tags);
  if (text === null) {
    return null;
  }
  for (const token of text.split(';')) {
    const trimmed = token.trim();
    if (DEPLOY_DATE_PATTERN.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

export function parseDeployDate(title: string): string {
  const match = title.match(DEPLOY_DATE_PATTERN);
  if (!match) {
    throw new Error(`Deploy title without a DD-MM-YYYY date: ${title}`);
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function tagDate(tag: string | null): string | null {
  if (tag === null) {
    return null;
  }
  const match = tag.match(DEPLOY_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function workItemType(item: RawWorkItem): WorkItemType {
  return field(item, 'System.WorkItemType') === 'Incident' ? 'Incident' : 'Bug';
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

function roundDre(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function toFinding(item: RawWorkItem): Finding {
  return {
    type: workItemType(item),
    momento: parseMomento(field(item, 'Custom.HIAE_MOMENTO_ABERTURA')),
  };
}

export function buildIncidents(raw: RawWorkItem[]): Incident[] {
  return raw.map((item) => {
    const created = toDateOnly(field(item, 'System.CreatedDate')) ?? '';
    const closed = toDateOnly(field(item, 'Microsoft.VSTS.Common.ClosedDate'));
    return {
      id: String(item.id),
      titulo: toStringOrNull(field(item, 'System.Title')) ?? '',
      severity: parseSeverity(field(item, 'Microsoft.VSTS.Common.Severity')),
      state: toStringOrNull(field(item, 'System.State')) ?? '',
      created,
      closed,
      deployTag: extractDeployTag(field(item, 'System.Tags')),
      mttrDias: closed === null ? null : daysBetween(created, closed),
    };
  });
}

interface DeployWindow {
  enablerId: string;
  data: string;
  titulo: string;
  start: number;
  end: number;
  findings: Finding[];
  incidentCount: number;
}

export function buildDeploys(
  rawEnablers: RawWorkItem[],
  rawFindings: RawWorkItem[],
  previous: Deploy[] = [],
): Deploy[] {
  const windows: DeployWindow[] = rawEnablers
    .map((enabler) => {
      const titulo = toStringOrNull(field(enabler, 'System.Title')) ?? '';
      const data = parseDeployDate(titulo);
      return {
        enablerId: String(enabler.id),
        data,
        titulo,
        start: Date.parse(data),
        end: Number.POSITIVE_INFINITY,
        findings: [] as Finding[],
        incidentCount: 0,
      };
    })
    .sort((a, b) => a.start - b.start);

  for (let index = 0; index < windows.length - 1; index += 1) {
    windows[index].end = windows[index + 1].start;
  }

  const previousByEnabler = new Map(
    previous.map((deploy) => [deploy.enablerId, deploy.falseAlarms]),
  );

  for (const item of rawFindings) {
    const created = toDateOnly(field(item, 'System.CreatedDate'));
    if (created === null) {
      continue;
    }
    const createdMs = Date.parse(created);
    const window = windows.find(
      (candidate) => createdMs >= candidate.start && createdMs < candidate.end,
    );
    if (window === undefined) {
      continue;
    }
    window.findings.push(toFinding(item));
    if (workItemType(item) === 'Incident') {
      window.incidentCount += 1;
    }
  }

  return windows.map((window) => {
    let pre = 0;
    let post = 0;
    for (const finding of window.findings) {
      if (classifyFinding(finding).phase === 'pre') {
        pre += 1;
      } else {
        post += 1;
      }
    }
    const total = pre + post;
    return {
      enablerId: window.enablerId,
      data: window.data,
      titulo: window.titulo,
      bugsAntes: pre,
      incidentesPos: post,
      dre: total === 0 ? null : roundDre(pre / total),
      causouIncidente: window.incidentCount > 0 ? 1 : 0,
      falseAlarms: previousByEnabler.get(window.enablerId) ?? null,
    };
  });
}

export function validateClosure(incident: Incident): boolean {
  const expected = tagDate(incident.deployTag);
  if (expected === null || incident.closed === null) {
    return true;
  }
  return Math.abs(daysBetween(expected, incident.closed)) <= 1;
}
