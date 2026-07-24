import { describe, expect, it } from 'vitest';
import {
  buildDeploys,
  buildIncidents,
  extractDeployTag,
  parseDeployDate,
  parseMomento,
  parseSeverity,
  type RawWorkItem,
  toDateOnly,
  toFinding,
  validateClosure,
} from '@/lib/transform';
import type { Deploy, Incident } from '@/lib/types';
import enablersFixture from '../../tests/__mocks__/az-deploy-enablers.json';
import incidentsFixture from '../../tests/__mocks__/az-incidents.json';
import findingsFixture from '../../tests/__mocks__/az-window-findings.json';

const rawEnablers = enablersFixture as RawWorkItem[];
const rawIncidents = incidentsFixture as RawWorkItem[];
const rawFindings = findingsFixture as RawWorkItem[];

function incident(overrides: Partial<Incident>): Incident {
  return {
    id: '000000',
    titulo: 'incident',
    severity: 1,
    state: 'Closed',
    created: '2026-06-01',
    closed: null,
    deployTag: null,
    mttrDias: null,
    ...overrides,
  };
}

function byEnablerId(deploys: Deploy[]): Map<string, Deploy> {
  return new Map(deploys.map((d) => [d.enablerId, d]));
}

function byId(incidents: Incident[]): Map<string, Incident> {
  return new Map(incidents.map((i) => [i.id, i]));
}

describe('parseMomento', () => {
  it('maps a filled momento string to its leading integer', () => {
    expect(parseMomento('6 - Pós Go Live')).toBe(6);
    expect(parseMomento('0 - Teste na Sprint')).toBe(0);
    expect(parseMomento('3 - Teste Integrado')).toBe(3);
  });

  it('maps an absent or empty momento to null', () => {
    expect(parseMomento(undefined)).toBeNull();
    expect(parseMomento('')).toBeNull();
  });
});

describe('parseSeverity', () => {
  it('maps a severity string to its leading integer', () => {
    expect(parseSeverity('1 - Critical')).toBe(1);
    expect(parseSeverity('3 - Medium')).toBe(3);
  });
});

describe('toDateOnly', () => {
  it('truncates an ISO timestamp to the YYYY-MM-DD date', () => {
    expect(toDateOnly('2026-06-01T13:00:00Z')).toBe('2026-06-01');
  });

  it('returns null when the value is absent', () => {
    expect(toDateOnly(undefined)).toBeNull();
  });
});

describe('extractDeployTag', () => {
  it('pulls the Deploy DD-MM-YYYY token out of a joined tag string', () => {
    expect(extractDeployTag('Front End (Bug); Deploy 01-06-2026; QA')).toBe(
      'Deploy 01-06-2026',
    );
    expect(extractDeployTag('MANUTENCAO; Deploy 23-06-2026')).toBe(
      'Deploy 23-06-2026',
    );
  });

  it('returns null when no Deploy tag is present', () => {
    expect(extractDeployTag('MANUTENCAO; QA')).toBeNull();
    expect(extractDeployTag(undefined)).toBeNull();
  });
});

describe('parseDeployDate', () => {
  it('converts a DD-MM-YYYY title date into a YYYY-MM-DD date', () => {
    expect(parseDeployDate('[Portal] Deploy 01-06-2026')).toBe('2026-06-01');
    expect(parseDeployDate('[Portal] Deploy 27-07-2026')).toBe('2026-07-27');
  });
});

describe('toFinding', () => {
  it('reduces a raw Bug item to its type and parsed momento', () => {
    const bug = rawFindings.find((item) => item.id === 500003) as RawWorkItem;
    expect(toFinding(bug)).toEqual({ type: 'Bug', momento: 2 });
  });

  it('reduces a raw Incident with no momento to type Incident and momento null', () => {
    const inc = rawFindings.find((item) => item.id === 500001) as RawWorkItem;
    expect(toFinding(inc)).toEqual({ type: 'Incident', momento: null });
  });
});

describe('buildIncidents', () => {
  const incidents = buildIncidents(rawIncidents);

  it('produces one Incident row per raw item with a string id', () => {
    expect(incidents).toHaveLength(rawIncidents.length);
    for (const row of incidents) {
      expect(typeof row.id).toBe('string');
    }
    expect(byId(incidents).get('390722001')?.titulo).toBe(
      'Menu mobile quebrado apos deploy',
    );
  });

  it('reproduces the spec Sev 1-2 MTTR series (0, 0, 1, 10, 13, 34 days)', () => {
    const sev12 = incidents
      .filter((i) => i.severity <= 2 && i.mttrDias !== null)
      .map((i) => i.mttrDias as number)
      .sort((a, b) => a - b);
    expect(sev12).toEqual([0, 0, 1, 10, 13, 34]);
  });

  it('reproduces the spec Sev 3-4 MTTR series (4, 14, 14 days)', () => {
    const sev34 = incidents
      .filter((i) => i.severity >= 3 && i.mttrDias !== null)
      .map((i) => i.mttrDias as number)
      .sort((a, b) => a - b);
    expect(sev34).toEqual([4, 14, 14]);
  });

  it('preserves open incidents with closed and mttrDias null', () => {
    const open = incidents.filter((i) => i.closed === null);
    expect(open.map((i) => i.id).sort()).toEqual([
      '390814',
      '395697',
      '396085',
    ]);
    for (const row of open) {
      expect(row.mttrDias).toBeNull();
    }
  });

  it('stores dates as date-only and computes mttrDias as closed minus created', () => {
    const row = byId(incidents).get('383001001');
    expect(row?.created).toBe('2026-02-01');
    expect(row?.closed).toBe('2026-03-07');
    expect(row?.mttrDias).toBe(34);
  });

  it('extracts the Tag B deploy tag, and null when absent', () => {
    expect(byId(incidents).get('390722001')?.deployTag).toBe(
      'Deploy 01-06-2026',
    );
    expect(byId(incidents).get('390814')?.deployTag).toBeNull();
  });
});

describe('buildDeploys', () => {
  const deploys = buildDeploys(rawEnablers, rawFindings);

  it('sorts enablers ascending by the title deploy date', () => {
    expect(deploys.map((d) => d.enablerId)).toEqual([
      '390722',
      '394210',
      '395747',
      '397800',
      '398412',
    ]);
    expect(deploys.map((d) => d.data)).toEqual([
      '2026-06-01',
      '2026-06-23',
      '2026-07-06',
      '2026-07-21',
      '2026-07-27',
    ]);
  });

  it('carries the enabler titulo through', () => {
    expect(byEnablerId(deploys).get('390722')?.titulo).toBe(
      '[Portal] Deploy 01-06-2026',
    );
  });

  it('window-attributes findings and counts pre findings as bugsAntes', () => {
    const map = byEnablerId(deploys);
    expect(map.get('390722')?.bugsAntes).toBe(2);
    expect(map.get('394210')?.bugsAntes).toBe(2);
    expect(map.get('395747')?.bugsAntes).toBe(1);
    expect(map.get('397800')?.bugsAntes).toBe(1);
    expect(map.get('398412')?.bugsAntes).toBe(0);
  });

  it('counts post findings (incidents and momento-6 bugs) as incidentesPos', () => {
    const map = byEnablerId(deploys);
    expect(map.get('390722')?.incidentesPos).toBe(2);
    expect(map.get('394210')?.incidentesPos).toBe(1);
    expect(map.get('395747')?.incidentesPos).toBe(4);
    expect(map.get('397800')?.incidentesPos).toBe(1);
    expect(map.get('398412')?.incidentesPos).toBe(0);
  });

  it('derives dre as pre/(pre+post) rounded to 4 decimals, null when empty', () => {
    const map = byEnablerId(deploys);
    expect(map.get('390722')?.dre).toBe(0.5);
    expect(map.get('394210')?.dre).toBe(0.6667);
    expect(map.get('395747')?.dre).toBe(0.2);
    expect(map.get('397800')?.dre).toBe(0.5);
    expect(map.get('398412')?.dre).toBeNull();
  });

  it('flags causouIncidente only for windows carrying an Incident work item', () => {
    expect(deploys.map((d) => d.causouIncidente)).toEqual([1, 1, 1, 0, 0]);
  });

  it('does not attribute findings created before the first deploy window', () => {
    expect(byEnablerId(deploys).get('390722')?.incidentesPos).toBe(2);
  });

  it('leaves falseAlarms null when no previous dataset is provided', () => {
    for (const d of deploys) {
      expect(d.falseAlarms).toBeNull();
    }
  });

  it('preserves falseAlarms from the previous dataset by enablerId', () => {
    const previous: Deploy[] = [
      {
        enablerId: '390722',
        data: '2026-06-01',
        titulo: '[Portal] Deploy 01-06-2026',
        bugsAntes: 0,
        incidentesPos: 0,
        dre: null,
        causouIncidente: 0,
        falseAlarms: 2,
      },
      {
        enablerId: '395747',
        data: '2026-07-06',
        titulo: '[Portal] Deploy 06-07-2026',
        bugsAntes: 0,
        incidentesPos: 0,
        dre: null,
        causouIncidente: 0,
        falseAlarms: 3,
      },
    ];
    const map = byEnablerId(buildDeploys(rawEnablers, rawFindings, previous));
    expect(map.get('390722')?.falseAlarms).toBe(2);
    expect(map.get('395747')?.falseAlarms).toBe(3);
    expect(map.get('394210')?.falseAlarms).toBeNull();
    expect(map.get('397800')?.falseAlarms).toBeNull();
    expect(map.get('398412')?.falseAlarms).toBeNull();
  });
});

describe('validateClosure', () => {
  it('accepts a closure within one day of the Tag B deploy date', () => {
    expect(
      validateClosure(
        incident({ deployTag: 'Deploy 01-06-2026', closed: '2026-06-01' }),
      ),
    ).toBe(true);
    expect(
      validateClosure(
        incident({ deployTag: 'Deploy 23-06-2026', closed: '2026-06-24' }),
      ),
    ).toBe(true);
  });

  it('rejects a closure more than one day from the Tag B deploy date', () => {
    expect(
      validateClosure(
        incident({ deployTag: 'Deploy 06-07-2026', closed: '2026-07-16' }),
      ),
    ).toBe(false);
  });

  it('accepts an incident with no deploy tag or still open', () => {
    expect(
      validateClosure(incident({ deployTag: null, closed: '2026-06-01' })),
    ).toBe(true);
    expect(
      validateClosure(
        incident({ deployTag: 'Deploy 01-06-2026', closed: null }),
      ),
    ).toBe(true);
  });
});
