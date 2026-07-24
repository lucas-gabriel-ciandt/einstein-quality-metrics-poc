# einstein-quality-metrics-poc

POC dashboard for delivery-quality metrics of the patients team's front end at
the Einstein BR Portal. Four metrics — **DRE**, **CFR**, **MTTR**, **False
Alarm** — extracted from the Azure DevOps board (org hiae, project
`NOVO_EINSTEIN_BR`) into two versioned CSVs and rendered by a static Next.js
app.

Full design and decision history: `docs/spec.md` (the substrate). Agent context
index: `CLAUDE.md`.

## Architecture

```
Azure board --(extract-board-metrics skill)--> data/*.csv --(fs at build)--> dashboard
```

Every metric materializes in the CSV dataset first. The presentation never
computes a metric that is not already in the data layer.

- `data/deploys.csv` — one row per `deploy-portal` deploy Enabler (DRE, CFR,
  False Alarm).
- `data/incidentes.csv` — one row per Incident (raw MTTR, right-censoring).
- `src/lib/` — the computable data layer: `types.ts`, `csv.ts` (d3-dsv),
  `metrics.ts` (per-deploy series), `transform.ts` (board JSON -> CSV rows).
- `src/app/`, `src/components/`, `src/content/` — the presentation layer.

## Commands

| Purpose | Command |
|---------|---------|
| Dev server | `npm run dev` |
| Static export build (`out/`) | `npm run build` |
| Type check | `npm run check-types` |
| Lint | `npm run lint` |
| Lint fix | `npm run lint:fix` |
| Tests | `npm run test:run` |
| Coverage | `npm run test:coverage` |

## The four metrics

- **DRE** — `pre / (pre + post)` per deploy, by the hybrid rule (Incident = post;
  Bug momento 0-5 = pre; Bug momento 6 = post, `furo-convencao`; Bug no momento =
  pre, `dado-incompleto`).
- **CFR** — cumulative since the first registered deploy: share of deploys with
  at least one attributed Incident. The latest window is right-censored
  (partial).
- **MTTR** — `ClosedDate - CreatedDate` per Incident, split Sev 1-2 vs Sev 3-4;
  open Incidents shown as "open for X days".
- **False Alarm** — a single manual per-deploy number, appended via the
  `register-false-alarm` skill.

## Skills

- `.claude/skills/extract-board-metrics/` — WIQL extraction from the board into
  the two CSVs. `board-model.md` carries the scope funnel, tag rules, DRE hybrid
  rule, Severity cut, and ready-made WIQL.
- `.claude/skills/register-false-alarm/` — append-only writer for the
  `false_alarms` column.

## Manual seed procedure

The unit tests validate the transform logic (`src/lib/transform.ts`) against
recorded board fixtures deterministically, in CI. Seeding the real dataset from
the **live** board is a manual step, run once with a logged-in `az` CLI — it is
not part of the automated test loop.

1. **Log in and check the CLI.**

   ```bash
   az login
   az version | grep -i azure-devops || az extension add --name azure-devops
   az devops configure --defaults \
     organization=https://dev.azure.com/hiae project=NOVO_EINSTEIN_BR
   ```

2. **Run the extraction.** Invoke the `extract-board-metrics` skill (it reads
   `board-model.md`, runs the two WIQL queries, applies the 3-filter scope
   funnel, computes DRE/CFR/MTTR, and writes `data/deploys.csv` +
   `data/incidentes.csv`, preserving any `false_alarms` already registered).

3. **Validate against the answer key** (spec mining, 2026-07-22/23):

   - **5** `deploy-portal` Enablers: 390722 (01/06), 394210 (23/06),
     395747 (06/07), 397800 (21/07), 398412 (27/07).
   - **35** Incidents at the `NOVO_EINSTEIN_BR` root (2026).
   - **CFR 3/4** over the Jun-Jul closed windows (390722, 394210, 395747 failed;
     397800's window open).
   - MTTR Sev 1-2 (n=6): 0, 0, 1, 10, 13, 34 days; Sev 3-4 (n=18) median ~14d.
   - Open Incidents preserved: 390814, 395697, 396085.

   Any divergence is a data-quality signal to investigate on the board, not a
   number to hand-edit into the CSV.

4. **Register False Alarm numbers** per deploy with the `register-false-alarm`
   skill as the dev triages each E2E round.

5. **Build and review.** `npm run build` produces the static export in `out/`;
   open it or run `npm run dev` for the dashboard.

## Stack

Next.js (`output: 'export'`, static), TypeScript ESM, Tailwind v4, Recharts,
Biome, Vitest. Node 22 (`.nvmrc`). Conventions ported (adapted, not copied) from
the `HIAE.EINSTEINBR.Front` reference project.
