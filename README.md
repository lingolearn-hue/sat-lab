# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 2** — vertical slice (Ion Propulsion Lab, fully interactive) + facility-wide context (5 more EPC labs, view-only) + role-gated navigation

## What this is

A working React mockup of an industrial LIMS/LOMS, doubling as a laboratory-building game.
Two modes share one underlying data model:

- **Operate** — light, sleek enterprise LIMS UI (Dashboard, Projects, Scheduling, Laboratories, stub pages for Assets/Personnel/Finance)
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
- Build mode: install benches (budget-gated, slot-limited), upgrade bench tiers, expand room capacity — for the Ion Propulsion Laboratory
- **Role-gated navigation**: Test Engineer (Dashboard, Projects, Scheduling, Assets) vs. Laboratory Manager (Dashboard, Scheduling, Laboratories, Personnel, Finance), each with a different default landing page, per LIMS spec §4
- **Projects page** (Test Engineer): Project → DUT → Test Request hierarchy, expandable per project
- **Laboratories page** (Lab Manager): facility-wide resource dashboard across all 6 EPC rooms, utilization and bench status at a glance
- **Build-mode facility minimap is now real, not decorative**: all 6 Electric Propulsion Test Center rooms are real Room + Bench entities; the minimap is clickable and navigates Build mode between rooms

## Known gaps / things to know before you click around

1. **Only the Ion Propulsion Laboratory is fully interactive in Build mode.** The other 5 EPC rooms (Fuel Cell Power System, Solar Array, HIL, SIL, Satellite Integration) are real Room/Bench data — shown accurately on the minimap, in the Laboratories page, and as a read-only Build-mode room view — but have no install/upgrade economy wired up yet, and their "running" benches aren't backed by real Test Request/Execution workflows (no DUT, no timer, no completable result). This is clearly labeled "VIEW ONLY IN V1" in the UI.
2. **Personnel module is entirely absent** (by agreed scope) — `assignedPersonnelId` fields are not present yet; will need schema additions, not just UI, when this gets built.
3. **Dashboard/Assets/Finance pages are still stubs.**
4. **No randomness in test results yet** (deferred by design — v1 agreed to be deterministic).
5. No automated test suite — verification so far has been manual/scripted browser interaction during development, not unit tests.

## Project structure

```
src/
  data/        catalog.js (bench types, procedures), seed.js (initial state), selectors.js (derived data helpers)
  engine/      testResults.js (deterministic scoring)
  context/     appReducer.js (all state transitions), AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav (role-gated), DashboardPage, ProjectsPage, SchedulingPage, LaboratoriesPage, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (room navigation), BenchTile, BuildPanel, FacilityMap (real data, clickable)
```

