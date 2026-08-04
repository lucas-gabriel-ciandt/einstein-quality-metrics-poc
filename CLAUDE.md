# CLAUDE.md

Context index for AI agents and developers working on the Einstein quality
metrics POC. Load this file, then read `docs/spec.md` for the full metric
definitions and decision history — it is the substrate for the whole project.

---

## Project Identity

Static dashboard presenting four delivery-quality metrics for the Einstein BR
Portal front-end (both squads, patients and medicos, one repo): DRE, CFR, MTTR
and False Alarm. Data is extracted from the Azure DevOps board (org hiae, project
NOVO_EINSTEIN_BR) into two versioned CSVs and rendered by a static Next.js app.
Scope is the two-branch front funnel: `Activity == 'Front End (BUG)'` OR
`AssignedTo` in `team.yml`.

**Anti-requirement:** every metric materializes in the CSV dataset first. The
presentation never computes a metric that is not already in the data layer.

---

## Commands

| Purpose | Command |
|---------|---------|
| Dev server | `npm run dev` |
| Static export build | `npm run build` (output: `out/`) |
| Type check | `npm run check-types` |
| Lint check | `npm run lint` |
| Lint fix (format + organize imports) | `npm run lint:fix` |
| Run tests | `npm run test:run` |
| Coverage | `npm run test:coverage` |

---

## Architecture

```
Azure board --(extract-board-metrics skill)--> data/*.csv --(fs at build)--> dashboard
```

- `data/deploys.csv` — one row per `deploy-portal` Enabler (DRE, CFR, False Alarm).
- `data/incidentes.csv` — one row per Incident (raw MTTR, right-censoring).
- `src/lib/` — the computable data layer (the stable contract): `types.ts`,
  `csv.ts` (parse/serialize via `d3-dsv`), `metrics.ts` (per-deploy series).
- `src/app/`, `src/components/`, `src/content/` — the presentation layer.

---

## Directory Structure

```
src/
├── app/          # App Router, single static page
├── components/   # Header, Footer, MetricSelect, MetricChart, ...
├── content/      # didactic pt-br metric descriptions
└── lib/          # types.ts, csv.ts, metrics.ts, utils.ts
data/             # deploys.csv, incidentes.csv (versioned dataset)
tests/            # Vitest fixtures and shared test data
.claude/skills/   # extract-board-metrics, register-false-alarm
```

---

## Conventions (ported from HIAE.EINSTEINBR.Front, adapted not copied)

- **ESM.** `"type": "module"`; Node 22 (`.nvmrc`).
- **Biome 2.x** formatter: 2-space indent, `lineWidth` 80, `lf`, single quotes,
  semicolons always, multiline attribute position, organize-imports on. No
  GritQL plugin. `npm run lint` is the gate; run `npm run lint:fix` before done.
- **Vitest 4.x** + Testing Library. Test files are `*.spec.ts`/`*.spec.tsx`
  colocated with source or under `tests/`. Shared mocks/fixtures under
  `tests/__mocks__/`.
- **Tailwind v4** with a token subset translated to `@theme` in
  `src/app/globals.css` (Einstein brand colors + per-metric accents).
- **No barrel exports, no emojis, no inline comments.** Tailwind-first styling.
- Do NOT inherit from the reference front: Azure `.npmrc`, styled-components,
  `@zera/components`, i18n/next-intl, Redis, Storybook, proxy/middleware.

---

## Metric rules (see docs/spec.md for the full rationale)

- **DRE** — hybrid rule, type as primary classifier, momento as auditor:
  Incident (any momento) = post; Bug momento 0-5 = pre; Bug momento 6 = post +
  `furo-convencao`; Bug no momento = pre + `dado-incompleto`. DRE = pre/(pre+post).
- **CFR** — cumulative since the first registered deploy:
  `CFR(k) = (# deploys with causou_incidente=1 in 1..k) / k`. Latest window is
  right-censored (marked partial).
- **MTTR** — `ClosedDate - CreatedDate` per Incident, split into two series
  (Sev 1-2 and Sev 3-4). Open incidents are preserved as "open for X days".
- **False Alarm** — a single manual per-deploy number, passed through unchanged;
  append-only via the `register-false-alarm` skill.
