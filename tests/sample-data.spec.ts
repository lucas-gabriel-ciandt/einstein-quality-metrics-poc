import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDeploys, parseIncidents } from '@/lib/csv';

function readData(file: string): string {
  return readFileSync(join(process.cwd(), 'data', file), 'utf-8');
}

describe('sample data/deploys.csv', () => {
  it('is present and parses into a non-empty deploy array', () => {
    const deploys = parseDeploys(readData('deploys.csv'));
    expect(deploys.length).toBeGreaterThan(0);
  });

  it('contains the seeded deploy 390722', () => {
    const deploys = parseDeploys(readData('deploys.csv'));
    expect(deploys.some((d) => d.enablerId === '390722')).toBe(true);
  });
});

describe('sample data/incidentes.csv', () => {
  it('is present and parses into a non-empty incident array', () => {
    const incidents = parseIncidents(readData('incidentes.csv'));
    expect(incidents.length).toBeGreaterThan(0);
  });

  it('carries at least one incident whose titulo contains a comma', () => {
    const incidents = parseIncidents(readData('incidentes.csv'));
    expect(incidents.some((i) => i.titulo.includes(','))).toBe(true);
  });
});
