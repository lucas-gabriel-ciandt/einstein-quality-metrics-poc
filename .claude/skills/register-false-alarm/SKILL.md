---
name: register-false-alarm
description: >-
  Append a False Alarm count to a deploy row in data/deploys.csv. False Alarm =
  E2E tests that failed outright and whose manual triage concluded "product OK,
  test wrong" (a calibration cost), not Playwright flakiness. The dev arrives
  with the triaged number; this skill only writes it to the false_alarms column
  of the matching deploy — append-only, one number, nothing else.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Register false alarm

The False Alarm metric is a single manual per-deploy number: how many E2E tests
failed and were judged false positives (product OK, test wrong) during the
deploy's E2E round. The triage is the dev's judgment, done outside the POC. This
skill does one thing — append that number to the deploy's `false_alarms` cell in
`data/deploys.csv`. No `results.json` parsing, no interactive triage, no other
columns touched.

## Protocol

1. **Read `data/deploys.csv`** (parse with `src/lib/csv.ts` `parseDeploys`).
2. **Ask which deploy.** Default to the most recent row whose `false_alarms` is
   empty (the deploy still awaiting its number). Offer it; let the user pick a
   different `enabler_id`/date.
3. **Ask for the number** — a single non-negative integer, the false-positive
   count for that deploy's E2E round.
4. **Overwrite guard.** If the chosen deploy already has a `false_alarms` value,
   show the current value and ask for explicit confirmation before overwriting.
   No silent replacement.
5. **Absent deploy.** If the deploy is not a row in the CSV, do NOT create it
   here. Tell the user to run the `extract-board-metrics` skill first so the
   deploy Enabler is materialized, then come back.
6. **Write back** with `serializeDeploys` so column order and escaping stay
   exact. Only the one `false_alarms` cell changes; every other column and row
   is preserved byte-for-byte in meaning.

## Guardrails

- Append-only: never recompute or edit `bugs_antes`, `incidentes_pos`, `dre`,
  or `causou_incidente` — those are the extraction's, owned by
  `extract-board-metrics`.
- One number per deploy. If a fuller triage (false positives vs environment vs
  real bugs) starts being logged later, that is a schema change, not this skill.
- The grain is the deploy: the E2E cycle runs once per deploy, so False Alarm
  shares the `deploys.csv` grain.
