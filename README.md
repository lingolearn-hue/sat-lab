# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 4** — Operator role with time-based maintenance/calibration lifecycle, PDF report generation (per-test and per-project)

## What this is

A working React mockup of an industrial LIMS/LOMS, doubling as a laboratory-building game.
Two modes share one underlying data model:

- **Operate** — light, sleek enterprise LIMS UI (Dashboard, Operations, Projects, Scheduling, Laboratories, Assets, Finance; Personnel still a stub)
- **Build** — dark, monospace, AutoCAD-style room/bench builder

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
- Full Test Request workflow: Submitted → Approved → Scheduled → Running → Review → Completed
  - Phases run on a timer; advancing to the next phase always requires a manual click (no auto-skip)
- Deterministic test result engine: DUT specs × bench tier, no randomness (`src/engine/testResults.js`)
- Two fully interactive Build-mode rooms: Ion Propulsion Laboratory and Fuel Cell Power System Laboratory — install benches, upgrade tiers, expand room capacity
- Real economy: daily facility upkeep (opex), test completion revenue, all flowing through real transactions
- **Three roles, fully role-gated nav + default landing page**, per LIMS spec §4:
  - **Operator**: Dashboard, Operations, Assets — hands-on bench-level view
  - **Test Engineer**: Dashboard, Projects, Scheduling, Assets — test design + reports
  - **Laboratory Manager**: Dashboard, Scheduling, Laboratories, Personnel, Finance — resource/scheduling
- **Time-based maintenance & calibration lifecycle** (Operator role): running benches accrue wear hours; crossing a threshold marks maintenance/calibration "due," and ignoring it long enough automatically takes the bench `out_of_service`. Operator can Perform Maintenance / Calibrate (costs money, resets the relevant hour counter) — blocked while the bench is mid-test, consistent with "can't pull a bench out from under a running test."
- **Operations page**: My Tasks (benches needing attention), Running Tests, Equipment Status table — the Operator's primary hands-on screen
- **Report generation**: per-test and per-project reports, built from real completed-test data with a templated (non-random) narrative describing the actual pass/fail margin. Delivered two ways — an inline overlay (view + browser Print) and a one-click downloadable PDF (via jsPDF). Accessible from the Projects page: "View →" on any completed test request row, "View Report" on any project with at least one completed test.
- Projects page, Laboratories page, Assets page, Finance page — all real, not stubs (Personnel is the only remaining stub)

## Known gaps / things to know before you click around

1. **Only Ion Propulsion Lab and Fuel Cell Power System Lab are fully interactive in Build mode.** The other 4 EPC rooms (Solar Array, HIL, SIL, Satellite Integration) are real Room/Bench data — visible on the minimap, Laboratories page, and Operations page — but have no install/upgrade economy and aren't backed by real Test Request workflows. Labeled "VIEW ONLY IN V1" in Build mode.
2. **Personnel module is entirely absent** (by agreed scope).
3. **Maintenance/calibration actions are instant**, not timer-gated like test execution phases — a deliberate simplification for v1; could be made consistent with the test-phase pattern later if desired.
4. **Report narratives are templated, not LLM-generated** — they describe the real computed numbers in fixed sentence structures, not free-form prose. This was a deliberate choice to keep report content honest and reproducible rather than inventing detail.
5. **Bundle size**: adding jsPDF (plus its `html2canvas`/DOMPurify dependencies) pushed the main JS bundle to ~680KB unminified-equivalent. Works fine for this mockup's purposes but would be worth revisiting (code-splitting the report module, or a lighter PDF approach) if load time becomes a concern.
6. **Revenue billing rate ($145/hour of bench cycle time) is a simple flat placeholder**, not tied to project budgets or contract terms.
7. **No randomness in test results yet** (deferred by design — still deterministic).
8. No automated test suite — verification has been manual/scripted browser interaction during development, not unit tests.

## Project structure

```
src/
  data/        catalog.js (bench types, procedures, maintenance thresholds), seed.js (initial state),
               selectors.js (derived data + finance + maintenance helpers), reports.js (report content builder),
               reportPdf.js (jsPDF export)
  engine/      testResults.js (deterministic scoring)
  context/     appReducer.js (all state transitions incl. wear accrual, upkeep, revenue, maintenance actions),
               AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav (role-gated, 3 roles), DashboardPage, OperationsPage (Operator), ProjectsPage (+ reports),
               SchedulingPage (multi-room), LaboratoriesPage, AssetsPage, FinancePage,
               ReportOverlay, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (room navigation, multi-room interactivity), BenchTile, BuildPanel (room-scoped catalog), FacilityMap (real data, clickable)
```

## Planned next (per latest discussion)

- Verify/polish print stylesheet output (written but not visually confirmed in a real print preview)
- Consider code-splitting the report/PDF module to address bundle size
- Possible: timer-gate maintenance/calibration actions to match the test-phase pattern



