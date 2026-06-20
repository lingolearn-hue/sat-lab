# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 9** — Building switcher: Building A restructured into 3 floors (A1/A2/A3), new Facility Overview entry screen, prev/next arrow navigation between all 5 buildings/floors

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

## Facility structure

```
Satellite Powertrain Test Department
├── Building A — Electric Propulsion Test Center
│   ├── Floor A1: Ion Propulsion Lab ★, Solar Array Lab, Satellite Integration Lab
│   ├── Floor A2: Fuel Cell Power System Lab ★, Thermal Qualification Lab ★
│   └── Floor A3: Hardware-in-the-Loop Lab, Software-in-the-Loop Lab, Office
├── Building B — Chemical Propulsion Center
│   └── Chemical Thruster Lab ★, Propellant System Lab, Propulsion System Integration Lab
└── Building C — Safety and Qualification Center
    └── Preconditioning Lab, Electrical Fault Lab, EMC Lab, Shock and Impact Lab, Fire and Hazard Lab
```
★ = fully interactive (install/upgrade economy + real Test Request workflow + personnel staffing).
Thermal Qualification Lab moved from Building C to Floor A2 in this release — Building C is now 5 rooms, not 6.
"Office" is a new administrative room on Floor A3 with no benches.

In Build mode: the **Facility Overview** screen shows all 5 buildings/floors as compact cards (A1/A2/A3 stacked
under Building A, B and C beside them). Click any card to enter its detail view, which shows every room on
that floor/building at once. Prev/next arrows (‹ ›) cycle through all 5 units in order; "← Overview" returns
to the overview screen at any time.

## What's implemented

- Shared state via React Context + useReducer (`src/context/appReducer.js`)
- localStorage auto-save + JSON export/import (top-right menu, click the role chip)
- Real-time accelerated sim clock (1 real second = configurable sim minutes)
- Full Test Request workflow: Submitted → Approved → Scheduled → Running → Review → Completed, manual phase-advance (no auto-skip)
- Deterministic test result engine: DUT specs × bench tier, no randomness (`src/engine/testResults.js`)
- **Three buildings, 16 rooms total**: Building A (Electric Propulsion Test Center, 8 rooms across 3 floors: A1/A2/A3), Building B (Chemical Propulsion Center, 3 rooms), Building C (Safety and Qualification Center, 5 rooms — Thermal Qualification moved to Floor A2)
- **Four fully interactive Build-mode rooms** (install/upgrade economy + real test workflow): Ion Propulsion Laboratory, Fuel Cell Power System Laboratory, Chemical Thruster Laboratory, Thermal Qualification Laboratory — one per "family" of test domain, proving the architecture generalizes across propulsion, fuel cell, chemical thruster, and environmental qualification testing
- The other 11 rooms are real Room/Bench data (purchase cost, hours used, status) shown accurately everywhere — Laboratories page, Statistics page, Build-mode minimap — but without an install/upgrade economy or test-request workflow. Labeled "VIEW ONLY IN V1" in Build mode.
- Real economy: daily facility upkeep (opex across all 16 rooms), test completion revenue, all flowing through real transactions
- Three roles, fully role-gated nav + default landing page: Operator (Operations), Test Engineer (Projects), Laboratory Manager (Scheduling)
- Time-based maintenance & calibration lifecycle: running benches accrue wear; overdue maintenance auto-takes a bench out of service; Operator can Perform Maintenance/Calibrate (costs money, blocked mid-test)
- Report generation: per-test and per-project PDF reports with templated (non-random) narrative text, inline overlay + browser Print + downloadable PDF (jsPDF)
- Statistics page: facility-wide KPIs, utilization trend over sim-days, daily throughput, live utilization-by-laboratory comparison across all 16 rooms (click to drill into any room's own trend), pass/fail breakdown, throughput-by-procedure
- Channel-level fuel cell visualization: Fuel Cell Stack Benches render every individual channel (96 at Tier 1, 192 at Tier 2) as a colored square grouped in sixes, derived deterministically from the bench's real status/maintenance state
- **Building switcher** (new): Build mode now has a 2-tier navigation — a Facility Overview entry screen (5 compact cards: Floors A1/A2/A3 stacked under Building A, B and C beside them on desktop) and a building/floor detail screen showing every room on that floor at once. Prev/next arrows cycle through all 5 units in a fixed order with wraparound; "← Overview" returns to the entry screen at any time.
- **Audit Log** (new): every dispatched, state-changing action gets one immutable, append-only entry — role, sim time, real timestamp, and a human-readable summary. No automatic compliance stamps or signatures (deliberately — that would misrepresent what this is); it's a record of what happened, and accountability for it rests with whoever took the action, not with a fake "verified" badge. Capped at 2,000 entries (practical storage limit, not a deliberate truncation), exportable as CSV or JSON. Visible to all three roles.
- **Consumables / Inventory** (new): 4 tracked items — Calibration Gas and Coolant (shared across multiple interactive rooms), Xenon Propellant (Ion Propulsion-specific), Hydrazine Propellant (Chemical Thruster-specific). Stock is consumed automatically when a test completes in a room that uses that item; a one-time low-stock event fires when stock crosses below the reorder threshold. Manual Reorder action costs money and restocks, flowing into Finance as a real "Consumables" opex category.
- **Personnel** (new): a small roster across the 4 interactive labs, one qualification domain per person (Ion Propulsion, Fuel Cell, Chemical Thruster, Thermal Qualification). Each domain has a per-person capacity reflecting how hands-on the work is — Chemical Thruster supervision caps at 4 concurrent tests (hazardous/hands-on), Fuel Cell channel monitoring caps at 50 (mostly passive). Scheduling a test now requires BOTH an idle bench AND a qualified person with spare capacity — a bench can be free while every qualified person is at capacity, genuinely blocking the schedule, independent of the bench-availability constraint that already existed.
- **Scheduling page now spans all 4 interactive rooms** across all 3 buildings — grouped bench status, a Laboratory column, facility-wide KPIs
- **Projects page now spans all 4 active projects**: SAT-004 (Ion Drive), SAT-005 (Fuel Cell Power), SAT-006 (Chemical Thruster), SAT-007 (Thermal Qualification)
- Laboratories page, Assets page, Finance page — all real, not stubs, all spanning all 3 buildings (Personnel is the only remaining stub)

## LIMS/LOMS function coverage

Cross-referencing what modern LIMS/LOMS platforms typically provide against what's actually implemented here:

| Function | Status |
|---|---|
| Sample/DUT tracking | ✅ |
| Test/protocol workflow automation | ✅ |
| Scheduling & resource allocation | ✅ |
| Equipment/asset tracking | ✅ |
| Equipment maintenance & calibration management | ✅ (reactive, not predictive) |
| Report generation | ✅ |
| Role-based access | ✅ (3 of the spec's 5 roles) |
| Statistics / analytics / trend dashboards | ✅ |
| Financial/billing integration | ✅ |
| Multi-site / multi-building support | ✅ (added v6) |
| Audit trail | ✅ (added v7) — immutable, append-only, every dispatched action, CSV/JSON export. No automatic signatures/stamps by design — see Known Gaps. |
| Inventory/consumables tracking | ✅ (added v7) — 4 tracked consumables, automatic consumption on test completion, manual reorder, real Finance category |
| Staff/personnel management | ✅ (added v8) — qualification-based capacity constraint that can independently block scheduling, not just a static directory |
| Document/data integrity (e-signatures, 21 CFR Part 11-style controls) | ❌ deliberately out of scope — see note below |
| Mobile/responsive access | ❌ not implemented (spec calls for this explicitly) |
| Instrument data interfacing | ❌ not applicable (no real instruments) |

## Known gaps / things to know before you click around

1. **12 of 16 rooms are view-only in Build mode.** Only Ion Propulsion, Fuel Cell Power System, Chemical Thruster, and Thermal Qualification labs have a real install/upgrade economy and test workflow. The rest show accurate Room/Bench data everywhere but can't be built on yet.
2. **Building A's "3 floors" is a v1-specific reframing, not in the original lab spec.** The original spec describes Building A as one flat building with 6 labs; this release splits it into 3 floors per direct discussion, and adds a new "Office" room with no real-world spec basis. Buildings B and C are unchanged from the original spec except that Thermal Qualification Laboratory physically moved from C to Floor A2.
3. **Personnel is a fixed roster, no hiring mechanic.** The spec mentions "Personnel hiring" as a future simulation concept; for v1 the roster is seeded and static — you can't hire more staff to relieve a capacity bottleneck, only wait for existing assignments to free up. Deliberately deferred per discussion.
4. **Statistics history starts from zero on a fresh save** — no backfilled fake history.
5. **Channel statuses are deterministic, not simulated per-channel physics.**
6. **Maintenance/calibration actions are instant**, not timer-gated like test execution phases.
7. **Report narratives are templated, not LLM-generated.**
8. **Bundle size**: now over 1MB after jsPDF + recharts. Code-splitting still on the backlog.
9. **Revenue billing rate ($145/hour of bench cycle time) is a simple flat placeholder.**
10. **No randomness in test results** (deferred by design).
11. **The Audit Log records mechanism, not compliance.** It's an honest implementation of "append-only action history with export," which is the real mechanism behind audit trails. It deliberately does NOT include e-signatures, user authentication, or any "this record is regulator-compliant" claim — those would misrepresent what a browser-based mockup can actually guarantee. Responsibility for what's on record rests with whoever took the action.
12. **Consumable stock changes aren't retroactively reflected in past Daily Snapshots** — Statistics trend history captures utilization/throughput only, not inventory levels over time.
13. No automated test suite — verification has been manual/scripted browser interaction during development.
14. **Print stylesheet for reports is written but not yet visually confirmed** in a real print preview (still parked).

## Project structure

```
src/
  data/        catalog.js (bench types, procedures, maintenance thresholds, channel counts, consumable types,
               qualification domains + capacity), seed.js (initial state — 3 buildings (5 building/floor units), 16 rooms, 4 projects,
               consumables stock, personnel roster), selectors.js (derived data + finance + maintenance +
               channel + statistics + personnel-capacity helpers), reports.js (report content builder),
               reportPdf.js (jsPDF export)
  engine/      testResults.js (deterministic scoring — covers all 4 interactive rooms' procedures)
  context/     appReducer.js (all state transitions incl. wear accrual, upkeep, revenue, maintenance actions,
               daily snapshots, consumable consumption/reorder, personnel-aware scheduling,
               and the audit-log wrapper around every dispatch),
               AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx
    operate/   SideNav (role-gated, 3 roles), DashboardPage, OperationsPage, ProjectsPage (4 projects),
               SchedulingPage (4-room facility-wide, personnel-aware), LaboratoriesPage (16 rooms, grouped by building/floor),
               StatisticsPage, AssetsPage, ConsumablesPage, FinancePage, AuditLogPage,
               PersonnelPage (new), ReportOverlay, NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (overview/building-detail navigation, arrow cycling across 5 units),
               FacilityOverviewScreen (new — 5-card entry screen), BenchTile (channel map for fuel cell benches),
               BuildPanel (room-scoped catalog), FacilityMap (superseded, unused — see Planned Next)
```

## Planned next (per latest discussion)

- Mobile/responsive layout — explicitly called for by the spec, zero work done so far
- Verify print stylesheet output together (parked)
- Consider code-splitting to address bundle size
- Possible: timer-gate maintenance/calibration actions
- Possible: hiring mechanic for Personnel (currently a static roster)
- The old single-room `FacilityMap.jsx` minimap component is now unused (superseded by `FacilityOverviewScreen.jsx` + the arrow navigation) — left in place but dead code, candidate for removal





