# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 5** — Statistics screen (facility + per-room drill-down, trend charts), channel-level colored visualization for fuel cell stack benches

## What this is

A working React mockup of an industrial LIMS/LOMS, doubling as a laboratory-building game.
Two modes share one underlying data model:

- **Operate** — light, sleek enterprise LIMS UI (Dashboard, Operations, Projects, Scheduling, Laboratories, Statistics, Assets, Finance; Personnel still a stub)
- **Build** — dark, monospace, AutoCAD-style room/bench builder, now with a channel-level diagnostic view for fuel cell stack benches

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
- Two fully interactive Build-mode rooms: Ion Propulsion Laboratory and Fuel Cell Power System Laboratory
- Real economy: daily facility upkeep (opex), test completion revenue, all flowing through real transactions
- Three roles, fully role-gated nav + default landing page: Operator (Operations), Test Engineer (Projects), Laboratory Manager (Scheduling)
- Time-based maintenance & calibration lifecycle: running benches accrue wear; overdue maintenance auto-takes a bench out of service; Operator can Perform Maintenance/Calibrate (costs money, blocked mid-test)
- Report generation: per-test and per-project PDF reports with templated (non-random) narrative text, inline overlay + browser Print + downloadable PDF (jsPDF)
- **Statistics page** (new): facility-wide KPIs, utilization trend over sim-days, daily throughput (tests completed/day), live utilization-by-laboratory comparison (click a bar or label to drill into that room's own trend history), pass/fail breakdown, throughput-by-procedure. History accumulates one snapshot per sim-day from when you start playing — there's no backfilled fake history, so trend charts are empty until enough sim-time has passed (by design, consistent with not inventing data).
- **Channel-level fuel cell visualization** (new): Fuel Cell Stack Benches render as a full-width tile with every individual channel (96 at Tier 1, 192 at Tier 2) shown as a small colored square, grouped visually in sixes. Channel color is derived deterministically from the bench's real status and maintenance state — active (orange) while running and healthy, standby/offline (cyan/gray) while idle, with a visible pocket of standby/fault channels appearing if the bench's maintenance is due or overdue. Propulsion-style benches (component/endurance/perf. mapping) are unaffected and keep the original compact single-unit tile.
- Projects, Laboratories, Assets, Finance pages — all real, not stubs (Personnel is the only remaining stub)

## Known gaps / things to know before you click around

1. **Only Ion Propulsion Lab and Fuel Cell Power System Lab are fully interactive in Build mode.** The other 4 EPC rooms are real Room/Bench data (visible on the minimap, Laboratories page, Statistics page, and Operations page) but have no install/upgrade economy and aren't backed by real Test Request workflows. Labeled "VIEW ONLY IN V1".
2. **Personnel module is entirely absent** (by agreed scope).
3. **Statistics history starts from zero on a fresh save.** If you want to see populated trend charts quickly, let the sim clock run for a few in-app minutes (it's accelerated by default) rather than expecting backfilled data.
4. **Channel statuses are deterministic, not simulated per-channel physics** — they're derived from the bench's existing status/maintenance fields, not independently tracked failure events. A channel doesn't have its own lifecycle; the bench does, and channels visualize that.
5. **Maintenance/calibration actions are instant**, not timer-gated like test execution phases.
6. **Report narratives are templated, not LLM-generated.**
7. **Bundle size**: now over 1MB after adding jsPDF and recharts. Works fine for this mockup's purposes; code-splitting would be the right fix if load time becomes a concern (still on the backlog, not yet done).
8. **Revenue billing rate ($145/hour of bench cycle time) is a simple flat placeholder.**
9. **No randomness in test results** (deferred by design — still deterministic).
10. No automated test suite — verification has been manual/scripted browser interaction during development.
11. **Print stylesheet for reports is written but not yet visually confirmed** in a real print preview (parked for a joint check next session).

## Project structure

```
src/
  data/        catalog.js (bench types, procedures, maintenance thresholds, channel counts), seed.js (initial state),
               selectors.js (derived data + finance + maintenance + channel + statistics helpers),
               reports.js (report content builder), reportPdf.js (jsPDF export)
  engine/      testResults.js (deterministic scoring)
  context/     appReducer.js (all state transitions incl. wear accrual, upkeep, revenue, maintenance actions, daily snapshots),
               AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav (role-gated, 3 roles), DashboardPage, OperationsPage, ProjectsPage (+ reports),
               SchedulingPage (multi-room), LaboratoriesPage, StatisticsPage (new), AssetsPage, FinancePage,
               ReportOverlay, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (room navigation), BenchTile (channel map for fuel cell benches),
               BuildPanel (room-scoped catalog), FacilityMap (real data, clickable)
```

## Planned next (per latest discussion)

- Verify print stylesheet output together (parked, see Known Gaps #11)
- Consider code-splitting to address bundle size
- Possible: timer-gate maintenance/calibration actions
- Personnel module, 3rd interactive lab, or Building B (Chemical Propulsion) — not yet decided which is next




