# Board model

Distilled from `docs/spec.md`. The board (org hiae, project
`NOVO_EINSTEIN_BR`) is the data source; this file is the contract the
extraction reads. Board literals (tags, titles, field values) are kept in their
original form — they are data, not prose.

## Scope: the 3-filter funnel

The POC measures only the **patients team's front end**. Apply, in order:

1. **Patients team = Area Path.** One project, two areas. Root
   `NOVO_EINSTEIN_BR` = patients; `NOVO_EINSTEIN_BR\MEDICOS_EMPRESAS` = medicos.
   Filter exactly `[System.AreaPath] = 'NOVO_EINSTEIN_BR'`. No dependence on
   tags or title prefixes.
2. **Front within patients = AssignedTo.** An item counts as front when
   assigned to a current front dev. 2026 list (versioned config, `team.yml`):
   Lucas Gabriel da Silva, Samuel Soares da Rocha, Joao Carlos Rodrigues Dias,
   Edilson Aparecido Rodrigues. A dev joining/leaving edits the file, not code.
3. **Unassigned = `nao-classificado` pile.** Unassigned items are reported with
   a count for manual triage, never dropped silently.

Discarded as filters: title prefix (89% of Bugs have none) and CreatedBy (the
QA opens Bugs for both sides).

## Tags: two natures, only one is ours

| Tag | Where | Meaning | Use |
|-----|-------|---------|-----|
| `deploy-portal` (Tag A) | ONLY on front production deploy Enablers | "count this in the CFR denominator" | CFR denominator |
| `Deploy DD-MM-YYYY` (Tag B) | Bugs/Incidents | "this item's fix SHIPS in deploy X" (fix vehicle) | MTTR context + ClosedDate validator |

- `deploy-portal` does NOT go on E2E, staging, CMS, spike, or infra Enablers.
- Query the denominator by the tag, never by title: real titles vary
  (`Deploy 04032026`, `[Deploy] 06/05/2026`, `[Portal] Deploy -06/07/2026`).
- Canonical deploy date = the `DD-MM-YYYY` in the `[Portal] Deploy DD-MM-YYYY`
  title.
- Tag B is NOT causal attribution for CFR. CFR attribution is the date window.

## Metric rules

- **DRE — hybrid rule, type as primary classifier, momento as auditor:**

  | Case | Classification |
  |------|----------------|
  | Incident (any momento) | post |
  | Bug momento 0-5 | pre |
  | Bug momento 6 | post + `furo-convencao` flag |
  | Bug with no momento | pre + `dado-incompleto` flag |

  `DRE = pre / (pre + post)` per deploy window. Momento field:
  `Custom.HIAE_MOMENTO_ABERTURA`, values `0 - Teste na Sprint` .. `6 - Pós Go
  Live`.

- **CFR — cumulative since the first registered deploy.** A deploy fails
  (`causou_incidente = 1`) when at least one Incident is attributed to its
  window (CreatedDate between deploy N and N+1). A reported failure without a
  hotfix still counts. The latest window is right-censored (marked partial).

- **MTTR — `ClosedDate - CreatedDate` per Incident**, split into two series by
  Severity (`Microsoft.VSTS.Common.Severity`): Sev 1-2 (critical restoration)
  and Sev 3-4 (deploy-cadence fixes). Never a single average. Open Incidents
  enter as "open for X days" and never disappear.

- **False Alarm — a single manual per-deploy number** in `false_alarms`,
  written only by the `register-false-alarm` skill. The extraction preserves it.

## Ready-made WIQL

Run via `az boards query --organization https://dev.azure.com/hiae --project
NOVO_EINSTEIN_BR --wiql "<query>" --output json`. The `fields` object of each
returned item carries the SELECT columns.

**Deploy Enablers (CFR denominator):**

```sql
SELECT [System.Id], [System.Title], [System.CreatedDate], [System.Tags]
FROM WorkItems
WHERE [System.TeamProject] = 'NOVO_EINSTEIN_BR'
  AND [System.WorkItemType] = 'Enabler'
  AND [System.Tags] CONTAINS 'deploy-portal'
ORDER BY [System.CreatedDate] ASC
```

Expected for the Jun 2026+ retro: exactly 5 Enablers — 390722 (01/06),
394210 (23/06), 395747 (06/07), 397800 (21/07), 398412 (27/07). Deliberately
excluded: 394698 (duplicate of 06/07) and 392938 (staging).

**Findings (DRE + MTTR + CFR numerator):**

```sql
SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
       [System.CreatedDate], [System.Tags],
       [Microsoft.VSTS.Common.Severity],
       [Microsoft.VSTS.Common.ClosedDate],
       [Custom.HIAE_MOMENTO_ABERTURA], [System.AssignedTo]
FROM WorkItems
WHERE [System.TeamProject] = 'NOVO_EINSTEIN_BR'
  AND [System.AreaPath] = 'NOVO_EINSTEIN_BR'
  AND [System.WorkItemType] IN ('Bug', 'Incident')
  AND [System.CreatedDate] >= '2026-01-01T00:00:00Z'
ORDER BY [System.CreatedDate] ASC
```

Apply the AssignedTo funnel (filter 2) and the `nao-classificado` count
(filter 3) on the returned set.

## Answer key (spec mining, 2026-07-22/23)

Validate the live extraction against these:

- 5 `deploy-portal` Enablers; 35 Incidents at the root (2026).
- Jun-Jul CFR = 3/4: 390722 (6 front Incidents, failed), 394210 (1, failed),
  395747 (3, failed), 397800 (0, window open).
- MTTR Sev 1-2 (n=6): 0, 0, 1, 10, 13, 34 days. Sev 3-4 (n=18): median ~14d.
- Open Incidents preserved: 390814 (Committed), 395697 (Waiting GM),
  396085 (QA).
- Tag B vs ClosedDate: of 24 tagged Incidents, 18 closed same-day, 6 next-day.
