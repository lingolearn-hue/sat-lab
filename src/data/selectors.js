import { BENCH_TYPES, PROCEDURES } from '../data/catalog.js';

export function getRoom(state, roomId) {
  return state.rooms.find((r) => r.id === roomId);
}

export function getBuilding(state, buildingId) {
  return state.buildings.find((b) => b.id === buildingId);
}

export function getBenchesForRoom(state, roomId) {
  return state.benches.filter((b) => b.roomId === roomId);
}

export function getBenchType(bench) {
  return BENCH_TYPES[bench.benchTypeId];
}

export function getProcedure(procedureId) {
  return PROCEDURES[procedureId];
}

export function getDut(state, dutId) {
  return state.duts.find((d) => d.id === dutId);
}

export function getProject(state, projectId) {
  return state.projects.find((p) => p.id === projectId);
}

export function getExecutionForTestRequest(state, testRequestId) {
  return state.executions.find((e) => e.testRequestId === testRequestId && e.phase !== 'completed');
}

export function getExecutionForBench(state, benchId) {
  return state.executions.find((e) => e.benchId === benchId && e.phase !== 'completed');
}

export function getTestRequestsForRoom(state, roomId) {
  const benchIds = new Set(getBenchesForRoom(state, roomId).map((b) => b.id));
  return state.testRequests.filter(
    (tr) => benchIds.has(tr.assignedBenchId) || (!tr.assignedBenchId && tr.status !== 'archived')
  );
}

// Sim-time math: returns { hoursRemaining, minutesRemaining, fractionComplete, isDue }
export function getPhaseTimeRemaining(state, execution) {
  if (!execution || execution.phaseDurationHours == null) {
    return { totalMinutes: 0, minutesRemaining: 0, fractionComplete: 1, isDue: true };
  }
  const startMinutes = execution.phaseStartedAtSimMinutes;
  const totalMinutes = execution.phaseDurationHours * 60;
  const nowMinutes = state.simClock.day * 1440 + state.simClock.hour * 60 + state.simClock.minute;
  const elapsed = nowMinutes - startMinutes;
  const minutesRemaining = Math.max(0, totalMinutes - elapsed);
  const fractionComplete = totalMinutes === 0 ? 1 : Math.min(1, elapsed / totalMinutes);
  return {
    totalMinutes,
    minutesRemaining,
    fractionComplete,
    isDue: minutesRemaining <= 0,
  };
}

export function formatHoursMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getBenchUtilization(state, roomId) {
  const benches = getBenchesForRoom(state, roomId);
  if (benches.length === 0) return 0;
  const running = benches.filter((b) => b.status === 'running').length;
  return Math.round((running / benches.length) * 100);
}

export function getRoomSlotsUsed(state, roomId) {
  return getBenchesForRoom(state, roomId).length;
}

export function formatMoney(amount) {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(amount)).toLocaleString('en-US')}`;
}

export const TEST_REQUEST_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  scheduled: 'Scheduled',
  running: 'Running',
  review: 'Review',
  completed: 'Completed',
  archived: 'Archived',
};
