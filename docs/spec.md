---
task_id: SPIKE-quality-metrics
title: Spike - Delivery quality metrics (Azure DevOps board)
branch: develop
target_branch: develop
status: planning
created_at: 2026-07-22
updated_at: 2026-07-24
---

# SPIKE-quality-metrics: Delivery quality metrics

> Board literals (tags, work item titles, field values such as "6 - Pós Go Live") and planned identifiers (CSV column names, flags) are kept in their original form: they are data, not prose.

## Current State

> Updated by the agent at the end of each turn.

- **Phase:** planning (POC design: repo, dataset, skills, dashboard)
- **Quantum:** —
- **Stage:** POC plan refined with the "greenfield with reference" map (port Biome formatter/rules, Vitest, tokens, conventions; do not inherit npmrc/Azure, styled-components, Zera, i18n; deliberate divergences: Tailwind v4 and type module). CI&T logo saved at ~/Documentos/POC - Quality Metrics/cit-navigate-change-white.png
- **Waiting for:** dev to approve the refined plan (including the Tailwind v4 vs v3 choice) and say where to clone the repo (e.g. ~/einstein-quality-metrics-poc)

## Context

Team of 3 devs, no dedicated Scrum Master/QA on the team (QA Laura Pasquini is on the project, but on another team). The client uses Azure DevOps (org hiae, project NOVO_EINSTEIN_BR). The client uses Monday, but PBIs/incidents are exported automatically; the metrics dashboard will be for the team's own consumption.

**Current deploy flow:** every sprint has at least one deploy Enabler (e.g. 398412 "[Portal] Deploy 27-07-2026", Sprint 48). Children of the Enabler: manual-test Tasks per section (/unidades, /serviços, /saúde e bem-estar, /o einstein) and Bugs found in those tests.

**Motivation:** the client's narrative is that "everything is the deploy's fault". The project is legacy, refactors touch non-orthogonal areas, and requirements are poorly documented. We need data to replace perception with evidence.

## Objective

1. Establish an initial set of quality metrics.
2. Validate that the board supports capturing them consistently over time.
3. Define where to input, visualize, and track the history.
4. Produce a POC and start measuring.

## Investigation findings (2026-07-22)

### A. Actual board hierarchy (confirmed via az CLI)

| Type | Level | Typical parent | Note |
|------|-------|----------------|------|
| Incident | Same level as PBI/Enabler | Feature (or no parent: 24/35 in 2026) | CANNOT be a child of an Enabler per the board rule. Exception found: Incident 381025 has parent Enabler 380020 (Deploy 04032026); the link exists in the data even though it violates the view rule |
| Bug | Task level | PBI (30), deploy Enabler (5), Incident (3), Action (1) | 8/120 with no parent in 2026 |
| Deploy Enabler | Same level as PBI | Feature | Children: test Tasks + Bugs found |

- Incidents have 1 to 3 children (the Bug/Task carrying the fix).
- Pre/post-production differentiation must NOT depend on hierarchy: it really is murky. A different field solves it (see finding C).

### B. QA presentation (Qualidade.pdf, May 2026, Laura Pasquini)

Slide 6 defines the opening standard:
- **Bug = DEV, UAT (pre-production). Incident = PRD (production).**
- Fields at opening time: Title, Repro steps, Severity, Bug Type, Momento de Abertura. Incident also has "Nro do incidente origem" (ServiceNow).
- Fields filled AFTER the fix (Resolved state): Activity Type, Root Cause, Technical justification. Before that the team does not have this information.
- **Bug Type: use only options 1 to 5** (Ambiente, Dados, Funcional, Integração, Interface). The others (Código, Regressão, Produção, etc.) are outside the indicator standardization.
- Root Cause: table RC1 to RC12 (same one as the azdo-board-management skill).
- QA runs an RCA per sprint (5 whys) with action plans.
- **A consolidated organization dashboard already exists: "[AlbertEinstein] Análise de Bugs"** (daily refresh, "Projetos Configurados" tab maps the boards). It has filters by WorkItemType, State, Bug Type, Momento Abertura, Fase, Tipo de Atividade, Camada Origem, Severidade, Causa Raiz. It has a "Bugs Fora do Padrão" section (flags wrong fill-in) and "Exportar Dados + Análise AI" (full CSV).
- Project E2E: before/after-deploy screenshot comparison (e2e folder, Playwright).

### B2. Organization dashboard up close (screenshots in ~/Documentos/dash-qualidade/)

The "[AlbertEinstein] Quality Data Lab" is a **Looker Studio** report (Google), not an Azure tool. Current state:

- Red **"ETL Descontinuada"** (ETL discontinued) banner in the header. Questions: Marcos Celeguim.
- Data cut starts April 2026; charts stop at May 2026. Consistent with a dead ETL.
- With project NOVO_EINSTEIN_BR selected, the tiles zero out (Todos os Bugs = 0) while "Bugs Por Time" shows 21/19/1/1: broken project filter or partial data.
- The "Por Fase" tab does a percentage aggregation that approximates a visual DRE: Desenvolvimento (momentos 0-3) 75.85%, Homologação (4, 5 and 6) 2.12%, Produção ({Incidente}) 22.03%, over the org-wide dataset.
- Detail of their modeling: Produção = WorkItemType Incident; Bugs with momento 6 fall under "Homologação". In other words, the org also trips over the Bug-momento-6 leak.

**Direct diagnosis:** the dashboard was not deactivated (the page opens and renders), but it is **abandoned**: the ETL feeding it was discontinued, so no new data has entered since May 2026. Besides being frozen, the existing cut is suspect for our project (the NOVO_EINSTEIN_BR filter zeroes the tiles while "Bugs Por Time" shows values), which suggests the extraction from our board was already partial or broken before the ETL died. In short: frozen + unreliable for our team. It cannot serve as a foundation; plan the POC independently and confirm with Laura/Marcos whether a reactivation plan exists.

### C. The key field: Momento de Abertura (Custom.HIAE_MOMENTO_ABERTURA)

Values: 0-Teste na Sprint, 1-Teste Produto Funcional, 2-Teste Produto Fábrica de Teste, 3-Teste Integrado, 4-Teste de Liberação, 5-Teste de Go Live, 6-Pós Go Live.

**It already encodes pre vs post-deploy, independent of hierarchy.** Boundary: 0 to 5 = pre, 6 = post. It is the same field the organization dashboard consumes.

### D. Current fill-in quality (Jan-Jul 2026)

| Set | n | Momento de Abertura | Root Cause | Parent |
|-----|---|--------------------|-----------|--------|
| Bugs | 120 | 100% filled | 52% empty (62/120; partly expected, only filled at Resolved) | 8 with no parent |
| Incidents | 35 | **49% empty (17/35)** | 49% empty | 24 with no parent |

- Convention breaches: 5 Bugs with Momento "6 - Pós Go Live" (should have been Incidents). 1 Bug "3 - Teste Integrado", 2 "5 - Teste de Go Live".
- Filled Incidents: 16 of 18 are "6 - Pós Go Live" (consistent with the Incident=PRD rule).
- AreaPath: 2026 Bugs split between NOVO_EINSTEIN_BR (64, root) and NOVO_EINSTEIN_BR\MEDICOS_EMPRESAS (56, Médicos squad). Incidents: all at the root.

### E. Deploy Enablers (CFR denominator)

32 Enablers with "Deploy" in the title since 2024. Inconsistent naming: "Deploy 20250122", "[Deploy] 06/05/2026", "[Portal] Deploy - 23/06/2026", "[CMS] Deploy 18-06-2026", "Deploy 08/06/2026 - Validação em staging". The [Portal] vs [CMS] prefix separates front deploys from Drupal deploys, but only from May 2026 on and without rigor. Gap between Apr 2025 and Feb 2026 (different naming or a pause). 2026 cadence: roughly 2 to 4 deploys/month adding Portal and CMS together.

### F. Patients-front scope (investigated 2026-07-23)

The POC considers only the **patients team's front end**. How to isolate that scope on the board:

- **Teams = area path, not projects.** There is only one project (NOVO_EINSTEIN_BR) with two teams: `NOVO_EINSTEIN_BR` (root = patients) and `NOVO_EINSTEIN_BR\MEDICOS_EMPRESAS` (médicos). 2026 Bugs: 64 at the root, 56 in MEDICOS_EMPRESAS. 2026 Incidents: all 35 at the root. Separating patients is free and reliable: `[System.AreaPath] = 'NOVO_EINSTEIN_BR'`.
- **Title prefix is useless as a filter:** 107/120 Bugs and 21/35 Incidents have no prefix at all; the ones that do use varied spellings ([Portal], [Front], [Frontend], [CMS], [Unidades]...).
- **CreatedBy cannot separate front/back:** the QA (Laura) opens 71/120 Bugs, for both sides.
- **AssignedTo separates front from back within patients.** 2026 front devs: Lucas Gabriel da Silva, Samuel Soares da Rocha, Joao Carlos Rodrigues Dias, Edilson Aparecido Rodrigues. Of the 64 patients Bugs: 39 assigned to the 4 front devs; 18 to others (titles visibly CMS/back: Guilherme, Matheus Grigorio, Bruno Estima); 7 unassigned (blind spot of ~11%, mostly CMS/CK Editor, but at least 1 is front: Bug 394222 ZdsAccordion). Of the 35 Incidents: 27 assigned to the 4 front devs.
- Known weaknesses of the by-dev filter: unassigned items escape; reassignment changes classification retroactively; the dev list changes over time (keep it as versioned config in the POC repo, e.g. `team.yml`).

### G. Tags already present on Bugs/Incidents (discovered 2026-07-23)

104 of the 155 Bugs+Incidents of 2026 carry some tag. The relevant ones:

- **`Deploy DD-MM-YYYY` (24 Incidents + 8 Bugs in the patients area): it means "the fix SHIPS in deploy X", not "caused by deploy X".** Proven by the dates: Incident 392655 created 05-06 with tag `Deploy 06-07-2026`; 393089 created 09-06 (deploy 01-06 window) with the tag of the following deploy (23-06). It is the fix's vehicle. It does not work as causal attribution for CFR; it works as context for MTTR (when the fix was delivered).
- The deploy tags reveal Mar-Apr 2026 deploys (30-03, 01-04, 09-04, 22-04) **with no matching Enabler** on the board: tag-based records are more complete than Enabler-based records in early 2026, but they do not separate Portal from CMS.
- **`Front End (Bug)` (6) / `Back End (Bug)` (3) in the patients area:** front/back classification probably done by the QA, started May 2026. Coverage far too low to replace the AssignedTo filter (9/99), but it works as a tiebreaker for the `nao-classificado` pile: Bugs 394082 and 394083 (CK Editor, unassigned) carry the Front End (Bug) tag. Divergences to triage: 394275 and 394654 tagged FE but assigned to a back-end dev.
- Others: `MANUTENCAO` (34), `QA` (5), `Hotfix` (1).

### H. Severity is outside the QA standard (discovered 2026-07-23)

The QA presentation (Qualidade.pdf) standardizes three fields at bug/incident opening: Momento de Abertura (p.06), Bug Type (use only 5 of the 15 options), and Root Cause (RCA). There is even a "Bugs fora do padrão > Lista" checker on the dashboard, with rules 100% based on the document. **Severity appears in no slide and in none of the checker's rules.** Consequence: the 35 Incidents of 2026 have Severity filled, but each dev classified by feel, with no rubric. Evidence of the inconsistency: 380017 is "1 - Critical" with 34 days until the fix (either the severity was wrong, or it was critical yet went without a hotfix). MTTR segments by Severity, so it depends on a discipline that today does not formally exist.

## Metrics: feasibility revised after the investigation

| Metric | Operational formula | Source | Feasibility |
|--------|--------------------|--------|-------------|
| DRE | findings Momento 0-5 / (findings 0-5 + findings 6), per period | Momento de Abertura on Bugs+Incidents | High, WIQL query; retroactive OK for Bugs, incomplete for Incidents (49% missing momento; backfill 17 items) |
| CFR | [Portal] deploys with >= 1 attributed Incident / total [Portal] deploys | Deploy Enablers + Incident attribution | Medium; requires standardizing the Enabler name/tag and the Incident-to-deploy attribution (Related link or CreatedDate window between deploys). Failure WITHOUT a hotfix also counts: an open Incident suffices, no hotfix needed |
| MTTR | mean of (ClosedDate - CreatedDate) over Incidents | board timestamps | High for history; precision depends on state discipline |
| E2E flakiness | manual log per E2E round | the dev who runs it | Low automation; E2E is local (screenshot diff), no pipeline. Client does not allow touching the pipeline |
| Code quality | SonarQube or similar | to investigate | Separate track from this spike |

## Discussions and Decisions

### 2026-07-22 - Opening
Context recorded; initial feasibility analysis and visualization options (native Dashboards, Analytics/OData + Power BI).

### 2026-07-22 - Dev corrections
- Incident sits at the PBI/Enabler hierarchy level; it cannot be a child of an Enabler. Bug is Task-level and can be a child of an Incident or PBI. The pre/post boundary via hierarchy is murky.
- CFR via "Incident linked to the Enabler" was wrong as formulated: a reported failure without a hotfix is still a failure; and the hierarchical link does not exist.
- Pipeline: untouchable, the client has its own team for it. Discard any idea that depends on changing the pipeline.
- Dashboard: for team consumption (the client tracks via Monday, with automatic export).
- Stone-soup strategy: start with what's native to Azure, demonstrate value, then push for a license/better tool.

### 2026-07-22 - DRE source of truth (CONFIRMED by the dev)
**Decision:** DRE is computed 100% from the `Custom.HIAE_MOMENTO_ABERTURA` field on Bug and Incident work items. Hierarchy plays no part.
**Card-opening convention (to be announced to the team):**
- Pre-deploy finding (DEV, UAT, staging, Enabler tests): open a **Bug**, Momento de Abertura between 0 and 5.
- Post-production finding: open an **Incident**, Momento de Abertura = "6 - Pós Go Live". Never a Bug with momento 6.
- Current breaches to fix once the audit starts: 5 Bugs with momento 6 (reclassify) and 17 Incidents with no momento (backfill).
**Rationale:** field standardized by the QA, exists on both types, 100% filled on 2026 Bugs. The org's Quality Data Lab classifies Produção by the Incident type and lets Bugs with momento 6 fall into Homologação, which reinforces the need for the convention above.

### 2026-07-22 - CFR mechanics (no data-entry change)
**Proposed decision:** no new field, no change to the opening process. Two cheap disciplines:
1. **Denominator:** deploy Enabler identifiable by query. Standardize the title "[Portal] Deploy DD-MM-YYYY" (already the pattern since May 2026) and/or the `deploy-portal` tag on the Enabler.
2. **Numerator:** Incident -> deploy attribution in two layers: (a) automatic, by date window (Incident CreatedDate between deploy N and N+1 attributes it to N); (b) optional manual, a Related link from the Incident to the Enabler when the team knows the causing deploy is not the window's one (incident discovered late, after another deploy). Related works between any types and does not conflict with the hierarchy.
A reported failure without a hotfix counts: the Incident existing is enough.

### 2026-07-22 - Deploy identification standard via tags (CONFIRMED by the dev; refined 2026-07-23)

**Decision:** there are two tags of different natures; only one is ours.

| Tag | Where | Meaning | Status |
|-----|-------|---------|--------|
| `deploy-portal` (Tag A, ours) | ONLY on front PRODUCTION deploy Enablers | "this is a front production deploy; count it in the CFR denominator" | New team standard |
| `Deploy DD-MM-YYYY` (Tag B, pre-existing) | Bugs/Incidents | "this item's fix SHIPS in deploy X" (fix vehicle, finding G) | Already exists; unchanged; input to MTTR, not to CFR |

Rules:
- `deploy-portal` does NOT go on E2E, staging, CMS, spike, or infra Enablers. It is not "every Enabler": it is the denominator's stamp.
- Why a tag and not the title: real titles vary ("Deploy 04032026", "[Deploy] 06/05/2026", "[Portal] Deploy -06/07/2026"); querying by title breaks. A tag is exact and also solves duplicates (same deploy with 2 Enablers: only one gets the tag) and staging false positives.
- **Zero new tags on Bugs/Incidents.** Incident -> causing-deploy attribution is by date window (CreatedDate between deploy N and N+1), automatic; Related link only for the exception where the window would get it wrong.
- Failure without a hotfix counts for CFR: the Incident existing and being attributed is enough.
- Enabler title stays `[Portal] Deploy DD-MM-YYYY` (the title date is the deploy's canonical date).

### 2026-07-22 - Scope and path decisions
- **Scope:** only the NOVO_EINSTEIN_BR root AreaPath (excludes MEDICOS_EMPRESAS).
- **Retroactive window:** postponed, not the moment.
- **Org dashboard:** dev will talk to Laura (QA). The Quality Data Lab ETL is discontinued; see finding B2.
- **POC shape:** preferred direction = separate project (own repo) integrating board queries (az CLI) + AI analysis, producing the front team's weekly quality presentation. Fallback if everything fails: manual weekly az CLI queries.

### 2026-07-23 - Per-metric analysis: DRE (pre/post classification rule)

Dev's question: is an Incident always post go-live? Can a Bug be both? Or is classification solely and exclusively by Momento de Abertura?

**Decision (CONFIRMED by the dev on 2026-07-23): hybrid rule, type as the primary classifier, momento as the auditor.**

| Case | Classification | Note |
|------|----------------|------|
| Incident (any momento) | post | QA standard: Incident = PRD, always. Covers the 17 Incidents with momento unfilled |
| Bug with momento 0-5 | pre | Happy path, 100% filled on 2026 Bugs |
| Bug with momento 6 | post + `furo-convencao` flag | Leaked: should have been an Incident. Counts as post in DRE (otherwise DRE inflates) and shows up in the report as a breach to reclassify |
| Bug with no momento | pre + `dado-incompleto` flag | Does not occur today (0/120), but the rule must be total |

**Why not momento alone:** 49% of Incidents have no momento; they would be unclassifiable. **Why not type alone:** the 5 momento-6 Bugs would count as pre and inflate DRE. The hybrid rule is deterministic, robust to today's breaches, and doubles as a data-quality sensor (per-sprint flag counts go into the report).

**DRE formula within the scope:** per window (sprint or deploy): `pre / (pre + post)` with pre and post defined by the table above, over items passing the scope filter (decision below).

**What DRE needs from the board:** nothing new that's mandatory. Desirable: reclassify the 5 momento-6 Bugs (future audit) and keep the Bug 0-5 / Incident 6 convention announced (Task 398775).

### 2026-07-23 - POC scope: patients team's front end (CONFIRMED by the dev)

**Decision:** a funnel of 3 filters applied in sequence to every Bug/Incident entering the dataset:

1. **Patients team = Area Path.** Médicos and patients are not separate projects: one project (`NOVO_EINSTEIN_BR`) with two areas. Root = patients; `NOVO_EINSTEIN_BR\MEDICOS_EMPRESAS` = médicos. Filter: `[System.AreaPath] = 'NOVO_EINSTEIN_BR'` (exact). No dependence on tags, prefixes, or dev lists.
2. **Front within patients = AssignedTo.** An item counts as front if assigned to a dev on the current list (2026: Lucas Gabriel da Silva, Samuel Soares da Rocha, Joao Carlos Rodrigues Dias, Edilson Aparecido Rodrigues). The list lives as versioned config in the POC repo (`team.yml`), with validity periods; a dev joining/leaving edits the file, not the code. Empirical validation: 39/64 patients Bugs fall to the 4; the remaining 18 are visibly CMS/back.
3. **Unassigned = `nao-classificado` pile.** Nothing is dropped silently: unassigned items (7 Bugs in 2026, at least 1 of them front: 394222 ZdsAccordion) show up in the report with a count, for manual triage. Future discipline: no bug stays unassigned.

```
all 2026 items (155)
  └─ Filter 1: AreaPath = root            -> médicos out (99 left)
      └─ Filter 2: AssignedTo in the 4 devs -> back/CMS out (~66 left)
      └─ Filter 3: unassigned              -> "nao-classificado" pile (7)
```

Discarded: title prefix (89% of Bugs have no prefix) and CreatedBy (the QA opens most Bugs for both sides).

### 2026-07-23 - Per-metric analysis: CFR (simulation with real data)

**Date-window simulation** ([Portal] deploys Jun-Jul 2026, Incidents from the patients-front funnel):

| Deploy | Date | Front Incidents in the window | Failed? |
|--------|------|-------------------------------|---------|
| 390722 | 01-06 | 6 (mobile menu, formatting, Navegue por, iframe, CKEditor, TabGroup) | yes |
| 394210 | 23-06 | 1 (SEO structured data) | yes |
| 395747 | 06-07 | 3 (carousel color scheme, CLS regression, CardGallery hover) | yes |
| 397800 | 21-07 | 0 so far | window open |

Jun-Jul window CFR: 3/4 = 75%. Decisions made with the dev on 2026-07-23:

1. **RAW metric, a single numerator (CONFIRMED by the dev).** The two-numerator proposal (window vs confirmed regression) was discarded. Dev's rationale: the project is coupled, barely orthogonal, and has undocumented requirements; small changes EXPOSE latent bugs rather than create them, but that does not diminish the truth of the hotfix: production broke, the team scrambled. Whoever created the error is not even on the project anymore; the metric measures the system, not people. CFR = date window, raw (aligned with the DORA definition: a deploy that required remediation counts, no matter whether the bug was latent). The improvement levers are visual regression, E2E, and scanners, and the argument against "everything is the deploy's fault" becomes the TREND (CFR falling as the tests mature), not the causal excuse. The Related link remains only for its original purpose: fixing a wrong window (incident discovered after another deploy).
2. **Denominator = `deploy-portal` tag (CONFIRMED).** One Enabler per front production deploy. Solves the dedupe (394698/395747, same 06/07 deploy) and excludes staging (392938) and CMS. There may be several Enablers per sprint (E2E, staging, CMS, more than one deploy): the query counts only the tagged ones.
3. **CFR history starts June 2026.** The `Deploy DD-MM-YYYY` tags prove Mar-Apr deploys with no Enabler, but without separating Portal/CMS; retro stays postponed. The 25 Jan-May incidents count for DRE and MTTR, not for CFR.
4. **The latest deploy's window stays open** (right-censoring): the report marks the last window as "partial" until the next deploy closes it.

**What CFR needs from the board (it is the metric that asks for the most change):**
- `deploy-portal` tag on front production deploy Enablers. **DONE on 2026-07-23** for the Jun 2026+ retro: 390722 (01/06), 394210 (23/06), 395747 (06/07), 397800 (21/07), 398412 (27/07). Deliberately excluded: 394698 (duplicate of 06/07) and 392938 (staging). Query `Tags CONTAINS 'deploy-portal'` verified, returns exactly the 5. New deploys: tag at Enabler creation.
- Canonical deploy date = the DD-MM-YYYY date in the title (validated by the extraction script).
- One Enabler per production deploy (a duplicate becomes a data error detected by the script).
- On Bugs/Incidents: NO new mandatory tag. The date window attributes on its own; the existing `Deploy DD-MM-YYYY` tag ("fix ships in deploy X", finding G) stays as is, an input to MTTR, not to CFR.

### 2026-07-23 - Per-metric analysis: MTTR (CONFIRMED by the dev)

**Formula: `MTTR = ClosedDate - CreatedDate` of the Incident.** Nothing else.

Why ClosedDate stands for "fix in production": of the 24 Incidents of 2026 with the `Deploy DD-MM-YYYY` tag (Tag B, fix vehicle), 18 closed on the exact deploy day and 6 on the following day. The team's practice already is to close the Incident when the fix ships. Discarded alternatives: ResolvedDate (missing on 10/35, means "dev finished", not "restored") and the Tag B date (24/35, redundant with ClosedDate; kept as a consistency validator in the script).

**Display: two separate numbers, never a single average.**

| Segment | What it measures | 2026 front data |
|---------|------------------|-----------------|
| Sev 1-2 (critical MTTR) | Actual restoration agility | n=6: 0, 0, 1, 10, 13, 34 days |
| Sev 3-4 (time to fix) | Deploy cadence (~10d by design: a light item waits for the next scheduled deploy) | n=18, median ~14d |

Mixing them would hide the 0-day hotfixes inside the ~10-day cadence. Severity is the only retroactively filled field that approximates urgency; the direct measure ("did the fix ship outside the cycle?") has no history (only 1 Incident with the `Hotfix` tag, 381726). Going forward: standardize the `Hotfix` tag on emergency deploys so the cut can later migrate from the Severity proxy to the direct measure.

**Accessory rules (same raw philosophy as CFR):**
1. Open Incidents enter the panel as "open for X days", they never disappear (today: 390814 Committed open for 59 days, 395697 Waiting GM, 396085 QA).
2. CreatedDate is a proxy for "problem started" (it is the card's date, not the symptom's). Accepted, consistent with the no-adjudication decision.
3. **Contaminated history ACCEPTED (dev decision):** Severity classified without a rubric (finding H) contaminates past data. No retroactive audit for now; the contamination becomes a discussion slide in the POC presentation (an audit proposal stays as an option, not a prerequisite).

**What MTTR needs from the board: no structural change.** Dates and Severity already filled on 35/35. It depends on two habits becoming explicit rules: close the Incident when the fix reaches production (already the practice, proven above) and fill Severity with a clear rubric, which today does NOT exist (finding H). Severity rubric: proposal to bring to Laura (question 8 of the script), ideally entering her document and the "Bugs fora do padrão" checker rules.

### 2026-07-23 - Per-metric analysis: False Alarm (E2E) (CONFIRMED by the dev)

**Name: False Alarm.** The metric is NOT Playwright flakiness (failed-then-passed on retry, automatic `flaky` status). What the dev wants to measure: **tests that failed outright and whose manual triage (dry-run) concluded "product OK, test wrong"**, requiring intervention (a calibration task on the board). It measures the suite's maintenance cost and trustworthiness. On the panel it can be displayed inverted as "Suite precision" (real bugs / flagged failures), a positive framing for presentations; the dataset records the raw data.

**Triage definition** (done by the dev, outside the POC; human judgment, irreducible):

| Failure verdict | Destination |
|-----------------|-------------|
| False positive (test wrong) | counts in False Alarm + calibration task on the board |
| Real bug (product wrong) | Bug on the board (feeds DRE, does not count here) |
| Environment (qas down, test data changed) | does not count against the suite |

**Collection (dev decision, maximum simplicity):** the dev arrives with the triage numbers ready; the POC's registration skill **only appends to the history, nothing else**. No `results.json` parsing, no interactive triage in the skill (the automation proposal was discarded in favor of the simple routine). Log per run: date, environment (TEST_ENV), false-positive count, plus whatever else the dev brings.

**Suite technical context** (for reference): Playwright in `e2e/`, retries 1 local / 2 qas-prod-CI, JSON reporter already configured (`test-results/results.json`, overwritten on every run). Comparisons only within the same TEST_ENV (retries and timeouts differ per environment). The term "flakiness" stays reserved for Playwright's `flaky` status, which is not the POC's official metric.

**What False Alarm needs from the board: nothing.** History lives in the POC dataset. Expected trend: falling as the calibration tasks take effect; it is the "the suite is becoming autonomous" argument.

### 2026-07-24 - POC design (decisions closed by the dev)

**Repo created:** `git@github.com:lucas-gabriel-ciandt/einstein-quality-metrics-poc.git`

**Confirmed decisions:**

1. **Extraction skill with rich board context.** It carries a "board model" distilled from this spec: area path, `[Portal] Deploy DD-MM-YYYY` format, `deploy-portal` tag, Tag B as validator, DRE hybrid rule, Severity cut, ready-made WIQL. It becomes a `SKILL.md` + reference file in the POC repo.
2. **CSV dataset, no database. 2 files** (different grain per metric):
   - `deploys.csv`: 1 row per deploy | `enabler_id, data, bugs_antes, incidentes_pos, causou_incidente, false_alarms...` (DRE, CFR, False Alarm)
   - `incidentes.csv`: 1 row per incident | `id, severity, created, closed, deploy_tag` (raw MTTR, right-censoring preserved)
   - CSV versioned in git = audit trail for free.
3. **Visual:** CI&T + Einstein header/footer. White CI&T logo extracted from the template pptx (`image55.png`, 925x500, transparent). Einstein logos in the front project's `public/images/`. Dev's prototype: header, metric select menu (DRE, CFR, MTTR, False Alarm), shadcn/Recharts area chart with a period selector, caption, didactic description (reuse this spec's definitions). Colors/typography from the front project's tokens.
4. **X axis per deploy** (1 point per Enabler, labeled by date); the selector filters last N deploys or 3/6 months. MTTR with two series (sev 1-2 and sev 3-4). Sprint is a label; the deploy is the event.
5. **Stack:** Next with `output: 'export'` (static), TS as ESM, Biome with the original project's essential rules, Vitest, Tailwind with ported tokens, `.nvmrc`, scripts with parity (`dev`, `build`, `check-types`, `lint`, `lint:fix`, `test:run`). No i18n, no Storybook, no styled-components. README as presentation material.
6. **The E2E cycle runs once per deploy** (dev's observation): the False Alarm log is anchored to the deploy, same grain as `deploys.csv`.
7. **d3-dsv confirmed** (~4 KB, zero deps): CSV parse and serialization with correct escaping; needed because `incidentes.csv` will have a `title` column (commas) and the extraction skill writes CSV, not just reads it.
8. **False Alarm logging: a single number** (dev decision, POC simplicity). It counts ONLY the E2E tests that failed and were false positives. No TEST_ENV, no real bugs, no environment category. Single `false_alarms` column in `deploys.csv`. Accepted consequence: the "Suite precision" framing loses its denominator and leaves the POC (it can return later if the full triage starts being logged). Skill protocol: it asks for the deploy (default: most recent row with no value) + the number; if a value already exists, it shows it and asks for confirmation to overwrite; if the deploy is not in the CSV, it instructs running the extraction first.

## Consolidated design (2026-07-23)

The spike's deliverable is not a chart: it is the board becoming a reliable data source. Three-layer model (iceberg), top to bottom:

```
        plot at the review        <- visible, swappable, cheap
   ─────────────────────────
     dataset + computation        <- reusable: az CLI extraction, processing,
     (az CLI extraction)             DRE/CFR/MTTR materialized, history
   ─────────────────────────
   board standardization          <- foundation: deploy-portal tag,
   (opening conventions)             Bug 0-5 vs Incident 6, Related links
```

- The base sustains the middle: without standardization, processing becomes guesswork (17 Incidents without momento, 5 wrong Bugs, deploys without a standard name).
- The presentation is the disposable tip, but it is what forces the lower layers to stay disciplined: weekly consumption keeps the convention from rotting.
- The presentation layer is pluggable (local report today; Looker/Azure/Sheets tomorrow) as long as every metric materializes in the dataset first (registered anti-requirement).

## Planning

### Approach

Spike in Sprint 48 as a Spike-type work item on the board (converted from Enabler on 2026-07-23; the Spike type exists in the process), with child Tasks covering the three layers: QA alignment, board standardization, extraction + dataset, metric computation, first report at the review.

### Steps (mirrored in the board Tasks)

1. **Standardize and announce board conventions** | deploy-portal tag, Bug 0-5 vs Incident 6, Related link
2. **Data extraction** | WIQL queries via az CLI producing a tabular dataset with a documented schema
3. **Initial metric computation** | DRE, CFR, MTTR materialized in the dataset + history
4. **First quality report** | plot/presentation for the team's review

Note: the conversation with the QA (Laura) stayed off the board by the dev's decision (already started, it is ongoing). The question script remains recorded in this spec.

### Board (created 2026-07-23, Sprint 48)

| ID | Type | Title | Points |
|----|------|-------|--------|
| [398774](https://dev.azure.com/hiae/NOVO_EINSTEIN_BR/_workitems/edit/398774) | Spike | [Portal] Spike: Métricas de qualidade das entregas | 16 |
| [398775](https://dev.azure.com/hiae/NOVO_EINSTEIN_BR/_workitems/edit/398775) | Task | [Qualidade] Padronizar convenções de abertura e tags no board | 3 |
| [398776](https://dev.azure.com/hiae/NOVO_EINSTEIN_BR/_workitems/edit/398776) | Task | [Qualidade] Extrair dados do board para dataset tabular | 8 |
| [398777](https://dev.azure.com/hiae/NOVO_EINSTEIN_BR/_workitems/edit/398777) | Task | [Qualidade] Calcular DRE, CFR e MTTR com histórico por sprint | 5 |
| [398778](https://dev.azure.com/hiae/NOVO_EINSTEIN_BR/_workitems/edit/398778) | Task | [Qualidade] Gerar primeiro relatório de qualidade para a review | 5 |

### 2026-07-22 - Three possible paths for the POC (state of the discussion)

| Path | Description | Condition | Assessment |
|------|-------------|-----------|------------|
| A. Looker Studio | Reuse/replicate the Quality Data Lab | Access + making sense after the Laura conversation | Looker has no native connector for Azure Boards; the dead ETL was the bridge. Requires self-feeding (CSV/Sheets generated by us) |
| B. Native Azure | Shared queries + charts on a team Dashboard | None | Does not deliver the target metrics as numbers: charts only count/group, they do not compute DRE/CFR/MTTR. Works as an approximate visual (proportions by Momento de Abertura) |
| C. Own dash | Separate repo: az CLI queries + versioned history + AI analysis + weekly report | None | Immediate path while there is no access to anything else |

**Synthesis (agent's proposal):** C does not compete with A and B; it is the groundwork. In every scenario the data layer (WIQL queries via az CLI + ratio computation + history) must exist, because neither Looker (without an ETL) nor Azure charts compute the metrics. The post-Laura decision concerns only the presentation layer: feed a Looker, pin on Azure, or render our own report. Building C first wastes nothing.

### 2026-07-23 - Looker on our own and the POC architecture principle

Clarifications discussed:
- Looker Studio is free and collaborative: the dev can create their own report with a Google account (CI&T uses Workspace), without depending on permissions on the org's dash. Looker has calculated fields, so DRE/CFR/MTTR come out as real metrics.
- "Self-feeding": Looker has no connector for Azure Boards; the discontinued ETL was the bridge. Whoever picks Looker inherits the extraction maintenance anyway.

**POC architecture decision (proposed, to validate at planning):** three layers with a stable contract in the middle:

```
extraction (az CLI) -> versioned tabular dataset (contract) -> presentation
```

- Dataset = CSV/spreadsheet with a documented schema (id, type, momento de abertura, root cause, sprint, dates, attributed deploy, ...). It is the POC's central product.
- Pluggable presentation: today a weekly report (markdown/HTML + AI analysis) reading the dataset; tomorrow the same CSV synced to Google Sheets feeds Looker. Migration = connect the spreadsheet, zero rework on the extraction.
- Anti-requirement: metrics are never computed only "inside the presentation"; every number materializes in the dataset first.

### 2026-07-24 - POC plan (awaiting dev approval)

Repo: `git@github.com:lucas-gabriel-ciandt/einstein-quality-metrics-poc.git` (created by the dev, empty). The spec stays in this repo as the substrate; the POC repo gets its own CLAUDE.md distilled from it.

#### Repo structure

```
einstein-quality-metrics-poc/
├── .claude/skills/
│   ├── extract-board-metrics/     # SKILL.md + board-model.md (board model distilled from the spec)
│   └── register-false-alarm/      # SKILL.md (only appends the number)
├── data/
│   ├── deploys.csv
│   └── incidentes.csv
├── public/logos/                  # cit-navigate-change-white.png, einstein svgs
├── src/
│   ├── app/                       # App Router, single page
│   ├── components/                # Header, Footer, MetricSelect, MetricChart, ChartCaption, MetricDescription
│   ├── content/                   # didactic pt-br descriptions (reused from the spec)
│   └── lib/                       # csv.ts (d3-dsv), metrics.ts (computations), types.ts
├── biome.json  vitest.config.ts  next.config.ts (output: 'export')
├── tailwind.config  .nvmrc  README.md (presentation material)
```

Data: CSVs read via fs at build time (SSG, static export); the full dataset is handed to a client island that does period filtering and metric switching.

#### Final CSV schemas

`deploys.csv` (1 row per deploy; written by the extraction, except `false_alarms`):

| Column | Origin |
|--------|--------|
| `enabler_id`, `data`, `titulo` | Enabler with the `deploy-portal` tag |
| `bugs_antes` | Bugs in the window (DRE hybrid rule) |
| `incidentes_pos` | Incidents in the window |
| `dre` | derived: bugs_antes / (bugs_antes + incidentes_pos) |
| `causou_incidente` | 0/1 (CFR) |
| `false_alarms` | manual via the registration skill (empty until logged) |

`incidentes.csv` (1 row per incident; entirely from the extraction):

| Column | Origin |
|--------|--------|
| `id`, `titulo`, `severity`, `state` | Incident fields |
| `created`, `closed` | dates (empty closed = open, right-censoring) |
| `deploy_tag` | Tag B (`Deploy DD-MM-YYYY`), validator |
| `mttr_dias` | derived: closed - created (empty if open) |

#### Greenfield with reference (refinement 2026-07-24)

The repo is born clean (`create-next-app` + `shadcn init`), without copying whole configs from the front project. The current project is a reference for conventions, not a template. Explicit map:

**Port (adapted, not copied):**

| Item | Reference in the front project | In the greenfield |
|------|-------------------------------|-------------------|
| Node | engines >=22, .nvmrc 22 | .nvmrc 22 |
| Biome | 2.3, formatter (2 spaces, lineWidth 80, lf, attributePosition multiline), rule groups recommended/suspicious/correctness/security/a11y | same formatter and rule groups; WITHOUT the GritQL plugin (front-specific) |
| Vitest | 4.x + Testing Library, mocks in `tests/__mocks__/` | same version and mock convention |
| Visual tokens | `tailwind.config.js` (Zera) | subset (colors, typography, spacing used by the dash) |
| Project rules | CLAUDE.md | no barrel exports, no emojis, no inline comments, Tailwind-first; becomes the POC's CLAUDE.md (distilled from this spec) |
| Naming | docs/conventions/naming.md | same suffixes and casing |

**Do not inherit (deliberate):**

- The Azure DevOps `.npmrc`: the repo is GitHub, public npm registry. Inheriting the npmrc would break installs outside the VPN.
- styled-components, `@zera/components`, next-intl/i18n, Redis, Storybook, sharePointLegacy, proxy/middleware.
- CommonJS: the front project has no `type` in package.json; the POC is born with `"type": "module"` (dev requirement 5.A).

**Deliberate divergences from the front project (greenfield decides):**

- Tailwind v4 (current create-next-app/shadcn default) instead of the front's v3.4; the ported tokens are a small subset, translating them to `@theme` is trivial and avoids being born tied to the legacy format. If the dev prefers full parity, v3 is the fallback.
- Always latest stable versions at scaffold time; the front project is a floor, not a ceiling.

#### Steps

1. **Greenfield scaffold** | `create-next-app` (TS, App Router, Tailwind) + `shadcn init` + `output: 'export'` + apply the reference map above (.nvmrc, Biome, Vitest, type module, scripts with parity) + the POC's CLAUDE.md
2. **Data layer** | types.ts, csv.ts (d3-dsv), test fixtures
3. **Computation** | metrics.ts: per-deploy series for DRE, CFR (rolling), MTTR (2 series by severity + open items), False Alarm
4. **Visual shell** | Header/Footer with CI&T + Einstein logos, page layout
5. **Interaction** | MetricSelect + active-metric state + period selector (last N deploys / 3/6 months)
6. **Chart** | shadcn/Recharts area chart with token colors/typography, caption
7. **Content** | didactic descriptions of the 4 metrics (source: this spec)
8. **Extraction skill** | SKILL.md + board-model.md, WIQL, writing the 2 CSVs while preserving `false_alarms`, Tag B vs ClosedDate validation
9. **FA registration skill** | protocol defined in the 2026-07-24 decision (item 8)
10. **Seed + README** | run the extraction with real 2026 data, README as presentation material

#### Quantums

| Q | Steps | Scope | Tests |
|---|-------|-------|-------|
| Q1 Foundation + data | 1, 2, 3 | scaffold + lib | Vitest: parse, DRE/CFR/MTTR/FA, right-censoring, windows |
| Q2 Dashboard | 4, 5, 6, 7 | UI | behavior (metric switching, period filter); no CSS-class tests |
| Q3 Skills + seed | 8, 9, 10 | skills + real dataset | manual validation: real extraction vs numbers already mined in the spec (35 Incidents, 5 Enablers) |

#### Dependencies and risks

- Q3 depends on a logged-in `az` CLI; the spec's numbers (2026-07-22/23 mining) serve as the answer key to validate the extraction.
- Tailwind tokens: port the minimum needed (colors, typography, spacing in use), not the whole config.
- Logos: copy `image55.png` (white CI&T) from the scratchpad into the repo before the session expires; Einstein from the front project's `public/images/`.

## Pending backlog (added 2026-07-26, from the presentation planning)

### P1. Team filter: pacientes / medicos / todos, defaulting to todos

**Not a decision, a requirement.** One project, one repository, one deploy: both
teams ship in the same Portal deploy, so a dashboard that can only see one team
cannot answer "did this deploy break production". The team filter is a UI
control; `todos` is the default and the honest view.

**Implementation path, with the field reality verified on the board 2026-07-26.**

Bugs. AreaPath separates the two teams cleanly:

| Filter | Signal | Coverage |
|--------|--------|----------|
| pacientes | `[System.AreaPath] = 'NOVO_EINSTEIN_BR'` plus AssignedTo in the front dev list (`team.yml`) | AreaPath exact; AssignedTo is the front/back split within the team |
| medicos | `[System.AreaPath] = 'NOVO_EINSTEIN_BR\MEDICOS_EMPRESAS'` plus `[Microsoft.VSTS.Common.Activity] = 'Front End (BUG)'` | 93% within standard since Apr 2026: 26 Front End (BUG) plus 25 Back End (BUG) of 55, zero off-standard values |
| todos | no team predicate; front/back separation only | union of the two |

The medicos branch works precisely because that squad fills Tipo de Atividade
correctly (they have an embedded QA). Our side is at 45%, which is why the
pacientes branch leans on AssignedTo instead.

Incidents. **AreaPath does not separate them, and neither does Activity.**
Verified: all 35 Incidents of 2026 sit at `NOVO_EINSTEIN_BR`. Activity on
Incidents is 18 empty, 10 `TECNOLOGIA`, 5 `Front End (BUG)`, 1 `DEMANDA INTERNA`,
1 `Testing`, so only 5 of 35 are within standard. The one signal that works is
AssignedTo: Lucas 18, Samuel 7, Guilherme 5, Joao Carlos 2, Matheus Grigorio 2,
Jonatas 1. That is 27 of 35 to the four patients-front devs, the remainder to
back/CMS people. No Medicos front dev appears as an Incident assignee at all.

**Consequence to surface in the UI, not to hide:** under `medicos` or `todos`,
the bug-side numbers (DRE) are trustworthy, but the incident-side metrics (CFR
numerator, MTTR) have no team dimension today. Either render them project-wide
regardless of the filter, or label them as unfiltered. Do not fake a split the
data does not support.

`team.yml` also needs the Medicos front devs' Azure DevOps display names before
`todos` is meaningful for the AssignedTo paths. Git shows ThaisOR, phmelosilva
and Rodrigo Silva as active committers in the front repo since April 2026, with
80 to 96 commits each; their board identities still have to be collected.

Follow-up to raise in the board discussion: making Tipo de Atividade mandatory on
Incidents at opening is what would actually close this gap.

### P2. `Removed` bugs are being counted in DRE

**Defect.** The WIQL in `.claude/skills/extract-board-metrics/board-model.md` has
no state predicate, and `src/lib/transform.ts` reads `System.State` into the
record without ever filtering on it. So bugs discarded from the backlog enter the
extraction as pre-production findings and inflate DRE.

Size of the effect in 2026: 35 of 121 bugs are `Removed`. Reasons are 33 "Removed
from the backlog" and 2 "Moved out of state Resolved". Thirty of the 35 sit in
`MEDICOS_EMPRESAS` and 34 of the 35 were opened by the QA. Under today's
patients-only scope only 5 leak in, but **P1 makes this urgent**: with the `todos`
filter all 35 enter.

Recommendation: exclude `Removed` from the extraction. A bug that was thrown away
is not a defect that was found, so it belongs in neither side of the DRE ratio.
Keep `Done`, `Resolved`, `Committed` and `New`. If the count is wanted for
auditing, carry it as a separate reported number, never inside the ratio.

### P3. The first extraction was never run; the seed and the fixtures were invented

**Resolved on 2026-07-27, recorded here because it explains the numbers moving.**

The autonomous run never queried the board. It committed a `data/deploys.csv`
whose `bugs_antes` / `incidentes_pos` / `false_alarms` were made up, and
`tests/__mocks__/*.json` were hand-authored to match. The tells were uniform
`09:00:00Z` CreatedDates across all five Enablers and Incident ids derived from
their parent Enabler (`390722001`), which Azure DevOps never produces. The
journal and README both claimed "recorded `az` fixtures", which was false.

Because the fixtures were written to fit the code rather than the board, they
hid a defect that a single real query surfaced immediately: `DEPLOY_DATE_PATTERN`
was `/Deploy\s+(\d{2})-(\d{2})-(\d{4})/`, and **three of the five real deploy
titles** (`[Portal] Deploy - 01/06/2026`, `Deploy - 23/06/2026`,
`Deploy -06/07/2026`) threw `Deploy title without a DD-MM-YYYY date`. The
extraction crashed on the live board while the suite was green. The spec had
warned that titles vary; only the fixtures did not.

Fixed: the pattern accepts both separators, the fixtures are a real recording of
2026-07-27, `team.yml` now exists (it was referenced by `board-model.md` but had
never been created), and the CSVs hold the extracted numbers.

What moved, patients-front scope, 2026:

| Deploy | DRE seeded (invented) | DRE 1a extracao | DRE apos correcao de momento |
|--------|----------------------|-----------------|------------------------------|
| 390722 | 0.6667 | 0.4 | 0.4 |
| 394210 | 0.8889 | 0.5714 | 0.7143 |
| 395747 | 0.7692 | 0.0 | 0.5 |
| 397800 | 1.0 | 1.0 | 1.0 |

The invented seed flattered DRE in every window. The third column is the
2026-07-27 re-extraction after the dev corrected `momento` on four Bugs
mislabelled `6 - Pos Go Live` (394833, 395759, 395836 and 395771), which is the
`furo-convencao` case the hybrid rule exists to surface. Mean DRE over the closed
windows moves from 0.4929 to 0.6536.

Window 395747 (06/07) tops out at 0.5 and cannot reach 1.0: three Incidents
(395696, 395697, 396085) are attributed to it, and an Incident is post-production
by definition regardless of its momento.

### P4. Momento correction exposes a contradiction in the window attribution

**Open, not resolved.** Ordering the 06/07 window by creation time gives:
13:06 two Incidents at `6 - Pos Go Live`, then 14:38, 16:10 and 19:00 three Bugs
now at `0 - Teste na Sprint`. If the deploy had already shipped by 13:06, those
three bugs were opened after go live and cannot be sprint-testing finds. Both
readings cannot hold for the same deploy.

The likely resolution is that `momento` is relative to the item's own cycle, not
to this deploy: "Teste na Sprint" means found while testing the current sprint,
whose work ships in the **next** deploy. If so, `board-model.md`'s attribution
rule is inverted for pre-production findings. Today any finding created between
deploy N and N+1 is attributed to N, which is right for an Incident (a failure of
the deploy already in production) but wrong for a pre-production Bug, which is a
defect caught before deploy **N+1**.

Deciding this changes DRE in every window. Not acted on. CFR, MTTR "Crítico e Alto"
(0, 0, 1, 10, 13, 34) and the three open Incidents all reproduce the answer key
exactly. MTTR "Médio e Baixo" is n=18 with median 9d against the ~14d the manual
mining estimated.

Still open from this: there is no executable extraction runner. The
`extract-board-metrics` skill describes the flow in prose, so an agent must
hand-assemble the transform call each time. The 2026-07-27 run was done that
way. A committed script would make the extraction repeatable and reviewable.

## Open questions

1. Conversation with Laura (QA): script below.
2. CFR: do [CMS] deploys enter the team's denominator, or only [Portal]? (proposal: only [Portal]; [CMS] belongs to the Drupal team)
3. Validate the two CFR disciplines with the team (`deploy-portal` tag on the Enabler, optional Related link on Incidents).
4. Retroactive fill-in audit window: postponed, resume after the POC.
5. POC design (separate repo, query + AI, weekly presentation): sketch after the Laura conversation.

### Question script for the QA (Laura)

About the Quality Data Lab (Looker Studio):
1. Is the dash abandoned for good, or is there a plan to reactivate the ETL? Who decides, Marcos Celeguim?
2. If there is a plan: what is the timeline, and does our board (NOVO_EINSTEIN_BR) enter the extraction? Today the project filter zeroes the tiles.
3. If there is none: is the org migrating these metrics to another tool (Power BI, another Looker)? Or is each team on its own?

About the metrics the front team wants:
4. Does anyone in the org already compute DRE (as a ratio), Change Failure Rate, or MTTR per team? Or only the per-phase volume the dash used to show?
5. If the front team builds its own weekly report (board queries via az CLI + history), does the QA want to consume or contribute? Does it make sense to align with the RCA she already runs per sprint?

About opening conventions (validate with whoever defined the standard):
6. Confirm the rule: post-production = Incident with Momento "6 - Pós Go Live", never a Bug with momento 6? We found 5 Bugs with momento 6 and 17 Incidents without momento in 2026. Can we reclassify/backfill, or would that disturb any indicator of hers?
7. Is the "Nro do incidente origem" field (ServiceNow) mandatory in practice? Does it work as an extra MTTR source?
8. Severity stayed out of her document and of the "Bugs fora do padrão" checker rules. Would she agree to include a classification rubric (Critical/High/Medium/Low with objective criteria)? The front team's MTTR segments by Severity, and today each dev classifies by feel.

## Scope Changes

_None._

## References

- QA presentation: /home/lucas.gabriel/Documentos/apresentacao-qualidade/Qualidade.pdf (slide 6: Bug vs Incident opening standard; slides 16-18: organization dashboard)
- Organization dashboard: "[AlbertEinstein] Quality Data Lab" (Looker Studio; screenshots in /home/lucas.gabriel/Documentos/dash-qualidade/; contact: Marcos Celeguim)
- Example Enabler: 398412 "[Portal] Deploy 27-07-2026" (Sprint 48), children 398413-398416 (test Tasks), 398439/398498 (Bugs)
- Incident with an Enabler parent (exception): 381025 -> 380020
- Raw mining data: session scratchpad (bugs2026.json, incident_ids.txt)
- Skill: azdo-board-management (custom fields, root causes RC1-RC12)

## Metrics

- Files modified/created: spec only
