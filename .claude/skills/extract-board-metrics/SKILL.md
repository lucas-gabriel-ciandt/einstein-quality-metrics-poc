---
name: extract-board-metrics
description: >-
  Extract the patients-team front-end delivery-quality dataset from the Azure
  DevOps board (org hiae, project NOVO_EINSTEIN_BR) into the two versioned CSVs
  this POC renders: data/deploys.csv and data/incidentes.csv. Runs WIQL queries
  via the az CLI, applies the 3-filter scope funnel, computes DRE/CFR/MTTR per
  the spec rules, preserves the manually-registered false_alarms column, and
  validates Tag B against ClosedDate. Read board-model.md before querying.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Extract board metrics

You materialize the POC dataset from the live board. Every metric lands in the
CSVs first; the dashboard never recomputes what is not already in the data
layer. The board model — scope funnel, tag semantics, DRE hybrid rule, Severity
cut, ready-made WIQL — lives in `board-model.md` next to this file. Read it
before running any query; the rules there are the contract.

## Pre-flight

Confirm the az CLI and the azure-devops extension are present and configured:

```bash
az version 2>/dev/null | grep -i azure-devops || echo "EXTENSION_MISSING"
az devops configure --list 2>/dev/null
```

If the extension is missing, stop and tell the user to run
`az extension add --name azure-devops`. The organization is
`https://dev.azure.com/hiae`, the project is `NOVO_EINSTEIN_BR`.

## Flow

1. **Read `board-model.md`.** It carries the WIQL you run verbatim, the scope
   funnel, and the metric rules. Do not invent queries; use the ones there.
2. **Query the deploy Enablers** (CFR denominator): the Enablers tagged
   `deploy-portal`. Each is one row of `data/deploys.csv`. The canonical deploy
   date is the `DD-MM-YYYY` in the `[Portal] Deploy DD-MM-YYYY` title, not the
   CreatedDate.
3. **Query the findings** (Bugs + Incidents) in the patients-front scope, then
   apply the 3-filter funnel from the board model (AreaPath root, then the
   `team.yml`/front-dev AssignedTo allowlist, then the `nao-classificado` pile
   for unassigned items). Nothing is dropped silently.
4. **Attribute and compute** using the same logic the dashboard consumes,
   `src/lib/transform.ts` (`buildDeploys`, `buildIncidents`):
   - Window attribution: an Incident/Bug whose CreatedDate falls between deploy
     N and N+1 is attributed to N; the latest deploy's window stays open
     (right-censoring).
   - **DRE (hybrid rule, type as classifier, momento as auditor):** Incident
     (any momento) = post; Bug momento 0-5 = pre; Bug momento 6 = post +
     `furo-convencao`; Bug with no momento = pre + `dado-incompleto`.
     `dre = pre / (pre + post)` per deploy window.
   - **CFR:** `causou_incidente = 1` when at least one Incident is attributed to
     the deploy window (a reported failure counts even without a hotfix).
   - **MTTR:** `mttr_dias = ClosedDate - CreatedDate` per Incident; open
     Incidents keep an empty `closed`/`mttr_dias` (preserved, never dropped).
5. **Validate Tag B against ClosedDate.** For each Incident carrying a
   `Deploy DD-MM-YYYY` tag (Tag B, the fix vehicle), the tag date must be within
   one day of `ClosedDate` (the team closes the Incident when the fix ships:
   spec found 18 same-day, 6 next-day). Report every mismatch as a data-quality
   warning; do not silently rewrite dates.
6. **Write the CSVs, preserving `false_alarms`.** Read the existing
   `data/deploys.csv` first and pass its rows as the `previous` argument to
   `buildDeploys` so each deploy keeps its manually-registered `false_alarms`
   value. The extraction NEVER writes `false_alarms` — that column is owned by
   the `register-false-alarm` skill. Serialize with `src/lib/csv.ts`
   (`serializeDeploys`, `serializeIncidents`) so column order and comma escaping
   stay exact.

## Output

- `data/deploys.csv` — one row per `deploy-portal` Enabler, `false_alarms`
  carried over from the previous file untouched.
- `data/incidentes.csv` — one row per Incident, open ones right-censored.
- A short console report: deploy count, incident count, CFR over the closed
  windows, and any Tag B / ClosedDate mismatches found.

## Guardrails

- Query by the `deploy-portal` tag, never by title text — real titles vary
  (`Deploy 04032026`, `[Deploy] 06/05/2026`); the tag is exact and dedupes.
- One Enabler per production deploy; a duplicate `deploy-portal` tag is a data
  error to surface, not to average away.
- No new tags on Bugs/Incidents. Attribution is by date window; a Related link
  is the only manual override, for the rare late-discovered Incident.
- Never touch `false_alarms`; never edit the tests or the seed history to make
  numbers line up. If the live numbers disagree with the answer key, report the
  gap.
