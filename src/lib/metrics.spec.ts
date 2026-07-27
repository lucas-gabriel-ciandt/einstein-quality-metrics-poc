import { describe, expect, it } from 'vitest';
import {
  classifyFinding,
  computeCfrSeries,
  computeDre,
  computeFalseAlarmSeries,
  computeMttrSeries,
} from '@/lib/metrics';
import type { Deploy, Finding, Incident, Momento } from '@/lib/types';

function deploy(overrides: Partial<Deploy>): Deploy {
  return {
    enablerId: '000000',
    data: '2026-06-01',
    titulo: 'deploy',
    bugsAntes: 0,
    incidentesPos: 0,
    dre: null,
    causouIncidente: 0,
    falseAlarms: null,
    ...overrides,
  };
}

function incident(overrides: Partial<Incident>): Incident {
  return {
    id: '000000',
    titulo: 'incident',
    severity: 2,
    state: 'Closed',
    created: '2026-06-01',
    closed: null,
    deployTag: null,
    mttrDias: null,
    ...overrides,
  };
}

describe('classifyFinding (DRE hybrid rule)', () => {
  it('classifies a Bug with momento 0-5 as pre with no flag', () => {
    const momentos: Momento[] = [0, 1, 2, 3, 4, 5];
    for (const momento of momentos) {
      const finding: Finding = { type: 'Bug', momento };
      expect(classifyFinding(finding)).toEqual({ phase: 'pre', flag: null });
    }
  });

  it('classifies a Bug with momento 6 as post + furo-convencao', () => {
    expect(classifyFinding({ type: 'Bug', momento: 6 })).toEqual({
      phase: 'post',
      flag: 'furo-convencao',
    });
  });

  it('classifies a Bug with no momento as pre + dado-incompleto', () => {
    expect(classifyFinding({ type: 'Bug', momento: null })).toEqual({
      phase: 'pre',
      flag: 'dado-incompleto',
    });
  });

  it('classifies an Incident with no momento as post with no flag', () => {
    expect(classifyFinding({ type: 'Incident', momento: null })).toEqual({
      phase: 'post',
      flag: null,
    });
  });

  it('classifies an Incident with a filled momento as post with no flag', () => {
    expect(classifyFinding({ type: 'Incident', momento: 6 })).toEqual({
      phase: 'post',
      flag: null,
    });
    expect(classifyFinding({ type: 'Incident', momento: 4 })).toEqual({
      phase: 'post',
      flag: null,
    });
  });
});

describe('computeDre', () => {
  it('computes pre / (pre + post) over a mixed finding set', () => {
    const findings: Finding[] = [
      { type: 'Bug', momento: 2 }, // pre
      { type: 'Bug', momento: 4 }, // pre
      { type: 'Bug', momento: null }, // pre (dado-incompleto)
      { type: 'Bug', momento: 6 }, // post (furo-convencao)
      { type: 'Incident', momento: null }, // post
      { type: 'Incident', momento: 6 }, // post
    ];
    expect(computeDre(findings)).toBe(0.5);
  });

  it('counts a momento-6 Bug as post so it does not inflate DRE', () => {
    const findings: Finding[] = [
      { type: 'Bug', momento: 3 }, // pre
      { type: 'Bug', momento: 6 }, // post, not pre
    ];
    expect(computeDre(findings)).toBe(0.5);
  });
});

describe('computeCfrSeries', () => {
  it('produces a cumulative rate per deploy with only the last window partial', () => {
    const deploys: Deploy[] = [
      deploy({ enablerId: '390722', data: '2026-06-01', causouIncidente: 1 }),
      deploy({ enablerId: '394210', data: '2026-06-23', causouIncidente: 1 }),
      deploy({ enablerId: '395747', data: '2026-07-06', causouIncidente: 1 }),
      deploy({ enablerId: '397800', data: '2026-07-21', causouIncidente: 0 }),
    ];
    const series = computeCfrSeries(deploys);

    expect(series.map((p) => p.enablerId)).toEqual([
      '390722',
      '394210',
      '395747',
      '397800',
    ]);
    expect(series.map((p) => p.cfr)).toEqual([1, 1, 1, 0.75]);
    expect(series.map((p) => p.partial)).toEqual([false, false, false, true]);
    expect(series[0].data).toBe('2026-06-01');
  });

  it('accumulates the numerator over deploy position (cfr(k) = failures in 1..k / k)', () => {
    const deploys: Deploy[] = [
      deploy({ enablerId: 'a', causouIncidente: 0 }),
      deploy({ enablerId: 'b', causouIncidente: 1 }),
      deploy({ enablerId: 'c', causouIncidente: 1 }),
      deploy({ enablerId: 'd', causouIncidente: 0 }),
    ];
    const series = computeCfrSeries(deploys);
    expect(series[0].cfr).toBe(0);
    expect(series[1].cfr).toBe(0.5);
    expect(series[2].cfr).toBeCloseTo(2 / 3, 10);
    expect(series[3].cfr).toBe(0.5);
    expect(series.map((p) => p.partial)).toEqual([false, false, false, true]);
  });
});

describe('computeMttrSeries', () => {
  const incidents: Incident[] = [
    incident({
      id: 'A',
      severity: 1,
      created: '2026-06-01',
      closed: '2026-06-01',
      mttrDias: 0,
    }),
    incident({
      id: 'B',
      severity: 2,
      created: '2026-06-01',
      closed: '2026-06-11',
      mttrDias: 10,
    }),
    incident({
      id: 'C',
      severity: 3,
      created: '2026-06-01',
      closed: '2026-06-15',
      mttrDias: 14,
    }),
    incident({
      id: 'D',
      severity: 4,
      created: '2026-06-01',
      closed: '2026-06-05',
      mttrDias: 4,
    }),
    incident({
      id: 'E',
      severity: 2,
      created: '2026-05-01',
      closed: null,
      mttrDias: null,
    }),
  ];

  it('groups closed severity 1-2 incidents into sev12 with mttrDias = closed - created', () => {
    const { sev12 } = computeMttrSeries(incidents, '2026-07-01');
    expect(sev12.map((p) => p.id).sort()).toEqual(['A', 'B']);
    const byId = new Map(sev12.map((p) => [p.id, p]));
    expect(byId.get('A')?.mttrDias).toBe(0);
    expect(byId.get('A')?.severity).toBe(1);
    expect(byId.get('B')?.mttrDias).toBe(10);
    expect(byId.get('B')?.severity).toBe(2);
  });

  // The chart plots both bands against the closure date. Without it the two
  // series can only be indexed positionally, which pairs unrelated incidents
  // and truncates the shorter band partway across the x axis.
  it('carries the closure date on each closed point so both bands share a real x axis', () => {
    const { sev12, sev34 } = computeMttrSeries(incidents, '2026-07-01');
    for (const point of [...sev12, ...sev34]) {
      expect(point.closed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const byId = new Map(sev12.map((p) => [p.id, p]));
    expect(byId.get('B')?.closed).toBe('2026-06-11');
  });

  it('groups closed severity 3-4 incidents into sev34 with mttrDias = closed - created', () => {
    const { sev34 } = computeMttrSeries(incidents, '2026-07-01');
    expect(sev34.map((p) => p.id).sort()).toEqual(['C', 'D']);
    const byId = new Map(sev34.map((p) => [p.id, p]));
    expect(byId.get('C')?.mttrDias).toBe(14);
    expect(byId.get('D')?.mttrDias).toBe(4);
  });

  it('preserves open incidents as open for X days between created and asOf', () => {
    const { open } = computeMttrSeries(incidents, '2026-07-01');
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe('E');
    expect(open[0].severity).toBe(2);
    expect(open[0].openDias).toBe(61);
  });

  it('does not leak open incidents into the closed severity series', () => {
    const { sev12, sev34 } = computeMttrSeries(incidents, '2026-07-01');
    const closedIds = [...sev12, ...sev34].map((p) => p.id);
    expect(closedIds).not.toContain('E');
  });
});

describe('computeFalseAlarmSeries', () => {
  it('passes each deploy false-alarm value through unchanged, including null', () => {
    const deploys: Deploy[] = [
      deploy({ enablerId: '390722', data: '2026-06-01', falseAlarms: 2 }),
      deploy({ enablerId: '394210', data: '2026-06-23', falseAlarms: null }),
      deploy({ enablerId: '395747', data: '2026-07-06', falseAlarms: 0 }),
    ];
    const series = computeFalseAlarmSeries(deploys);
    expect(series).toEqual([
      { enablerId: '390722', data: '2026-06-01', falseAlarms: 2 },
      { enablerId: '394210', data: '2026-06-23', falseAlarms: null },
      { enablerId: '395747', data: '2026-07-06', falseAlarms: 0 },
    ]);
  });
});
