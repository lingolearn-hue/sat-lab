import { describe, it, expect } from 'vitest';
import { appReducer } from '../context/appReducer.js';
import { createInitialState } from '../data/seed.js';
import { EXECUTION_PHASE_DURATIONS_HOURS } from '../data/catalog.js';

// All tests start from a fresh copy of the real seed data — same starting point
// every manual regression check in this project has used, so these tests exercise
// exactly the scenarios that have actually mattered during development.
function freshState() {
  return createInitialState();
}

// Creates a fresh, approved (not yet scheduled) Ion Propulsion test request,
// since every seeded request in tr-0233's family already has a status that
// doesn't suit "about to be scheduled" tests. Uses a performance-category
// procedure so it's schedulable on any tier bench by default — tests that
// specifically need an endurance-category request build their own.
function freshApprovedRequest(state) {
  const before = state.testRequests.map((tr) => tr.id);
  const submitted = appReducer(state, {
    type: 'SUBMIT_TEST_REQUEST',
    projectId: 'proj-sat004',
    dutId: 'dut-xr5',
    procedure: 'efficiency_mapping',
    priority: 'low',
    requestedCompletionDay: 28,
  });
  const tr = submitted.testRequests.find((t) => !before.includes(t.id));
  const approved = appReducer(submitted, { type: 'APPROVE_TEST_REQUEST', testRequestId: tr.id });
  return { state: approved, testRequestId: tr.id };
}

// Same idea as freshApprovedRequest, but parameterized for tests that need a
// specific project/DUT/procedure combination (e.g. a Fuel Cell request, or an
// endurance-category one) rather than the generic Ion Propulsion default.
function freshApprovedRequestFor(state, projectId, dutId, procedure) {
  const before = state.testRequests.map((tr) => tr.id);
  const submitted = appReducer(state, {
    type: 'SUBMIT_TEST_REQUEST',
    projectId,
    dutId,
    procedure,
    priority: 'normal',
    requestedCompletionDay: state.simClock.day + 30,
  });
  const tr = submitted.testRequests.find((t) => !before.includes(t.id));
  const approved = appReducer(submitted, { type: 'APPROVE_TEST_REQUEST', testRequestId: tr.id });
  return { state: approved, testRequestId: tr.id };
}

describe('appReducer — role and clock', () => {
  it('SET_ROLE updates currentRole', () => {
    const state = freshState();
    const next = appReducer(state, { type: 'SET_ROLE', role: 'operator' });
    expect(next.currentRole).toBe('operator');
  });

  it('TOGGLE_CLOCK_RUNNING flips the running flag', () => {
    const state = freshState();
    const wasRunning = state.simClock.running;
    const next = appReducer(state, { type: 'TOGGLE_CLOCK_RUNNING' });
    expect(next.simClock.running).toBe(!wasRunning);
  });

  it('TICK_CLOCK does not create an audit log entry (excluded action)', () => {
    const state = freshState();
    const before = state.auditLog.length;
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 30 });
    expect(next.auditLog.length).toBe(before);
  });

  it('TICK_CLOCK advances sim time correctly across an hour boundary', () => {
    const state = freshState();
    state.simClock.hour = 9;
    state.simClock.minute = 50;
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 20 });
    expect(next.simClock.hour).toBe(10);
    expect(next.simClock.minute).toBe(10);
  });

  it('every other dispatched action creates exactly one audit log entry', () => {
    const state = freshState();
    const before = state.auditLog.length;
    const next = appReducer(state, { type: 'SET_ROLE', role: 'operator' });
    expect(next.auditLog.length).toBe(before + 1);
    expect(next.auditLog[next.auditLog.length - 1].actionType).toBe('SET_ROLE');
  });
});

describe('appReducer — bench install/upgrade economy', () => {
  it('INSTALL_BENCH deducts the correct cost and adds a bench in idle status', () => {
    const state = freshState();
    const budgetBefore = state.facility.budget;
    const next = appReducer(state, { type: 'INSTALL_BENCH', roomId: 'room-ipl', benchTypeId: 'ion_propulsion_bench' });

    const installed = next.benches.find((b) => !state.benches.some((sb) => sb.id === b.id));

    expect(installed).toBeDefined();
    expect(installed.status).toBe('idle'); // regression guard: this exact bug shipped once before
    expect(installed.tier).toBe(1);
    expect(next.facility.budget).toBe(budgetBefore - 24000); // ion_propulsion_bench base cost
  });

  it('INSTALL_BENCH refuses when the room is already full', () => {
    const state = freshState();
    const room = state.rooms.find((r) => r.id === 'room-ipl');
    let s = state;
    const startCount = s.benches.filter((b) => b.roomId === 'room-ipl').length;
    for (let i = startCount; i < room.maxSlots; i++) {
      s = appReducer(s, { type: 'INSTALL_BENCH', roomId: 'room-ipl', benchTypeId: 'ion_propulsion_bench' });
    }
    const fullCount = s.benches.filter((b) => b.roomId === 'room-ipl').length;
    expect(fullCount).toBe(room.maxSlots);

    const budgetBeforeOverfill = s.facility.budget;
    const attemptOverfill = appReducer(s, { type: 'INSTALL_BENCH', roomId: 'room-ipl', benchTypeId: 'ion_propulsion_bench' });
    expect(attemptOverfill.benches.filter((b) => b.roomId === 'room-ipl').length).toBe(room.maxSlots);
    expect(attemptOverfill.facility.budget).toBe(budgetBeforeOverfill);
  });

  it('INSTALL_BENCH refuses when budget is insufficient', () => {
    const state = freshState();
    state.facility.budget = 100;
    const next = appReducer(state, { type: 'INSTALL_BENCH', roomId: 'room-ipl', benchTypeId: 'ion_propulsion_bench' });
    expect(next.benches.length).toBe(state.benches.length);
    expect(next.facility.budget).toBe(100);
  });

  it('UPGRADE_BENCH increases tier and deducts the correct upgrade cost', () => {
    const state = freshState();
    const bench = state.benches.find((b) => b.id === 'bnc-ipl-03');
    const budgetBefore = state.facility.budget;
    const next = appReducer(state, { type: 'UPGRADE_BENCH', benchId: 'bnc-ipl-03' });
    const updated = next.benches.find((b) => b.id === 'bnc-ipl-03');
    expect(updated.tier).toBe(bench.tier + 1);
    expect(next.facility.budget).toBe(budgetBefore - 13000); // ion_propulsion_bench tier-2 upgrade cost
  });

  it('UPGRADE_BENCH refuses past the bench type max tier', () => {
    const state = freshState();
    // ion_propulsion_bench has maxTier 3; bnc-ipl-03 starts at tier 1, so it takes
    // two successful upgrades to reach the ceiling, then a third attempt is refused.
    const afterFirst = appReducer(state, { type: 'UPGRADE_BENCH', benchId: 'bnc-ipl-03' });
    const afterSecond = appReducer(afterFirst, { type: 'UPGRADE_BENCH', benchId: 'bnc-ipl-03' });
    expect(afterSecond.benches.find((b) => b.id === 'bnc-ipl-03').tier).toBe(3);

    const budgetAtCeiling = afterSecond.facility.budget;
    const afterThird = appReducer(afterSecond, { type: 'UPGRADE_BENCH', benchId: 'bnc-ipl-03' });
    const bench = afterThird.benches.find((b) => b.id === 'bnc-ipl-03');
    expect(bench.tier).toBe(3);
    expect(afterThird.facility.budget).toBe(budgetAtCeiling);
  });

  it('EXPAND_ROOM increases tier, maxSlots, and upkeep, and deducts cost', () => {
    const state = freshState();
    const room = state.rooms.find((r) => r.id === 'room-ipl');
    const budgetBefore = state.facility.budget;
    const next = appReducer(state, { type: 'EXPAND_ROOM', roomId: 'room-ipl' });
    const updated = next.rooms.find((r) => r.id === 'room-ipl');
    expect(updated.tier).toBe(room.tier + 1);
    expect(updated.maxSlots).toBe(room.maxSlots + 1);
    expect(updated.upkeepPerDay).toBeGreaterThan(room.upkeepPerDay);
    expect(next.facility.budget).toBeLessThan(budgetBefore);
  });
});

describe('appReducer — test request workflow', () => {
  it('SUBMIT_TEST_REQUEST creates a new request with status submitted', () => {
    const state = freshState();
    const next = appReducer(state, {
      type: 'SUBMIT_TEST_REQUEST',
      projectId: 'proj-sat004',
      dutId: 'dut-xr3',
      procedure: 'endurance',
      priority: 'normal',
      requestedCompletionDay: 30,
    });
    const created = next.testRequests.find((tr) => !state.testRequests.some((str) => str.id === tr.id));
    expect(created).toBeDefined();
    expect(created.status).toBe('submitted');
  });

  it('APPROVE_TEST_REQUEST moves status from submitted to approved', () => {
    const state = freshState();
    const submitted = appReducer(state, {
      type: 'SUBMIT_TEST_REQUEST',
      projectId: 'proj-sat004',
      dutId: 'dut-xr3',
      procedure: 'endurance',
      priority: 'normal',
      requestedCompletionDay: 30,
    });
    const newTr = submitted.testRequests.find((tr) => !state.testRequests.some((str) => str.id === tr.id));
    const approved = appReducer(submitted, { type: 'APPROVE_TEST_REQUEST', testRequestId: newTr.id });
    expect(approved.testRequests.find((tr) => tr.id === newTr.id).status).toBe('approved');
  });

  it('SCHEDULE_TEST_REQUEST refuses on a busy bench', () => {
    const state = freshState();
    const { state: approved, testRequestId } = freshApprovedRequest(state);
    // bnc-ipl-01 is running in seed data — scheduling onto it must be refused.
    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-01' });
    expect(next.testRequests.find((t) => t.id === testRequestId).status).toBe('approved');
    expect(next.benches.find((b) => b.id === 'bnc-ipl-01').currentExecutionId).toBe('exec-0229'); // unchanged
  });

  it('SCHEDULE_TEST_REQUEST succeeds on an idle bench with available qualified personnel', () => {
    const state = freshState();
    const { state: approved, testRequestId } = freshApprovedRequest(state);
    const scheduled = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-03' });

    const tr = scheduled.testRequests.find((t) => t.id === testRequestId);
    expect(tr.status).toBe('scheduled');
    expect(tr.assignedBenchId).toBe('bnc-ipl-03');
    const bench = scheduled.benches.find((b) => b.id === 'bnc-ipl-03');
    expect(bench.status).toBe('running');

    const execution = scheduled.executions.find((e) => e.testRequestId === testRequestId);
    expect(execution).toBeDefined();
    expect(execution.assignedPersonnelId).toBeTruthy();
  });

  it('SCHEDULE_TEST_REQUEST refuses when every qualified person is already at capacity', () => {
    const state = freshState();
    state.executions.push(
      { id: 'fake-1', testRequestId: 'fake-tr-1', benchId: 'bnc-ipl-01', assignedPersonnelId: 'per-001', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 5, result: null },
      { id: 'fake-2', testRequestId: 'fake-tr-2', benchId: 'bnc-ipl-01', assignedPersonnelId: 'per-001', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 5, result: null },
      { id: 'fake-3', testRequestId: 'fake-tr-3', benchId: 'bnc-ipl-01', assignedPersonnelId: 'per-002', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 5, result: null },
      { id: 'fake-4', testRequestId: 'fake-tr-4', benchId: 'bnc-ipl-01', assignedPersonnelId: 'per-002', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 5, result: null }
    );
    const { state: approved, testRequestId } = freshApprovedRequest(state);

    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-03' });
    // bnc-ipl-03 is idle, but no qualified person has spare capacity — schedule must be refused.
    expect(next.testRequests.find((t) => t.id === testRequestId).status).toBe('approved');
    expect(next.benches.find((b) => b.id === 'bnc-ipl-03').status).toBe('idle');
  });

  it('SCHEDULE_TEST_REQUEST refuses an endurance-category procedure on a tier-1 bench', () => {
    const state = freshState();
    const before = state.testRequests.map((tr) => tr.id);
    const submitted = appReducer(state, {
      type: 'SUBMIT_TEST_REQUEST',
      projectId: 'proj-sat004',
      dutId: 'dut-xr5',
      procedure: 'lifetime', // endurance-category
      priority: 'low',
      requestedCompletionDay: 28,
    });
    const tr = submitted.testRequests.find((t) => !before.includes(t.id));
    const approved = appReducer(submitted, { type: 'APPROVE_TEST_REQUEST', testRequestId: tr.id });

    // bnc-ipl-03 is tier 1 in seed data — endurance requires MIN_TIER_FOR_ENDURANCE (2).
    expect(approved.benches.find((b) => b.id === 'bnc-ipl-03').tier).toBe(1);
    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: tr.id, benchId: 'bnc-ipl-03' });
    expect(next.testRequests.find((t) => t.id === tr.id).status).toBe('approved'); // unchanged, refused
    expect(next.executions.some((e) => e.testRequestId === tr.id)).toBe(false);
  });

  it('SCHEDULE_TEST_REQUEST succeeds for an endurance-category procedure once the bench is upgraded to tier 2', () => {
    const state = freshState();
    const upgradedOnce = appReducer(state, { type: 'UPGRADE_BENCH', benchId: 'bnc-ipl-03' });
    expect(upgradedOnce.benches.find((b) => b.id === 'bnc-ipl-03').tier).toBe(2);

    const before = upgradedOnce.testRequests.map((tr) => tr.id);
    const submitted = appReducer(upgradedOnce, {
      type: 'SUBMIT_TEST_REQUEST',
      projectId: 'proj-sat004',
      dutId: 'dut-xr5',
      procedure: 'lifetime',
      priority: 'low',
      requestedCompletionDay: 28,
    });
    const tr = submitted.testRequests.find((t) => !before.includes(t.id));
    const approved = appReducer(submitted, { type: 'APPROVE_TEST_REQUEST', testRequestId: tr.id });

    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: tr.id, benchId: 'bnc-ipl-03' });
    expect(next.testRequests.find((t) => t.id === tr.id).status).toBe('scheduled');
    const execution = next.executions.find((e) => e.testRequestId === tr.id);
    expect(execution).toBeDefined();
    expect(execution.phaseDurationHours).toBe(1); // scheduled phase's 1-hour setup buffer; running duration is set on the next phase advance
  });

  it('a performance-category procedure runs fine on a tier-1 bench (no gating)', () => {
    const state = freshState();
    const { state: approved, testRequestId } = freshApprovedRequest(state); // efficiency_mapping, performance-category
    expect(state.benches.find((b) => b.id === 'bnc-ipl-03').tier).toBe(1);
    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-03' });
    expect(next.testRequests.find((t) => t.id === testRequestId).status).toBe('scheduled');
  });

  it('running-phase duration is days-scale for performance procedures and weeks-scale for endurance procedures', () => {
    const initial = freshState();
    const upgraded = appReducer(initial, { type: 'UPGRADE_BENCH', benchId: 'bnc-ipl-03' }); // tier 2, unlocks endurance

    // Performance procedure: should land in the 48-120h (2-5 day) range.
    const { state: perfApproved, testRequestId: perfTrId } = freshApprovedRequest(upgraded);
    let perfState = appReducer(perfApproved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: perfTrId, benchId: 'bnc-ipl-03' });
    const perfExec = perfState.executions.find((e) => e.testRequestId === perfTrId);
    perfState = appReducer(perfState, { type: 'ADVANCE_EXECUTION_PHASE', executionId: perfExec.id }); // -> running
    const perfDuration = perfState.executions.find((e) => e.id === perfExec.id).phaseDurationHours;
    expect(perfDuration).toBeGreaterThanOrEqual(48);
    expect(perfDuration).toBeLessThanOrEqual(120);

    // Endurance procedure: should land in the 672-1008h (4-6 week) range.
    const before = upgraded.testRequests.map((tr) => tr.id);
    const submitted = appReducer(upgraded, {
      type: 'SUBMIT_TEST_REQUEST',
      projectId: 'proj-sat004',
      dutId: 'dut-xr5',
      procedure: 'lifetime',
      priority: 'low',
      requestedCompletionDay: 60,
    });
    const enduranceTr = submitted.testRequests.find((t) => !before.includes(t.id));
    let enduranceState = appReducer(submitted, { type: 'APPROVE_TEST_REQUEST', testRequestId: enduranceTr.id });
    enduranceState = appReducer(enduranceState, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: enduranceTr.id, benchId: 'bnc-ipl-03' });
    const enduranceExec = enduranceState.executions.find((e) => e.testRequestId === enduranceTr.id);
    enduranceState = appReducer(enduranceState, { type: 'ADVANCE_EXECUTION_PHASE', executionId: enduranceExec.id });
    const enduranceDuration = enduranceState.executions.find((e) => e.id === enduranceExec.id).phaseDurationHours;
    expect(enduranceDuration).toBeGreaterThanOrEqual(672);
    expect(enduranceDuration).toBeLessThanOrEqual(1008);
  });

  it('ADVANCE_EXECUTION_PHASE walks scheduled -> running -> review -> completed, freeing the bench at the end', () => {
    const initial = freshState();
    const { state: approved, testRequestId } = freshApprovedRequest(initial);
    let state = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-03' });
    const execution = state.executions.find((e) => e.testRequestId === testRequestId);
    expect(execution.phase).toBe('scheduled');

    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    expect(state.executions.find((e) => e.id === execution.id).phase).toBe('running');
    expect(state.testRequests.find((tr) => tr.id === testRequestId).status).toBe('running');

    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    const reviewExec = state.executions.find((e) => e.id === execution.id);
    expect(reviewExec.phase).toBe('review');
    expect(reviewExec.result).not.toBeNull();

    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    const completedExec = state.executions.find((e) => e.id === execution.id);
    expect(completedExec.phase).toBe('completed');
    expect(state.testRequests.find((tr) => tr.id === testRequestId).status).toBe('completed');
    expect(state.benches.find((b) => b.id === 'bnc-ipl-03').status).toBe('idle');
    expect(state.benches.find((b) => b.id === 'bnc-ipl-03').currentExecutionId).toBeNull();
  });

  it("completing an execution charges revenue and consumes the room's consumables", () => {
    const initial = freshState();
    const { state: approved, testRequestId } = freshApprovedRequest(initial);
    let state = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-03' });
    const execution = state.executions.find((e) => e.testRequestId === testRequestId);
    const budgetBefore = state.facility.budget;
    const xenonBefore = state.consumables.find((c) => c.id === 'xenon_propellant').stock;
    const calGasBefore = state.consumables.find((c) => c.id === 'calibration_gas').stock;

    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });

    expect(state.facility.budget).toBeGreaterThan(budgetBefore);
    expect(state.consumables.find((c) => c.id === 'xenon_propellant').stock).toBeLessThan(xenonBefore);
    expect(state.consumables.find((c) => c.id === 'calibration_gas').stock).toBeLessThan(calGasBefore);
  });

  it('SCHEDULE_TEST_REQUEST refuses a request that is only "submitted", not yet "approved" (regression: this used to silently succeed)', () => {
    const state = freshState();
    const tr = state.testRequests.find((t) => t.id === 'tr-0403');
    expect(tr.status).toBe('submitted');
    const next = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0403', benchId: 'bnc-ctl-02' });
    expect(next.testRequests.find((t) => t.id === 'tr-0403').status).toBe('submitted');
    expect(next.executions.some((e) => e.testRequestId === 'tr-0403')).toBe(false);
  });
});

describe('appReducer — deferred-start scheduling (Gantt support)', () => {
  it('a startOnDay in the future reserves the bench instead of starting it immediately', () => {
    const state = freshState();
    const next = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02', startOnDay: 30 });
    const bench = next.benches.find((b) => b.id === 'bnc-fcpl-02');
    expect(bench.status).toBe('reserved'); // not 'running' — no wear/occupancy yet
    expect(bench.status).not.toBe('idle'); // but not free for another schedule either

    const tr = next.testRequests.find((t) => t.id === 'tr-0303');
    expect(tr.status).toBe('scheduled');
    expect(tr.scheduledStartDay).toBe(30);

    const execution = next.executions.find((e) => e.testRequestId === 'tr-0303');
    expect(execution.phase).toBe('queued');
    expect(execution.scheduledStartDay).toBe(30);
    expect(execution.phaseDurationHours).toBeNull();
  });

  it('omitting startOnDay behaves exactly as before — immediate start, bench running', () => {
    const state = freshState();
    const next = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02' });
    expect(next.benches.find((b) => b.id === 'bnc-fcpl-02').status).toBe('running');
    const execution = next.executions.find((e) => e.testRequestId === 'tr-0303');
    expect(execution.phase).toBe('scheduled');
  });

  it('a startOnDay equal to or before today is treated as an immediate start, not deferred', () => {
    const state = freshState();
    const next = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02', startOnDay: state.simClock.day });
    expect(next.benches.find((b) => b.id === 'bnc-fcpl-02').status).toBe('running');
    expect(next.testRequests.find((t) => t.id === 'tr-0303').scheduledStartDay).toBeNull();
  });

  it('a reserved bench cannot be scheduled onto again until its reservation activates', () => {
    const state = freshState();
    const reserved = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02', startOnDay: 30 });
    const { state: approved, testRequestId } = freshApprovedRequestFor(reserved, 'proj-sat005', 'dut-fcp1', 'fc_efficiency');
    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-fcpl-02' });
    // bench is 'reserved', not 'idle' — the second schedule attempt must be refused.
    expect(next.executions.filter((e) => e.benchId === 'bnc-fcpl-02').length).toBe(1);
  });

  it('TICK_CLOCK activates a due reservation: bench goes reserved -> running, execution goes queued -> scheduled', () => {
    let state = freshState();
    state = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02', startOnDay: 16 });
    expect(state.benches.find((b) => b.id === 'bnc-fcpl-02').status).toBe('reserved');

    const stillQueued = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 }); // day 15, not due yet
    expect(stillQueued.benches.find((b) => b.id === 'bnc-fcpl-02').status).toBe('reserved');
    expect(stillQueued.executions.find((e) => e.testRequestId === 'tr-0303').phase).toBe('queued');

    const activated = appReducer(stillQueued, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 2 }); // day 17, past 16
    expect(activated.benches.find((b) => b.id === 'bnc-fcpl-02').status).toBe('running');
    const execution = activated.executions.find((e) => e.testRequestId === 'tr-0303');
    expect(execution.phase).toBe('scheduled');
    expect(execution.phaseDurationHours).toBe(EXECUTION_PHASE_DURATIONS_HOURS.scheduled);
  });

  it('activation fires an event naming the request and bench', () => {
    let state = freshState();
    state = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02', startOnDay: 16 });
    state = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 3 });
    expect(state.eventFeed.some((e) => e.message === 'TR-0303 reservation activated on BNC-FCPL-02')).toBe(true);
  });

  it('ADVANCE_EXECUTION_PHASE is a no-op on a queued (not-yet-due) execution — only TICK_CLOCK can activate it', () => {
    const state = freshState();
    const next0 = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0303', benchId: 'bnc-fcpl-02', startOnDay: 30 });
    const execution = next0.executions.find((e) => e.testRequestId === 'tr-0303');
    const next = appReducer(next0, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    // Without the explicit guard, phaseOrder.indexOf('queued') === -1 would silently
    // fall through to phaseOrder[0] ('scheduled') — this locks in that it doesn't.
    expect(next.executions.find((e) => e.id === execution.id).phase).toBe('queued');
    expect(next.benches.find((b) => b.id === 'bnc-fcpl-02').status).toBe('reserved');
  });

  it('an endurance-category deferred reservation still requires MIN_TIER_FOR_ENDURANCE at the time of scheduling', () => {
    const state = freshState();
    // bnc-ipl-03 is tier 1 — deferred start doesn't bypass the tier-gating check.
    const { state: approved, testRequestId } = freshApprovedRequestFor(state, 'proj-sat004', 'dut-xr5', 'lifetime');
    const next = appReducer(approved, { type: 'SCHEDULE_TEST_REQUEST', testRequestId, benchId: 'bnc-ipl-03', startOnDay: 40 });
    expect(next.testRequests.find((t) => t.id === testRequestId).status).toBe('approved'); // refused, unchanged
    expect(next.benches.find((b) => b.id === 'bnc-ipl-03').status).toBe('idle');
  });
});

describe('appReducer — maintenance, calibration, consumables', () => {
  it('PERFORM_MAINTENANCE refuses while the bench is running, succeeds once idle', () => {
    const state = freshState();
    const runningBench = state.benches.find((b) => b.id === 'bnc-ipl-02');
    expect(runningBench.status).toBe('running');

    const refused = appReducer(state, { type: 'PERFORM_MAINTENANCE', benchId: 'bnc-ipl-02' });
    expect(refused.benches.find((b) => b.id === 'bnc-ipl-02').hoursSinceLastMaintenance).toBe(runningBench.hoursSinceLastMaintenance);

    state.benches.find((b) => b.id === 'bnc-ipl-02').status = 'idle';
    const budgetBefore = state.facility.budget;
    const next = appReducer(state, { type: 'PERFORM_MAINTENANCE', benchId: 'bnc-ipl-02' });
    const updated = next.benches.find((b) => b.id === 'bnc-ipl-02');
    expect(updated.hoursSinceLastMaintenance).toBe(0);
    expect(next.facility.budget).toBeLessThan(budgetBefore);
  });

  it('a bench past MAINTENANCE_OVERDUE_HOURS automatically goes out_of_service on tick', () => {
    const state = freshState();
    const bench = state.benches.find((b) => b.id === 'bnc-hil-01');
    bench.status = 'running';
    bench.hoursSinceLastMaintenance = 395;

    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 600 });
    const updated = next.benches.find((b) => b.id === 'bnc-hil-01');
    expect(updated.hoursSinceLastMaintenance).toBeGreaterThanOrEqual(400);
    expect(updated.status).toBe('out_of_service');
  });

  it('REORDER_CONSUMABLE restocks and charges the correct cost', () => {
    const state = freshState();
    const before = state.consumables.find((c) => c.id === 'calibration_gas').stock;
    const budgetBefore = state.facility.budget;
    const next = appReducer(state, { type: 'REORDER_CONSUMABLE', consumableId: 'calibration_gas' });
    const after = next.consumables.find((c) => c.id === 'calibration_gas').stock;
    expect(after).toBe(before + 20);
    expect(next.facility.budget).toBe(budgetBefore - 3400);
  });

  it('a low-stock event fires exactly once when stock crosses the threshold downward', () => {
    let state = freshState();
    state.consumables.find((c) => c.id === 'hydrazine_propellant').stock = 18;
    state = appReducer(state, { type: 'APPROVE_TEST_REQUEST', testRequestId: 'tr-0403' });
    state = appReducer(state, { type: 'SCHEDULE_TEST_REQUEST', testRequestId: 'tr-0403', benchId: 'bnc-ctl-02' });
    const execution = state.executions.find((e) => e.testRequestId === 'tr-0403');
    expect(execution).toBeDefined();
    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });
    const beforeCount = state.eventFeed.filter((e) => e.message.includes('Hydrazine Propellant stock low')).length;
    state = appReducer(state, { type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id });

    const afterCount = state.eventFeed.filter((e) => e.message.includes('Hydrazine Propellant stock low')).length;
    expect(afterCount).toBe(beforeCount + 1);
  });
});

describe('appReducer — test request detail editing', () => {
  it('UPDATE_TEST_REQUEST_DETAILS replaces stakeholders wholesale', () => {
    const state = freshState();
    const tr = state.testRequests.find((t) => t.id === 'tr-0231');
    const newStakeholders = [{ name: 'Jane Doe', role: 'QA Lead' }];
    const next = appReducer(state, { type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: 'tr-0231', stakeholders: newStakeholders });
    expect(next.testRequests.find((t) => t.id === 'tr-0231').stakeholders).toEqual(newStakeholders);
  });

  it('UPDATE_TEST_REQUEST_DETAILS can toggle divergesFromStandard and set a note independently', () => {
    const state = freshState();
    const next = appReducer(state, {
      type: 'UPDATE_TEST_REQUEST_DETAILS',
      testRequestId: 'tr-0231',
      divergesFromStandard: true,
      divergenceNote: 'Manual override for testing',
    });
    const tr = next.testRequests.find((t) => t.id === 'tr-0231');
    expect(tr.divergesFromStandard).toBe(true);
    expect(tr.divergenceNote).toBe('Manual override for testing');
  });

  it('UPDATE_TEST_REQUEST_DETAILS leaves untouched fields alone', () => {
    const state = freshState();
    const before = state.testRequests.find((t) => t.id === 'tr-0231');
    const next = appReducer(state, { type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: 'tr-0231', divergesFromStandard: true });
    const after = next.testRequests.find((t) => t.id === 'tr-0231');
    expect(after.status).toBe(before.status);
    expect(after.stakeholders).toEqual(before.stakeholders);
    expect(after.priority).toBe(before.priority);
  });

  it('UPDATE_TEST_REQUEST_DETAILS works regardless of workflow status (e.g. on a completed request)', () => {
    let state = freshState();
    state = appReducer(state, { type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: 'tr-0233', stakeholders: [{ name: 'Someone', role: 'Auditor' }] });
    // tr-0233 is seeded as 'scheduled', not editable via the normal workflow actions,
    // but detail edits are record-keeping annotations, not workflow gates.
    expect(state.testRequests.find((t) => t.id === 'tr-0233').stakeholders).toEqual([{ name: 'Someone', role: 'Auditor' }]);
  });

  it('UPDATE_TEST_REQUEST_DETAILS is a no-op for a request id that does not exist', () => {
    const state = freshState();
    const next = appReducer(state, { type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: 'not-a-real-id', stakeholders: [] });
    expect(next.testRequests).toEqual(state.testRequests);
  });

  it('every seeded test request has stakeholders and a defined divergesFromStandard flag (backfilled at creation)', () => {
    const state = freshState();
    for (const tr of state.testRequests) {
      expect(Array.isArray(tr.stakeholders)).toBe(true);
      expect(tr.stakeholders.length).toBeGreaterThan(0);
      expect(typeof tr.divergesFromStandard).toBe('boolean');
    }
  });

  it('a manually submitted test request also gets stakeholders and a divergence flag', () => {
    const state = freshState();
    const next = appReducer(state, {
      type: 'SUBMIT_TEST_REQUEST',
      projectId: 'proj-sat004',
      dutId: 'dut-xr3',
      procedure: 'efficiency_mapping',
      priority: 'normal',
      requestedCompletionDay: 30,
    });
    const created = next.testRequests.find((tr) => !state.testRequests.some((str) => str.id === tr.id));
    expect(Array.isArray(created.stakeholders)).toBe(true);
    expect(created.stakeholders.length).toBeGreaterThan(0);
    expect(typeof created.divergesFromStandard).toBe('boolean');
  });
});

describe('appReducer — automatic test request arrival', () => {
  it('generates between 2 and 6 new requests per sim-day crossed', () => {
    const state = freshState();
    const before = state.testRequests.length;
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 }); // exactly 1 day
    const generated = next.testRequests.length - before;
    expect(generated).toBeGreaterThanOrEqual(2);
    expect(generated).toBeLessThanOrEqual(6);
  });

  it('is deterministic — the same starting state always generates the same batch of requests', () => {
    const stateA = freshState();
    const nextA = appReducer(stateA, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 });
    const stateB = freshState();
    const nextB = appReducer(stateB, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 });

    const contentA = nextA.testRequests.slice(stateA.testRequests.length).map((tr) => ({ ...tr, id: undefined }));
    const contentB = nextB.testRequests.slice(stateB.testRequests.length).map((tr) => ({ ...tr, id: undefined }));
    expect(contentA).toEqual(contentB);
  });

  it('every generated request starts as "submitted" with a real project/DUT/procedure combination', () => {
    const state = freshState();
    const before = state.testRequests.length;
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 });
    const generated = next.testRequests.slice(before);

    for (const tr of generated) {
      expect(tr.status).toBe('submitted');
      expect(next.projects.some((p) => p.id === tr.projectId)).toBe(true);
      expect(next.duts.some((d) => d.id === tr.dutId && d.projectId === tr.projectId)).toBe(true);
      expect(tr.submittedOnDay).toBeDefined();
    }
  });

  it('generates requests once per day crossed, not once per tick, for a multi-day tick', () => {
    const state = freshState();
    const before = state.testRequests.length;
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 5 }); // 5 days in one tick
    const generated = next.testRequests.length - before;
    // 5 days at 2-6/day should land between 10 and 30, not collapse to a single day's worth.
    expect(generated).toBeGreaterThanOrEqual(10);
    expect(generated).toBeLessThanOrEqual(30);
  });
});

describe('appReducer — test request expiry and auto-archive', () => {
  it('a submitted request expires after TEST_REQUEST_EXPIRY_DAYS without being scheduled', () => {
    const state = freshState();
    // tr-0403 is seeded as submitted on day 13; "now" is day 14.
    const tr = state.testRequests.find((t) => t.id === 'tr-0403');
    expect(tr.status).toBe('submitted');

    const justUnder = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 2 }); // day 16, 3 days old
    expect(justUnder.testRequests.find((t) => t.id === 'tr-0403').status).toBe('submitted');

    const atThreshold = appReducer(justUnder, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 }); // day 17, 4 days old
    expect(atThreshold.testRequests.find((t) => t.id === 'tr-0403').status).toBe('expired');
  });

  it('an approved request is also subject to expiry, not just submitted ones', () => {
    const state = freshState();
    const tr = state.testRequests.find((t) => t.id === 'tr-0303'); // seeded as approved on day 13
    expect(tr.status).toBe('approved');
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 4 }); // day 18, 5 days old
    expect(next.testRequests.find((t) => t.id === 'tr-0303').status).toBe('expired');
  });

  it('a scheduled (or later) request is never expired, even if it sits for a long time', () => {
    const state = freshState();
    const tr = state.testRequests.find((t) => t.id === 'tr-0233'); // seeded as scheduled
    expect(tr.status).toBe('scheduled');
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 30 });
    expect(next.testRequests.find((t) => t.id === 'tr-0233').status).toBe('scheduled');
  });

  it('an expired request is auto-archived after EXPIRED_TO_ARCHIVED_DAYS, not deleted', () => {
    let state = freshState();
    state = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 3 }); // day 17: tr-0403 expires
    expect(state.testRequests.find((t) => t.id === 'tr-0403').status).toBe('expired');

    const stillExpired = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 6 }); // day 23, 6 days past expiry
    expect(stillExpired.testRequests.find((t) => t.id === 'tr-0403').status).toBe('expired');

    const archived = appReducer(stillExpired, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 2 }); // day 25, 8 days past expiry
    const archivedRequest = archived.testRequests.find((t) => t.id === 'tr-0403');
    expect(archivedRequest.status).toBe('archived');
    expect(archivedRequest).toBeDefined(); // confirms it's relabeled, not removed from the array
  });

  it('an expiry event and an archive event both appear in the event feed', () => {
    let state = freshState();
    state = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 * 3 }); // day 17
    expect(state.eventFeed.some((e) => e.message.includes('TR-0403') && e.message.includes('expired'))).toBe(true);
  });
});

describe('appReducer — daily upkeep and snapshots', () => {
  it('crossing a day boundary charges upkeep once per day elapsed', () => {
    const state = freshState();
    const dailyUpkeep = state.rooms.reduce((sum, r) => sum + r.upkeepPerDay, 0);
    const budgetBefore = state.facility.budget;

    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 });
    expect(next.facility.budget).toBe(budgetBefore - dailyUpkeep);
  });

  it('crossing a day boundary appends exactly one daily snapshot', () => {
    const state = freshState();
    const before = state.dailySnapshots.length;
    const next = appReducer(state, { type: 'TICK_CLOCK', simMinutesElapsed: 1440 });
    expect(next.dailySnapshots.length).toBe(before + 1);
  });

  it('LOAD_STATE backfills missing fields for older save files', () => {
    const state = freshState();
    const oldSave = { ...state };
    delete oldSave.auditLog;
    delete oldSave.consumables;
    delete oldSave.personnel;
    delete oldSave.dailySnapshots;

    const next = appReducer(state, { type: 'LOAD_STATE', state: oldSave });
    expect(next.auditLog).toEqual([]);
    expect(next.consumables).toEqual([]);
    expect(next.personnel).toEqual([]);
    expect(next.dailySnapshots).toEqual([]);
  });
});
