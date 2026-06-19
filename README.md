# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 3** — two fully interactive labs (Ion Propulsion + Fuel Cell Power System), real Finance/Assets pages, revenue+upkeep economy, role-gated navigation

## What this is

A working React mockup of an industrial LIMS/LOMS, doubling as a laboratory-building game.
Two modes share one underlying data model:

- **Operate** — light, sleek enterprise LIMS UI (Dashboard, Projects, Scheduling, Laboratories, Assets, Finance; Personnel still a stub)
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
- **Two fully interactive Build-mode rooms**: Ion Propulsion Laboratory and Fuel Cell Power System Laboratory — install benches (budget-gated, slot-limited, room-specific catalog), upgrade bench tiers, expand room capacity
- **Real economy**: daily facility upkeep deducted automatically on sim-day rollover (opex); completed tests generate revenue billed per bench cycle hour, with a reduced rate if the test failed
- **Role-gated navigation**: Test Engineer (Dashboard, Projects, Scheduling, Assets) vs. Laboratory Manager (Dashboard, Scheduling, Laboratories, Personnel, Finance), each with a different default landing page, per LIMS spec §4
- **Projects page** (Test Engineer): Project → DUT → Test Request hierarchy, expandable per project, now spanning both active projects (Ion Drive + Fuel Cell Power programs)
- **Scheduling page**: now facility-wide across both interactive rooms, grouped bench status, a Laboratory column in the test request table
- **Laboratories page** (Lab Manager): facility-wide resource dashboard across all 6 EPC rooms, utilization and bench status at a glance
- **Assets page**: full registry of all 11 benches across all 6 rooms — purchase date/cost, hours used, estimated lifetime consumed, live status
- **Finance page**: budget, lifetime revenue/opex/capex, net, daily upkeep, cost-per-completed-test, transactions by category, recent transaction log
- **Build-mode facility minimap is real, not decorative**: all 6 Electric Propulsion Test Center rooms are real Room + Bench entities; the minimap is clickable and navigates Build mode between rooms

## Known gaps / things to know before you click around

1. **Only Ion Propulsion Lab and Fuel Cell Power System Lab are fully interactive in Build mode.** The other 4 EPC rooms (Solar Array, HIL, SIL, Satellite Integration) are real Room/Bench data — shown accurately on the minimap, in the Laboratories page, and as a read-only Build-mode room view — but have no install/upgrade economy wired up yet, and their "running" benches aren't backed by real Test Request/Execution workflows. Clearly labeled "VIEW ONLY IN V1" in the UI.
2. **Personnel module is entirely absent** (by agreed scope) — `assignedPersonnelId` fields are not present yet; will need schema additions, not just UI, when this gets built.
3. **Dashboard page is still fairly basic** — facility-wide KPIs only, no per-room breakdown yet (Laboratories page covers that instead).
4. **Revenue billing rate ($145/hour of bench cycle time) is a simple flat placeholder**, not tied to project budgets or contract terms yet.
5. **No randomness in test results yet** (deferred by design — still deterministic).
6. No automated test suite — verification so far has been manual/scripted browser interaction during development, not unit tests.

## Project structure

```
src/
  data/        catalog.js (bench types, procedures), seed.js (initial state), selectors.js (derived data + finance helpers)
  engine/      testResults.js (deterministic scoring)
  context/     appReducer.js (all state transitions incl. upkeep + revenue), AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav (role-gated), DashboardPage, ProjectsPage, SchedulingPage (multi-room),
               LaboratoriesPage, AssetsPage, FinancePage, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (room navigation, multi-room interactivity), BenchTile, BuildPanel (room-scoped catalog), FacilityMap (real data, clickable)
```

## Planned next (per latest discussion)

- **Operator role**: hands-on, bench-level actions — running tests day-to-day, maintenance/calibration triggers — sitting "below" Test Engineer (test design/reports) and Lab Manager (resource/scheduling) in scope.
- **Report generation**: a separate view/overlay, likely pulling in generated or sample test data for richer report content.


