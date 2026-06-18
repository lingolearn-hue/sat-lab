# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 1** — vertical slice: Ion Propulsion Laboratory (Electric Propulsion Test Center / Building A)

## What this is

A working React mockup of an industrial LIMS/LOMS, doubling as a laboratory-building game.
Two modes share one underlying data model:

- **Operate** — light, sleek enterprise LIMS UI (Dashboard, Scheduling, stub pages for Projects/Laboratories/Assets/Personnel/Finance)
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

`vite.config.js` uses `base: './'` (relative paths), so the build works under any repo name/path without edits. Typical flow: build, then publish the `dist/` folder to your `gh-pages` branch or Pages source folder of choice.

## What's implemented (v1)

- Shared state via React Context + useReducer (`src/context/appReducer.js`)
- localStorage auto-save + JSON export/import (top-right menu, click the role chip)
- Real-time accelerated sim clock (1 real second = configurable sim minutes)
- Full Test Request workflow: Submitted → Approved → Scheduled → Running → Review → Completed
  - Phases run on a timer; advancing to the next phase always requires a manual click (no auto-skip)
- Deterministic test result engine: DUT specs × bench tier, no randomness (`src/engine/testResults.js`)
- Build mode: install benches (budget-gated, slot-limited), upgrade bench tiers, expand room capacity
- Role switcher (Test Engineer / Laboratory Manager) — **chip only**, see Known Gaps

## Known gaps / things to know before you click around

1. **Role switching doesn't change available screens yet.** Both roles currently see identical pages. The original spec calls for role-differentiated views; this needs follow-up work.
2. **The Build-mode facility minimap is decorative.** The five "other rooms" (Fuel Cell Power Lab, Solar Array Lab, HIL Lab, SIL Lab, Satellite Integration) shown next to Ion Propulsion Lab are hardcoded placeholder text, not real state — see the comment in `src/components/build/FacilityMap.jsx`. Only the Ion Propulsion Lab is a real, simulated room in v1.
3. **Minor cosmetic inconsistency:** some event feed log lines show lowercase entity IDs (e.g. `tr-0229`) while the table UI shows uppercase (`TR-0229`). Not fixed yet.
4. **Personnel module is entirely absent** (by agreed scope) — `assignedPersonnelId` fields are not present yet; will need schema additions, not just UI, when this gets built.
5. **Dashboard/Projects/Laboratories/Assets/Finance pages are stubs.** Only Dashboard and Scheduling are fully built out for v1.
6. No automated test suite — verification so far has been manual/scripted browser interaction during development, not unit tests.

## Project structure

```
src/
  data/        catalog.js (bench types, procedures), seed.js (initial state), selectors.js (derived data helpers)
  engine/      testResults.js (deterministic scoring)
  context/     appReducer.js (all state transitions), AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav, DashboardPage, SchedulingPage, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell, BenchTile, BuildPanel, FacilityMap
```
