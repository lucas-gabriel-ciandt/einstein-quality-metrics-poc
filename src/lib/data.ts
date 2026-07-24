import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDeploys, parseIncidents } from '@/lib/csv';
import type { Deploy, Incident } from '@/lib/types';

const DATA_DIR = join(process.cwd(), 'data');

export function loadDeploys(): Deploy[] {
  return parseDeploys(readFileSync(join(DATA_DIR, 'deploys.csv'), 'utf8'));
}

export function loadIncidents(): Incident[] {
  return parseIncidents(readFileSync(join(DATA_DIR, 'incidentes.csv'), 'utf8'));
}
