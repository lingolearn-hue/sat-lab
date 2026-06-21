import {
  BENCH_TYPES,
  PROCEDURES,
  MAINTENANCE_DUE_HOURS,
  MAINTENANCE_OVERDUE_HOURS,
  CALIBRATION_DUE_HOURS,
  QUALIFICATION_DOMAINS,
  hashStringToUnitInterval,
  getProcedureDurationHours,
} from '../data/catalog.js';

export function getRoom(state, roomId) {
  return state.rooms.find((r) => r.id === roomId);
}

// ---- Calendar week date display ----
// simClock.day stays a plain absolute day counter internally (day 1, 2, 3, ...) —
// nothing in the reducer or saved state changes. This is purely a display format:
// CW{week}.{dayOfWeek}, where day 1 = CW1.1 and a 7-day week rolls over to the next
// CW. Used everywhere a day number is shown to the person, instead of "Day N".
export function formatCalendarWeek(day) {
  const safeDay = Math.max(1, Math.floor(day));
  const week = Math.floor((safeDay - 1) / 7) + 1;
  const dayOfWeek = ((safeDay - 1) % 7) + 1;
  return `CW${week}.${dayOfWeek}`;
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

// ---- Test Request detail view: stakeholders, documents, procedure divergence ----
// These derive a sensible baseline from existing data at creation time; the result
// is then stored directly on the test request (stakeholders, divergesFromStandard,
// divergenceNote) so it becomes a normal editable field rather than something
// recomputed (and silently overwritten) every time the detail view opens.

export function deriveDefaultStakeholders(state, { projectId }) {
  const project = getProject(state, projectId);
  const stakeholders = [];
  if (project) {
    stakeholders.push({ name: project.customer, role: 'Customer' });
  }
  stakeholders.push({ name: 'Lab Manager', role: 'Resource Owner' });
  stakeholders.push({ name: 'Test Engineer', role: 'Request Owner' });
  return stakeholders;
}

// Deterministic placeholder documents — not stored in state, regenerated from the
// request's own fields each time the detail view renders. No real file behind these;
// they exist to show what a real LIMS would attach to a test record.
export function getPlaceholderDocuments(state, testRequest) {
  const dut = getDut(state, testRequest.dutId);
  const project = getProject(state, testRequest.projectId);
  const procedure = getProcedure(testRequest.procedure);
  const docs = [];
  if (procedure) docs.push({ name: `Test Procedure — ${procedure.name}.pdf`, kind: 'procedure' });
  if (dut) docs.push({ name: `${dut.name} Datasheet.pdf`, kind: 'datasheet' });
  if (project) docs.push({ name: `Customer PO — ${project.name}.pdf`, kind: 'purchase_order' });
  docs.push({ name: `Calibration Certificate — ${testRequest.id.toUpperCase()}.pdf`, kind: 'calibration' });
  return docs;
}

// ~15% of requests deterministically diverge from the standard procedure at
// creation — a small set of plausible, varied reasons rather than one generic
// note, picked by the same seed so it's reproducible. A person can still edit or
// clear this manually afterward (see UPDATE_TEST_REQUEST_DETAILS in the reducer).
//
// IMPORTANT: seed by a stable, content-derived key (e.g. "day:index" for
// auto-generated requests), never by the request's own assigned id — ids come from
// a sequential, process-global counter (nextId), so two otherwise-identical runs
// can assign different ids to "the same" request and silently break determinism.
// This is exactly the kind of bug that already happened once with the weak hash;
// this one was a seed-choice bug instead, same failure mode.
const DIVERGENCE_REASONS = [
  'Extended thermal soak requested by customer',
  'Reduced sample size due to hardware availability',
  'Additional calibration cycle inserted before test start',
  'Non-standard data logging interval requested',
  'Test sequence reordered to prioritize a customer milestone',
];

export function deriveDefaultDivergence(seedKey) {
  const seed = hashStringToUnitInterval(`divergence:${seedKey}`);
  const diverges = seed < 0.15;
  if (!diverges) return { divergesFromStandard: false, divergenceNote: '' };
  const reasonSeed = hashStringToUnitInterval(`divergence-reason:${seedKey}`);
  const reason = DIVERGENCE_REASONS[Math.floor(reasonSeed * DIVERGENCE_REASONS.length) % DIVERGENCE_REASONS.length];
  return { divergesFromStandard: true, divergenceNote: reason };
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
  expired: 'Expired',
};

// ---- Finance ----

export function getTotalUpkeepPerDay(state) {
  return state.rooms.reduce((sum, r) => sum + r.upkeepPerDay, 0);
}

export function getCapexTotal(state) {
  return state.transactions
    .filter((t) => t.type === 'capex')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function getTransactionsByCategory(state) {
  const groups = {};
  for (const t of state.transactions) {
    if (!groups[t.category]) groups[t.category] = { category: t.category, total: 0, count: 0 };
    groups[t.category].total += t.amount;
    groups[t.category].count += 1;
  }
  return Object.values(groups).sort((a, b) => a.total - b.total);
}

export function getAssetBookValue(state) {
  // Simple straight-line-ish placeholder: book value = purchase cost, no depreciation modeled yet.
  return state.benches.reduce((sum, b) => sum + b.purchaseCost, 0) +
    state.rooms.reduce((sum) => sum, 0); // rooms have no direct purchase cost tracked yet
}

export function getCostPerCompletedTest(state) {
  const completed = state.testRequests.filter((tr) => tr.status === 'completed');
  if (completed.length === 0) return null;
  const capex = getCapexTotal(state);
  const dailyUpkeep = getTotalUpkeepPerDay(state);
  const daysElapsed = Math.max(1, state.simClock.day);
  const totalSpend = capex + dailyUpkeep * daysElapsed;
  return totalSpend / completed.length;
}

export function getDaysUntil(state, targetDay) {
  return targetDay - state.simClock.day;
}

// ---- Maintenance & Calibration (Operator role) ----
// Derived from hoursSinceLastMaintenance/hoursSinceLastCalibration rather than stored
// as a separate status, so it can never drift out of sync with the underlying hours.

export function getMaintenanceState(bench) {
  const hours = bench.hoursSinceLastMaintenance ?? 0;
  if (hours >= MAINTENANCE_OVERDUE_HOURS) return 'overdue';
  if (hours >= MAINTENANCE_DUE_HOURS) return 'due';
  return 'ok';
}

export function getCalibrationState(bench) {
  const hours = bench.hoursSinceLastCalibration ?? 0;
  if (hours >= CALIBRATION_DUE_HOURS) return 'due';
  return 'ok';
}

export function getBenchNeedsAttention(bench) {
  return getMaintenanceState(bench) !== 'ok' || getCalibrationState(bench) !== 'ok' || bench.status === 'out_of_service';
}

export function getMaintenanceTasksForBenches(benches) {
  return benches
    .map((bench) => ({ bench, maintenanceState: getMaintenanceState(bench), calibrationState: getCalibrationState(bench) }))
    .filter((t) => t.maintenanceState !== 'ok' || t.calibrationState !== 'ok' || t.bench.status === 'out_of_service');
}

// ---- Fuel cell channel map ----
// Channels are individually tracked (not just an aggregate %) so the Build-mode
// visualization can show real per-channel variation. Status is derived deterministically
// from bench state + channel index — never random — consistent with the rest of the app.
// Channels are visually grouped in sixes (a "group of 6" reads as one cell block).

export function getChannelCount(bench, benchType) {
  if (!benchType?.channelsByTier) return 0;
  return benchType.channelsByTier[bench.tier] || benchType.channelsByTier[1] || 0;
}

export function getChannelStatuses(bench, benchType) {
  const count = getChannelCount(bench, benchType);
  if (count === 0) return [];

  const maintenanceState = getMaintenanceState(bench);
  const channels = [];

  for (let i = 0; i < count; i++) {
    channels.push(deriveChannelStatus(bench, i, count, maintenanceState));
  }
  return channels;
}

function deriveChannelStatus(bench, index, total, maintenanceState) {
  if (bench.status === 'out_of_service') return 'fault';

  if (bench.status === 'idle') {
    // Idle benches keep a small number of channels in standby rather than fully dark,
    // representing baseline monitoring circuitry — deterministic by index, not random.
    return index % 11 === 0 ? 'standby' : 'offline';
  }

  // Running: most channels active. A maintenance-due bench shows a deterministic
  // pocket of degraded channels proportional to how overdue it is, so the visual
  // tells the same story the Operations page tells in numbers.
  if (maintenanceState !== 'ok') {
    const degradedFraction = maintenanceState === 'overdue' ? 0.22 : 0.08;
    const degradedCount = Math.round(total * degradedFraction);
    if (index < degradedCount) {
      return index % 3 === 0 ? 'fault' : 'standby';
    }
  }

  return 'active';
}

export const CHANNEL_GROUP_SIZE = 6;

export function groupChannels(channelStatuses) {
  const groups = [];
  for (let i = 0; i < channelStatuses.length; i += CHANNEL_GROUP_SIZE) {
    groups.push(channelStatuses.slice(i, i + CHANNEL_GROUP_SIZE));
  }
  return groups;
}

// ---- Gantt chart (Statistics) ----
// One lane per bench in the 4 interactive rooms, with a segment per execution that
// bench has ever run (or is currently running/queued for). Each segment spans real
// sim-days, including the gap between a deferred reservation's creation and its
// actual start — that gap is what makes "schedule for later, leave a gap" visible.
// Read-only: this derives a picture of what's already scheduled, it doesn't let
// the person drag bars around (that's explicitly out of scope for this pass).
const INTERACTIVE_ROOM_IDS_FOR_GANTT = ['room-ipl', 'room-fcpl', 'room-ctl', 'room-tql'];

export function getGanttData(state, { windowStartDay, windowEndDay } = {}) {
  const rooms = state.rooms.filter((r) => INTERACTIVE_ROOM_IDS_FOR_GANTT.includes(r.id));
  const benches = rooms.flatMap((r) => getBenchesForRoom(state, r.id).map((b) => ({ ...b, roomName: r.name })));

  const lanes = benches.map((bench) => {
    const benchExecutions = state.executions.filter((e) => e.benchId === bench.id);
    const segments = benchExecutions
      .map((execution) => {
        const testRequest = state.testRequests.find((tr) => tr.id === execution.testRequestId);
        if (!testRequest) return null;

        // For a deferred (queued) execution, the segment starts when it was first
        // reserved (so the gap before scheduledStartDay is visible as "reserved,
        // not yet running") and ends at a projected finish based on the procedure's
        // expected duration — we don't know the real running duration yet since it
        // hasn't started, so this is an estimate, clearly distinguishable by phase.
        const reservedFromMinutes = execution.phaseStartedAtSimMinutes;
        const reservedFromDay = Math.floor(reservedFromMinutes / 1440);

        let startDay;
        let endDay;
        if (execution.phase === 'queued') {
          startDay = reservedFromDay;
          const estimatedRunHours = getProcedureDurationHoursSafe(testRequest.procedure, testRequest.dutId);
          endDay = execution.scheduledStartDay + Math.ceil(estimatedRunHours / 24);
        } else {
          // Once active, the segment runs from when it actually started running
          // (not from the original reservation day) through its known/estimated
          // completion, using runningPhaseDurationHours when available (set once
          // the running phase begins) or the scheduled/elapsed phase as a fallback.
          startDay = reservedFromDay;
          const runHours = execution.runningPhaseDurationHours
            ?? getProcedureDurationHoursSafe(testRequest.procedure, testRequest.dutId);
          endDay = startDay + Math.max(1, Math.ceil(runHours / 24));
        }

        return {
          executionId: execution.id,
          testRequestId: testRequest.id,
          procedureName: getProcedure(testRequest.procedure)?.name || testRequest.procedure,
          phase: execution.phase,
          startDay,
          endDay,
          isDeferred: execution.phase === 'queued',
        };
      })
      .filter(Boolean)
      .filter((seg) => {
        if (windowStartDay == null || windowEndDay == null) return true;
        return seg.endDay >= windowStartDay && seg.startDay <= windowEndDay;
      });

    return { benchId: bench.id, benchLabel: bench.id.toUpperCase(), roomName: bench.roomName, segments };
  });

  return lanes;
}

function getProcedureDurationHoursSafe(procedureId, dutId) {
  try {
    return getProcedureDurationHours(procedureId, dutId);
  } catch {
    return 24;
  }
}

// ---- Statistics ----

// Facility-wide utilization per day, plus daily throughput (tests completed that day,
// derived from the cumulative counter via day-over-day delta).
export function getFacilityUtilizationTrend(state) {
  const snapshots = state.dailySnapshots || [];
  return snapshots.map((s, i) => {
    const prevCumulative = i > 0 ? snapshots[i - 1].cumulativeCompletedTests : 0;
    return {
      day: s.simDay,
      utilizationPct: s.totalBenches === 0 ? 0 : Math.round((s.totalRunning / s.totalBenches) * 100),
      testsCompletedThatDay: Math.max(0, s.cumulativeCompletedTests - prevCumulative),
      budget: s.budget,
    };
  });
}

export function getRoomUtilizationTrend(state, roomId) {
  const snapshots = state.dailySnapshots || [];
  return snapshots
    .map((s) => {
      const room = s.rooms.find((r) => r.roomId === roomId);
      if (!room) return null;
      return { day: s.simDay, utilizationPct: room.utilizationPct, runningCount: room.runningCount, benchCount: room.benchCount };
    })
    .filter(Boolean);
}

// Current (live, not historical) utilization comparison across all rooms — used for
// the facility overview's room-comparison chart, complementing the day-over-day trend.
export function getCurrentUtilizationByRoom(state) {
  return state.rooms.map((room) => ({
    roomId: room.id,
    name: room.name,
    utilizationPct: getBenchUtilization(state, room.id),
    benchCount: getBenchesForRoom(state, room.id).length,
  }));
}

export function getPassFailStats(state) {
  const completedExecutions = state.executions.filter((e) => e.phase === 'completed' && e.result);
  const passed = completedExecutions.filter((e) => e.result.passed).length;
  const failed = completedExecutions.length - passed;
  return { passed, failed, total: completedExecutions.length };
}

export function getThroughputByProcedure(state) {
  const completedExecutions = state.executions.filter((e) => e.phase === 'completed' && e.result);
  const groups = {};
  for (const exec of completedExecutions) {
    const tr = state.testRequests.find((t) => t.id === exec.testRequestId);
    const procId = tr?.procedure || exec.result.procedure;
    if (!groups[procId]) groups[procId] = { procedureId: procId, count: 0, passed: 0 };
    groups[procId].count += 1;
    if (exec.result.passed) groups[procId].passed += 1;
  }
  return Object.values(groups);
}

// ---- Personnel ----
// Availability/load is derived from active executions, not stored — same pattern
// as bench maintenance state. A person's current load is how many non-completed
// executions currently list them as assignedPersonnelId.

export function getPersonnelLoad(state, personnelId) {
  return state.executions.filter((e) => e.assignedPersonnelId === personnelId && e.phase !== 'completed').length;
}

export function getPersonnelForQualification(state, qualificationId) {
  return state.personnel.filter((p) => p.qualification === qualificationId);
}

// Finds a qualified person with spare capacity for the given domain, or null if
// everyone qualified is already at their cap. This is the personnel-side mirror
// of "find an idle bench" — both must succeed for SCHEDULE_TEST_REQUEST to proceed.
export function findAvailablePersonnel(state, qualificationId) {
  const domain = QUALIFICATION_DOMAINS[qualificationId];
  if (!domain) return null;
  const qualified = getPersonnelForQualification(state, qualificationId);
  for (const person of qualified) {
    const load = getPersonnelLoad(state, person.id);
    if (load < domain.capacityPerPerson) return person;
  }
  return null;
}

export function getQualificationForRoom(roomId) {
  return Object.values(QUALIFICATION_DOMAINS).find((d) => d.roomId === roomId) || null;
}

// Best-effort room lookup for requests that haven't been assigned a bench yet —
// matches the procedure to whichever bench type in the catalog supports it.
// Shared by desktop and mobile Scheduling views so they never drift apart.
const PROCEDURE_TO_BENCH_TYPES = {
  component_drive: ['ion_propulsion_bench'],
  endurance: ['ion_propulsion_bench'],
  lifetime: ['ion_propulsion_bench'],
  efficiency_mapping: ['ion_propulsion_bench'],
  power_consumption: ['ion_propulsion_bench'],
  fc_efficiency: ['fuel_cell_stack'],
  fc_load_cycling: ['fuel_cell_stack'],
  fc_thermal: ['fuel_cell_stack'],
  thrust_characterization: ['chemical_thruster_bench'],
  ignition_reliability: ['chemical_thruster_bench'],
  ct_thermal_performance: ['chemical_thruster_bench'],
  fuel_consumption: ['chemical_thruster_bench'],
  ct_lifetime: ['chemical_thruster_bench'],
  thermal_cycling: ['thermal_chamber_bench'],
  extreme_temp_operation: ['thermal_chamber_bench'],
  thermal_vacuum: ['thermal_chamber_bench'],
  thermal_endurance: ['thermal_chamber_bench'],
};

export function roomForProcedure(state, procedureId) {
  for (const room of state.rooms) {
    const benches = getBenchesForRoom(state, room.id);
    for (const bench of benches) {
      if (bench.benchTypeId && (PROCEDURE_TO_BENCH_TYPES[procedureId] || []).includes(bench.benchTypeId)) {
        return room;
      }
    }
  }
  return null;
}
