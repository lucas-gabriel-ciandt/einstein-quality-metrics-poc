# Board model

Distilled from `docs/spec.md`. The board (org hiae, project
`NOVO_EINSTEIN_BR`) is the data source; this file is the contract the
extraction reads. Board literals (tags, titles, field values) are kept in their
original form — they are data, not prose.

## Scope: front end of both teams

The POC measures the **front end of both teams** (patients + medicos) — one
project, one front repository, one deploy pipeline. The scope is `front`, and an
item is front when EITHER branch holds (Option A, "front in general"):

1. **Field branch (both teams).** `[Microsoft.VSTS.Common.Activity] =
   'Front End (BUG)'`. This is the board's own front/back marker (labelled
   **"Tipo de Atividade"** on the form; its counterpart is `Back End (BUG)`).
   Do NOT confuse it with `Custom.HIAE_TIPO_SERVICO` (UI label "Tipo de
   Serviço"), a different field that is empty on ~74% of items and is NOT read
   by the extraction. Medicos fill Tipo de Atividade correctly, so it brings
   the whole medicos front in on its own.
2. **Allowlist branch (patients rescue).** `[System.AssignedTo]` in the current
   patients front-dev list (versioned config, `team.yml`): Lucas Gabriel da
   Silva, Samuel Soares da Rocha, Joao Carlos Rodrigues Dias, Edilson Aparecido
   Rodrigues. Patients fill the Activity field unreliably (only ~1 in 3 of their
   real front items carries `Front End (BUG)`), so the allowlist rescues the
   rest. A dev joining/leaving edits the file, not code.

`front = (Activity == 'Front End (BUG)') OR (AssignedTo in team.yml frontDevs)`.

3. **Neither branch = `nao-classificado` pile.** Items that are unassigned AND
   not field-tagged front are reported with a count for manual triage, never
   dropped silently. There is NO medicos allowlist — medicos front rides the
   Activity field, so a medicos front item with no assignee still counts.

Area Path is no longer a scope filter (both `NOVO_EINSTEIN_BR` and
`NOVO_EINSTEIN_BR\MEDICOS_EMPRESAS` are in scope); it is kept only to attribute
an item to a team in reporting. Discarded as filters: title prefix (89% of Bugs
have none) and CreatedBy (the QA opens Bugs for both sides).

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
  Severity (`Microsoft.VSTS.Common.Severity`). The board values are
  `1 - Critical`, `2 - High`, `3 - Medium`, `4 - Low`; the two series are
  "Crítico e Alto" (1-2, critical restoration) and "Médio e Baixo" (3-4,
  deploy-cadence fixes). Name them by the board label in the UI, never by the
  numeric code. Never a single average. Open Incidents enter as "open for X
  days" and never disappear.

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
       [Custom.HIAE_MOMENTO_ABERTURA], [System.AssignedTo],
       [System.AreaPath], [Microsoft.VSTS.Common.Activity]
FROM WorkItems
WHERE [System.TeamProject] = 'NOVO_EINSTEIN_BR'
  AND [System.AreaPath] UNDER 'NOVO_EINSTEIN_BR'
  AND [System.WorkItemType] IN ('Bug', 'Incident')
  AND [System.CreatedDate] >= '2026-01-01T00:00:00Z'
ORDER BY [System.CreatedDate] ASC
```

`UNDER` pulls both areas. Apply the two-branch front funnel
(`Activity == 'Front End (BUG)'` OR AssignedTo in the allowlist) and the
`nao-classificado` count on the returned set. `AreaPath` and `Activity` are in
the SELECT so the funnel and the per-team reporting can read them.

## Answer key (merged scope, live 2026-08-04)

Validate the live extraction against these. Supersedes the patients-only spec
mining of 2026-07-22/23 (which gave CFR 3/4 over four deploys); the numbers
below are both teams' front and reflect the board as of 2026-08-04.

- 5 `deploy-portal` Enablers: 390722 (01/06), 394210 (23/06), 395747 (06/07),
  397800 (21/07), 398412 (**03/08** — the last deploy slipped from 27/07).
- Scope funnel: 173 Bug+Incident under the root (101 patients, 72 medicos) ->
  **112 front** (76 patients via allowlist-or-field, 36 medicos via field),
  16 `nao-classificado` (unassigned and not field-front).
- Front Incidents: **28**. All are patients-area; medicos front is 36 items,
  **all Bugs, zero Incidents**.
- Post per window: 6, 2, 3, 0, 1 -> **CFR 4/5** (only 397800 is clean/open).
- DRE per window: 0.6, 0.8333, 0.8125, 1, 0.8571. The merge lifts DRE because
  medicos front is pre-heavy (mostly momento-1 sprint catches, no Incidents).
- MTTR Sev 1-2 (n=7): 0, 0, 1, 10, 13, 27, 34 days. Sev 3-4 (n=20): median ~12d.
- Open Incident: 399923 (QA). 390814, 395697, 396085 have since closed.
- Momento quality: 0 front Bugs with an empty momento (no `dado-incompleto`),
  1 with momento 6 (`furo-convencao`).
- Data-quality warnings to surface (not rewrite): 395697 and 396085 carry Tag B
  `Deploy 03-08-2028` (a 2028 typo for 2026) while closing on 2026-08-03.
