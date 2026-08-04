export type Momento = 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;

export type WorkItemType = 'Bug' | 'Incident';

export interface Finding {
  type: WorkItemType;
  momento: Momento;
}

export type Phase = 'pre' | 'post';

export type ClassificationFlag = 'furo-convencao' | 'dado-incompleto';

export interface Classification {
  phase: Phase;
  flag: ClassificationFlag | null;
}

export type Severity = 1 | 2 | 3 | 4;

export interface Deploy {
  enablerId: string;
  data: string;
  titulo: string;
  bugsAntes: number;
  incidentesPos: number;
  dre: number | null;
  causouIncidente: 0 | 1;
  falseAlarms: number | null;
}

export interface Incident {
  id: string;
  titulo: string;
  severity: Severity;
  state: string;
  created: string;
  closed: string | null;
  deployTag: string | null;
  mttrDias: number | null;
}
