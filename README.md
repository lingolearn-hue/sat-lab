# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 6** — Buildings B (Chemical Propulsion Center) and C (Safety and Qualification Center) added: 9 new rooms, 2 newly interactive (Chemical Thruster Laboratory, Thermal Qualification Laboratory), facility-wide views now span all 15 rooms across 3 buildings

## What this is

A working React mockup of an industrial LIMS/LOMS, doubling as a laboratory-building game.
Two modes share one underlying data model:

- **Operate** — light, sleek enterprise LIMS UI (Dashboard, Operations, Projects, Scheduling, Laboratories, Statistics, Assets, Finance; Personnel still a stub)
- **Build** — dark, monospace, AutoCAD-style room/bench builder, now spanning Buildings A, B, and C with a grouped facility minimap

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

A pre-built `dist/` folder is included in this zip so you can preview without running `npm install` first — just open a static server on `dist/` (e.g. `npx serve dist`), or open `dist/index.html` directly for a quick look (some browsers restrict ES module loading from `file://`, so a local server is more reliable).

## Deploying to GitHub Pages

`vite.config.js` uses `base: './'` (relative paths), so the build works under any repo name/path without edits. This repo includes `.github/workflows/deploy.yml`, which builds and deploys to GitHub Pages automatically on every push to `main` (requires Pages enabled with "GitHub Actions" as the build source, in repo Settings → Pages).

## What's implemented

- Shared state via React Context + useReducer (`src/context/appReducer.js`)
- localStorage auto-save + JSON export/import (top-right menu, click the role chip)
- Real-time accelerated sim clock (1 real second = configurable sim minutes)
- Full Test Request workflow: Submitted → Approved → Scheduled → Running → Review → Completed, manual phase-advance (no auto-skip)
- Deterministic test result engine: DUT specs × bench tier, no randomness (`src/engine/testResults.js`)
- **Three buildings, 15 rooms total**, per the original spec: Building A (Electric Propulsion Test Center, 6 rooms), Building B (Chemical Propulsion Center, 3 rooms), Building C (Safety and Qualification Center, 6 rooms)
- **Four fully interactive Build-mode rooms** (install/upgrade economy + real test workflow): Ion Propulsion Laboratory, Fuel Cell Power System Laboratory, Chemical Thruster Laboratory, Thermal Qualification Laboratory — one per "family" of test domain, proving the architecture generalizes across propulsion, fuel cell, chemical thruster, and environmental qualification testing
- The other 11 rooms are real Room/Bench data (purchase cost, hours used, status) shown accurately everywhere — Laboratories page, Statistics page, Build-mode minimap — but without an install/upgrade economy or test-request workflow. Labeled "VIEW ONLY IN V1" in Build mode.
- Real economy: daily facility upkeep (opex across all 15 rooms), test completion revenue, all flowing through real transactions
- Three roles, fully role-gated nav + default landing page: Operator (Operations), Test Engineer (Projects), Laboratory Manager (Scheduling)
- Time-based maintenance & calibration lifecycle: running benches accrue wear; overdue maintenance auto-takes a bench out of service; Operator can Perform Maintenance/Calibrate (costs money, blocked mid-test)
- Report generation: per-test and per-project PDF reports with templated (non-random) narrative text, inline overlay + browser Print + downloadable PDF (jsPDF)
- Statistics page: facility-wide KPIs, utilization trend over sim-days, daily throughput, live utilization-by-laboratory comparison across all 15 rooms (click to drill into any room's own trend), pass/fail breakdown, throughput-by-procedure
- Channel-level fuel cell visualization: Fuel Cell Stack Benches render every individual channel (96 at Tier 1, 192 at Tier 2) as a colored square grouped in sixes, derived deterministically from the bench's real status/maintenance state
- **Scheduling page now spans all 4 interactive rooms** across all 3 buildings — grouped bench status, a Laboratory column, facility-wide KPIs
- **Projects page now spans all 4 active projects**: SAT-004 (Ion Drive), SAT-005 (Fuel Cell Power), SAT-006 (Chemical Thruster), SAT-007 (Thermal Qualification)
- Laboratories page, Assets page, Finance page — all real, not stubs, all spanning all 3 buildings (Personnel is the only remaining stub)

## Known gaps / things to know before you click around

1. **11 of 15 rooms are view-only in Build mode.** Only Ion Propulsion, Fuel Cell Power System, Chemical Thruster, and Thermal Qualification labs have a real install/upgrade economy and test workflow. The rest show accurate Room/Bench data everywhere but can't be built on yet.
2. **No building-level switcher/tab yet.** Build mode's primary room-picker is still the facility minimap (grouped by building) rather than a dedicated building tab — by design for this round, per discussion.
3. **Personnel module is entirely absent** (by agreed scope).
4. **Statistics history starts from zero on a fresh save** — no backfilled fake history.
5. **Channel statuses are deterministic, not simulated per-channel physics.**
6. **Maintenance/calibration actions are instant**, not timer-gated like test execution phases.
7. **Report narratives are templated, not LLM-generated.**
8. **Bundle size**: now over 1MB after jsPDF + recharts. Code-splitting still on the backlog.
9. **Revenue billing rate ($145/hour of bench cycle time) is a simple flat placeholder.**
10. **No randomness in test results** (deferred by design).
11. No automated test suite — verification has been manual/scripted browser interaction during development.
12. **Print stylesheet for reports is written but not yet visually confirmed** in a real print preview (still parked).

## Project structure

```
src/
  data/        catalog.js (bench types, procedures, maintenance thresholds, channel counts — now covering all 4 interactive rooms),
               seed.js (initial state — 3 buildings, 15 rooms, 4 projects),
               selectors.js (derived data + finance + maintenance + channel + statistics helpers),
               reports.js (report content builder), reportPdf.js (jsPDF export)
  engine/      testResults.js (deterministic scoring — now covering chemical thruster + thermal qualification procedures)
  context/     appReducer.js (all state transitions incl. wear accrual, upkeep, revenue, maintenance actions, daily snapshots),
               AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav (role-gated, 3 roles), DashboardPage, OperationsPage, ProjectsPage (4 projects),
               SchedulingPage (4-room facility-wide), LaboratoriesPage (15 rooms, grouped by building),
               StatisticsPage, AssetsPage, FinancePage, ReportOverlay, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (room navigation across 3 buildings), BenchTile (channel map for fuel cell benches),
               BuildPanel (room-scoped catalog), FacilityMap (all 15 rooms grouped by building, clickable)
```

## Planned next (per latest discussion)

- Verify print stylesheet output together (parked)
- Consider code-splitting to address bundle size
- Possible: building-level switcher/tab for Build mode navigation
- Possible: timer-gate maintenance/calibration actions
- Personnel module — still the most obvious remaining LIMS/LOMS gap





