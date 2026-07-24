import { describe, expect, it } from 'vitest';
import {
  parseDeploys,
  parseIncidents,
  serializeDeploys,
  serializeIncidents,
} from '@/lib/csv';
import type { Deploy, Incident } from '@/lib/types';

const DEPLOY_HEADER =
  'enabler_id,data,titulo,bugs_antes,incidentes_pos,dre,causou_incidente,false_alarms';
const INCIDENT_HEADER =
  'id,titulo,severity,state,created,closed,deploy_tag,mttr_dias';

const deployWithCommas: Deploy = {
  enablerId: '390722',
  data: '2026-06-01',
  titulo: '[Portal] Deploy 01-06-2026, com vírgulas, no título',
  bugsAntes: 6,
  incidentesPos: 6,
  dre: 0.5,
  causouIncidente: 1,
  falseAlarms: null,
};

const incidentWithCommas: Incident = {
  id: '392655',
  titulo: 'Menu mobile, formatação e iframe, tudo quebrado',
  severity: 2,
  state: 'Closed',
  created: '2026-06-01',
  closed: '2026-06-01',
  deployTag: 'Deploy 06-07-2026',
  mttrDias: 0,
};

describe('serializeDeploys', () => {
  it('emits the snake_case header in the exact schema order', () => {
    const csv = serializeDeploys([deployWithCommas]);
    const [header] = csv.split('\n');
    expect(header).toBe(DEPLOY_HEADER);
  });
});

describe('serializeIncidents', () => {
  it('emits the snake_case header in the exact schema order', () => {
    const csv = serializeIncidents([incidentWithCommas]);
    const [header] = csv.split('\n');
    expect(header).toBe(INCIDENT_HEADER);
  });
});

describe('deploy CSV round-trip', () => {
  it('preserves a titulo containing commas through serialize -> parse', () => {
    const [row] = parseDeploys(serializeDeploys([deployWithCommas]));
    expect(row).toEqual(deployWithCommas);
  });

  it('is stable through parse -> serialize -> parse', () => {
    const once = parseDeploys(serializeDeploys([deployWithCommas]));
    const twice = parseDeploys(serializeDeploys(once));
    expect(twice).toEqual([deployWithCommas]);
  });

  it('parses empty numeric cells (dre, false_alarms) as null', () => {
    const csv = [
      DEPLOY_HEADER,
      '397800,2026-07-21,"[Portal] Deploy 21-07-2026",0,0,,0,',
    ].join('\n');
    const [row] = parseDeploys(csv);
    expect(row.dre).toBeNull();
    expect(row.falseAlarms).toBeNull();
    expect(row.enablerId).toBe('397800');
    expect(row.causouIncidente).toBe(0);
  });
});

describe('incident CSV round-trip', () => {
  it('preserves a titulo containing commas through serialize -> parse', () => {
    const [row] = parseIncidents(serializeIncidents([incidentWithCommas]));
    expect(row).toEqual(incidentWithCommas);
  });

  it('is stable through parse -> serialize -> parse', () => {
    const once = parseIncidents(serializeIncidents([incidentWithCommas]));
    const twice = parseIncidents(serializeIncidents(once));
    expect(twice).toEqual([incidentWithCommas]);
  });

  it('parses empty closed/deploy_tag/mttr_dias cells as null (open incident)', () => {
    const csv = [
      INCIDENT_HEADER,
      '390814,"Menu, quebrado",1,Committed,2026-05-01,,,',
    ].join('\n');
    const [row] = parseIncidents(csv);
    expect(row.closed).toBeNull();
    expect(row.deployTag).toBeNull();
    expect(row.mttrDias).toBeNull();
    expect(row.titulo).toBe('Menu, quebrado');
    expect(row.created).toBe('2026-05-01');
  });
});
