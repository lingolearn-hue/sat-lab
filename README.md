# Satellite Powertrain Test Department — LIMS/LOMS Mockup

**Version 15** — Fixed-rate sim clock (every real second now advances exactly 2 sim-hours, scaled by the speed multiplier, instead of a variable real-time-based advance) and a clickable Test Request detail view: stakeholders (derived + editable), deterministic procedure-divergence flag with an editable note, placeholder documents, and a direct link to the test report once completed.

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

## Testing

```bash
npm test          # Vitest — 108 unit tests on the reducer, selectors, scheduling logic, and result engine
npm run test:watch  # same, in watch mode
npm run test:ui     # Vitest's browser UI
npm run test:e2e    # Playwright — 12 end-to-end tests against a real built+served app
```

**Unit tests** (`src/**/*.test.js`, Vitest, no browser) cover the highest-value, highest-bug-rate code in this project: the reducer's action handlers (install/upgrade economy, the full test-request workflow, maintenance/calibration, consumables, daily upkeep, endurance tier-gating), the deterministic result engine, the trickier derived-data selectors (maintenance state, the channel map, personnel capacity, procedure→room resolution), and — notably — `getSchedulingAction`, a pure UI-decision function tested directly even though it lives in a `.jsx` file (Vite's transform handles the JSX syntax transparently in Vitest's node environment, no extra config needed).

Six real bugs have been found and fixed by writing these tests so far, not just by manual clicking:
1. `SCHEDULE_TEST_REQUEST` didn't check that a request was `approved` before scheduling it — only that the bench was free — so a `submitted` request could silently skip the Approve step.
2. The bench-consolidation work left a stale `procedure → bench type id` lookup map keyed on bench type IDs that no longer existed, which silently broke the Scheduling page's "Laboratory" column and "Schedule on..." action for every unscheduled request.
3. The reducer's new endurance tier-gating guard was added without updating the UI-side `getSchedulingAction` to match, so the Scheduling page kept offering a clickable "Schedule" button that the reducer would silently refuse.
4. The deterministic seed-hash function used for procedure durations (and later, auto-generated test requests) had weak avalanche behavior — consecutive seed strings like `"x:1"`, `"x:2"`, `"x:3"` produced outputs within ~0.001 of each other, which collapsed to the same bucket whenever a caller did `Math.floor(seed * smallNumber)`. This silently made every auto-generated test request in a single day's batch identical. Fixed by switching to an FNV-1a-style hash with an extra avalanche round.
5. A multi-day `TICK_CLOCK` (e.g. the clock running fast, or resumed after being paused) checked test-request expiry only once against the *final* day of the jump, while request generation ran once per day crossed within that same jump — so anything generated partway through a big tick never got a fair chance to expire before the check had already passed. Fixed by interleaving both operations day-by-day in the same loop instead of running them as separate batch passes over the whole tick.
6. The new procedure-divergence flag was seeded from a test request's own assigned id (from `nextId()`, a sequential, process-global counter), not from anything content-derived — so two otherwise-identical simulation runs could assign different sequential ids to "the same" conceptual request and land on different divergence outcomes, breaking determinism. Fixed by seeding from stable keys (day+index, or project+DUT+procedure+day) instead of the id.

**E2E tests** (`e2e/critical-flows.spec.js`, Playwright) drive a real browser against the actual built app — the same kind of checks this project ran manually, by hand, every single session up to this point. They cover: the Build-mode install/upgrade economy, the building/floor navigation, the test-request submission flow, the personnel-capacity scheduling block, the endurance tier-gating block (and its resolution once the bench is upgraded), role switching, a save-file round-trip, and the Test Request detail overlay (opening it, adding a stakeholder, toggling procedure divergence).

**A note on this sandbox specifically**: this development environment has no network access to `playwright.dev`, so `npx playwright install` can't fetch its pinned browser revision. `playwright.config.js` supports an optional `PLAYWRIGHT_CHROMIUM_PATH` environment variable to point at an already-installed Chromium binary instead — only needed in offline/sandboxed setups like this one. On a normal development machine, leave it unset and `npx playwright install` works as usual.

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
- **Desktop/Mobile toggle** (updated): the top bar now has an explicit Desktop/Mobile switch. Choosing **Desktop** always renders the complete desktop layout, auto-scaled via CSS transform if the screen is small (this is the old automatic zoom-fit, now an explicit choice rather than forced). Choosing **Mobile** switches to the real mobile layout below. The app still auto-picks Mobile on first load if the viewport is under 860px wide, but the person can switch either way at any time and the full desktop UI remains reachable and complete on any screen size.
- **Real mobile layout** (new, first pass): bottom-tab navigation per role (Operator: 4 tabs, no overflow; Test Engineer and Laboratory Manager: 4 primary tabs + a "More" slide-up sheet for the rest), a condensed top bar, and purpose-built mobile-native layouts for **Dashboard** and **Scheduling** (stacked cards, large tap targets, native text size — not scaled-down desktop). Every other page renders via a scaled-desktop fallback, clearly labeled in-app ("Desktop layout, scaled to fit — a mobile-optimized version of this page is planned") so it's never ambiguous which pages have a real mobile treatment yet.
- **Code-splitting** (new): jsPDF (and its `html2canvas` dependency) and recharts — the two heaviest packages in this app — are now lazy-loaded via dynamic `import()` and `React.lazy`, instead of bundled into the initial page load. The main JS chunk dropped from ~1.1MB to ~330KB; the PDF and Statistics chunks now only load when a person actually clicks Download PDF or opens Statistics.
- **Print stylesheet verified** (was parked since early versions): confirmed via Playwright's print-media emulation that the report overlay prints cleanly — app chrome (sidebar, top bar, dimmed backdrop, buttons) is hidden, only the report content shows. Found and fixed one real layout bug in the process (the print view was vertically centering content, leaving a large empty margin at the top of the printed page).
- **Calendar week date system** (new): every date shown to the person now reads as `CW{week}.{day-of-week}` — e.g. day 23 displays as `CW4.2` — instead of the old "Day N" format. This is purely a display change: `simClock.day` internally is still a plain absolute day counter (day 1, 2, 3, ...), so no reducer logic, saved-game data, or test assertions about day numbers needed to change — only `formatCalendarWeek()` in `selectors.js` and every UI site that displayed a day got updated to call it. Covers the top bar, Projects, Scheduling, Assets, Finance, Audit Log, Statistics (including chart axis labels/tooltips), the New Test Request modal (shows a live CW preview next to the day-number input), the report overlay, and the downloadable PDF.
- **Bench consolidation + realistic durations** (new): each of the 4 interactive rooms went from 2-3 separate bench types down to **one generic bench type per room** (e.g. "Ion Propulsion Test Bench" replaces the old Component/Endurance/Perf. Mapping split). Test duration is now driven by the procedure itself, not the bench: performance-category procedures (efficiency mapping, thrust characterization, thermal cycling, etc.) take 2-5 sim-days; endurance-category procedures (endurance, lifetime, ct_lifetime, thermal_endurance) take 4-6 sim-weeks. **Endurance procedures additionally require the bench to be upgraded to Tier 2+** — a tier-1 bench can run any performance test but is refused for endurance, both at the reducer level and in the Scheduling page's UI (shown as "Needs Tier 2+ bench" in orange, distinct from "No bench free"). Durations are deterministic per DUT+procedure pair (not random), and revenue billing now reflects the actual hours a test ran rather than a static per-bench-type rate. Found and fixed two real bugs while building this: a stale procedure→bench-type lookup map that silently broke the Scheduling page's room resolution for unscheduled requests, and a desync between the reducer's tier-gating guard and the UI's scheduling-decision logic (the UI kept offering a "Schedule" button the reducer would silently refuse) — both now covered by dedicated unit and E2E tests.
- **Automatic test request arrival + expiry** (new): 2-6 new test requests appear on their own each sim-day, distributed across the 4 interactive labs' real projects/DUTs (roughly 80% performance-category, 20% endurance-category procedures), all deterministic — the exact same sequence of incoming work happens every time from the same save, not randomized. They arrive as `submitted`, same as a manually-created request, and still need a human Approve. **A request that sits unscheduled (submitted or approved) for 4 sim-days expires** — shown in red on the Scheduling page, distinct from every other status — and an expired request **auto-archives after a further 7 days**, which hides it from the active Scheduling/queue views (already filtered to exclude `archived`) while keeping the complete record visible on the Projects page for history. This keeps the active queue from growing without bound while never silently deleting anything. Found and fixed a genuine timing bug while building this: a multi-day tick (e.g. the clock running fast, or resumed after being paused) checked expiry only once against the *final* day while generating requests once per day crossed within that same tick — so anything generated partway through a big tick never got a fair chance to expire. Fixed by interleaving expiry checks and request generation day-by-day instead of as two separate batch passes; also fixed a related weak-hash bug where the deterministic seed function produced near-identical outputs for consecutive inputs, causing every auto-generated request in a batch to collapse to the same project/DUT/procedure.
- **Fixed-rate sim clock** (changed): every real second now advances the sim clock by a fixed `SIM_HOURS_PER_TICK` (2 sim-hours), scaled by the existing speed multiplier — e.g. ×24 speed now means 48 sim-hours/real-second, not "1 real second = 24 sim-minutes" as before. Replaces the old variable advance (`realSecondsElapsed × speedMultiplier`), which depended on actual elapsed real time between ticks. The speed multiplier control in the top bar still works the same way conceptually — it scales however fast the clock moves — just against a different base unit now.
- **Test Request detail view** (new): every test request is now clickable — from the Scheduling page table, the Projects page table, and the mobile Scheduling cards — opening a detail overlay with: the full test summary (project, procedure, lab, bench/tier, priority, submitted/due dates); a **procedure divergence** indicator (~15% of requests deterministically diverge at creation, with a specific plausible reason like "Extended thermal soak requested by customer" — not a generic flag) that can be manually toggled and annotated by the person; an editable **stakeholders** list seeded with the project's customer plus generic Lab Manager/Test Engineer roles, with add/remove; a deterministic **placeholder documents** list (Test Procedure, DUT Datasheet, Customer PO, Calibration Certificate — clearly marked "not available in this simulation," no real files behind them); and, once the request reaches `completed`, a direct **View Test Report** button that opens the existing report overlay nested on top. Found and fixed a real determinism bug while building this: the divergence flag was originally seeded from the test request's own assigned id, which comes from a sequential, process-global counter — so two otherwise-identical simulation runs could assign different ids to "the same" conceptual request and get different divergence outcomes. Fixed by seeding from stable, content-derived keys (day+index for auto-generated requests, project+DUT+procedure+day for manual ones) instead.
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
8. **Revenue billing rate ($145/hour of bench cycle time) is a simple flat placeholder.**
9. **No randomness in test results** (deferred by design).
10. **The Audit Log records mechanism, not compliance.** It's an honest implementation of "append-only action history with export," which is the real mechanism behind audit trails. It deliberately does NOT include e-signatures, user authentication, or any "this record is regulator-compliant" claim — those would misrepresent what a browser-based mockup can actually guarantee. Responsibility for what's on record rests with whoever took the action.
11. **Consumable stock changes aren't retroactively reflected in past Daily Snapshots** — Statistics trend history captures utilization/throughput only, not inventory levels over time.
12. **Test coverage is real but not exhaustive.** 62 unit tests + 8 E2E tests cover the reducer, result engine, key selectors, and the highest-value user flows — but most UI components (especially the mobile pages and the report/PDF rendering itself) have no direct test coverage yet.
13. **Only Dashboard and Scheduling have a real mobile layout so far.** Every other page (Operations, Projects, Laboratories, Statistics, Assets, Consumables, Personnel, Finance, Audit Log) renders via a scaled-down desktop fallback in Mobile mode — usable, clearly labeled as such in-app, but not yet touch-optimized (small text, small tap targets). Build mode has no mobile treatment at all yet; switching to Mobile view only affects Operate mode.
14. **Real touch-gesture scrolling hasn't been confirmed on an actual physical device.** Scroll mechanics were verified via mouse-wheel and programmatic scroll in this sandboxed testing environment; native touch-scroll on a real phone should work the same way (transforms don't interfere with it) but hasn't been directly tested.
15. **The Desktop/Mobile toggle is per-session, not persisted.** Reloading the page re-evaluates the viewport width and may reset to the auto-picked mode rather than remembering an explicit manual choice.
16. **The New Test Request modal doesn't filter procedures by room or DUT compatibility.** It lets you pick any procedure from the full catalog regardless of which project/DUT you've selected — a pre-existing gap, not introduced by the bench consolidation, but worth knowing: you can submit a request that doesn't actually match the DUT's domain.
17. **Seed transaction log descriptions reference the old (pre-consolidation) bench type names** (e.g. "Installed BNC-IPL-02 (Endurance Bench)") since they describe history at the time of that fictional purchase. Cosmetically stale but not functionally wrong — Finance's live transaction list for anything that happens after you start playing uses the new consolidated names correctly.
18. **The test requests array itself grows forever, even with auto-archiving.** Archiving relabels a request and hides it from active views — it doesn't remove it from `state.testRequests`. Over a very long play session (months of sim-time) this could mean thousands of records in localStorage and a long history list on the Projects page for an active project, even though nothing the person actually looks at day-to-day grows unbounded. Pruning very old archived records was considered and explicitly deferred in favor of keeping full history, per discussion.
19. **`recordDailySnapshot` still only fires once per tick, not once per day crossed**, unlike the expiry/arrival logic (which now correctly interleaves day-by-day after a bug fix). A multi-day tick records exactly one Statistics snapshot for the whole span rather than one per day — a pre-existing limitation, not addressed this round.
20. **Auto-generated test requests only target the 4 interactive labs' projects** (SAT-004 through SAT-007) — there's no equivalent incoming-work simulation for the view-only rooms, consistent with those rooms having no real test workflow yet.
21. **The Test Request detail overlay reuses the same desktop-width layout on mobile** — it isn't a dedicated mobile component. The fixed 160px label column in the key-value grid causes some labels (e.g. a long project+customer string) to wrap awkwardly on a phone-width screen. Readable and fully functional, just not yet a purpose-built mobile layout, consistent with most overlays in this app.
22. **Placeholder documents in the Test Request detail view have no real file behind them** — by design, per discussion. They demonstrate what a real LIMS would attach to a test record, not an actual document management feature.
23. **The fixed-rate clock change wasn't accompanied by a UI label update.** The top bar's speed control still just shows "×24" etc. with no indication that the underlying unit changed from "minutes per real second" to "hours per real-second-tick" — functionally correct, but a person inspecting the exact numbers closely might notice the rate differs from before this version.

## Project structure

```
src/
  data/        catalog.js (one generic bench type per interactive room, procedures tagged with a
               performance/endurance category that drives duration + tier-gating via
               getProcedureDurationHours/MIN_TIER_FOR_ENDURANCE, TEST_REQUEST_EXPIRY_DAYS/EXPIRED_TO_ARCHIVED_DAYS,
               hashStringToUnitInterval (FNV-1a-style deterministic seed hash, used by duration calculation and
               auto-arrival generation), maintenance thresholds, channel counts,
               consumable types, qualification domains + capacity), seed.js (initial state — 3 buildings
               (5 building/floor units), 16 rooms, 4 projects, consumables stock, personnel roster),
               selectors.js (derived data + finance + maintenance + channel + statistics + personnel-capacity
               helpers, incl. roomForProcedure — shared by desktop and mobile Scheduling views so they never
               drift apart, formatCalendarWeek — the single source of truth for the CW{week}.{day} date
               display format used everywhere, and deriveDefaultStakeholders/deriveDefaultDivergence/
               getPlaceholderDocuments for the Test Request detail view), reports.js (report content builder),
               reportPdf.js (jsPDF export)
  engine/      testResults.js (deterministic scoring — covers all 4 interactive rooms' procedures)
  context/     appReducer.js (all state transitions incl. wear accrual, upkeep, revenue, maintenance actions,
               daily snapshots, consumable consumption/reorder, personnel-aware scheduling,
               and the audit-log wrapper around every dispatch),
               AppContext.jsx (provider, persistence, clock)
  components/
    shared/    TopBar.jsx (now includes the Desktop/Mobile toggle), ZoomFitWrapper.jsx (scales Desktop mode on small screens)
    mobile/    MobileShell (routes to mobile-ready pages or a scaled-desktop fallback), MobileTopBar, MobileTabBar
               (per-role bottom tabs + More sheet), MobileDashboardPage, MobileSchedulingPage, mobileNavConfig.js
               (per-role tab definitions, mobile-ready page registry)
    operate/   SideNav (role-gated, 3 roles), DashboardPage, OperationsPage, ProjectsPage (4 projects),
               SchedulingPage (4-room facility-wide, personnel-aware; exports getSchedulingAction, a pure
               decision function reused by MobileSchedulingPage so both UIs make identical scheduling
               decisions from one place), LaboratoriesPage (16 rooms, grouped by building/floor),
               StatisticsPage, AssetsPage, ConsumablesPage, FinancePage, AuditLogPage,
               PersonnelPage, ReportOverlay, TestRequestDetailOverlay (new — stakeholders, divergence,
               placeholder documents, nested report link), NewTestRequestModal, BenchStatusCard, StubPage
    build/     BuildShell (overview/building-detail navigation, arrow cycling across 5 units),
               FacilityOverviewScreen (new — 5-card entry screen), BenchTile (channel map for fuel cell benches),
               BuildPanel (room-scoped catalog), FacilityMap (superseded, unused — see Planned Next)

e2e/           critical-flows.spec.js — Playwright E2E tests
*.test.js      co-located next to the file they test (appReducer.test.js, selectors.test.js, testResults.test.js, SchedulingPage.test.js)
vitest.config.js, playwright.config.js — test runner configuration
```

## Planned next (per latest discussion)

- **Extend the real mobile layout to more pages.** Operations and Projects are the next natural candidates (both are Operator/Test Engineer primary tabs); the goal is to eventually retire the scaled-desktop fallback for every page that gets real mobile use.
- **Mobile treatment for Build mode** — not started. The CAD grid and channel-map visuals will need their own design thinking for touch/narrow screens, not just a scaled-down version.
- Verify print stylesheet output together (parked)
- Consider code-splitting to address bundle size
- Possible: timer-gate maintenance/calibration actions
- Possible: hiring mechanic for Personnel (currently a static roster)
- The old single-room `FacilityMap.jsx` minimap component is now unused (superseded by `FacilityOverviewScreen.jsx` + the arrow navigation) — left in place but dead code, candidate for removal





