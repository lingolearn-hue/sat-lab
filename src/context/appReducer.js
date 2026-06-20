import {
  BENCH_TYPES,
  PROCEDURES,
  ROOM_EXPANSION_COST_BASE,
  EXECUTION_PHASE_DURATIONS_HOURS,
  MAINTENANCE_DUE_HOURS,
  MAINTENANCE_OVERDUE_HOURS,
  MAINTENANCE_DURATION_HOURS,
  CALIBRATION_DURATION_HOURS,
  MAINTENANCE_COST,
  CALIBRATION_COST,
  CONSUMABLE_TYPES,
  MIN_TIER_FOR_ENDURANCE,
  getProcedureDurationHours,
} from '../data/catalog.js';
import { computeExecutionResult } from '../engine/testResults.js';
import { getQualificationForRoom, findAvailablePersonnel } from '../data/selectors.js';

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// Action types that don't represent a discrete user/system "action" worth an audit
// entry on their own — TICK_CLOCK fires every second while the sim runs. Anything
// meaningful that happens *during* a tick (wear crossing a threshold, daily upkeep,
// daily snapshot) is logged separately, at the point it happens, with its own entry.
const AUDIT_EXCLUDED_ACTIONS = new Set(['TICK_CLOCK', 'LOAD_STATE']);

// Public entry point: runs the real reducer, then appends one immutable audit
// entry summarizing the dispatched action — who (role), what, when (sim + real time).
// The audit log is append-only: nothing in appendAuditEntry ever mutates or removes
// an existing entry, only adds. Capped by AUDIT_LOG_MAX_ENTRIES to bound storage,
// per the agreed "limited by app storage" constraint — this is a practical limit,
// not a deliberate truncation of history for any other reason.
export function appReducer(state, action) {
  const prevState = state;
  const nextState = coreReducer(state, action);

  if (nextState === prevState || AUDIT_EXCLUDED_ACTIONS.has(action.type)) {
    return nextState;
  }

  return appendAuditEntry(nextState, prevState, action);
}

const AUDIT_LOG_MAX_ENTRIES = 2000;

function appendAuditEntry(state, prevState, action) {
  const entry = {
    id: nextId('audit'),
    seq: (state.auditLog?.length || 0) + 1,
    actionType: action.type,
    role: state.currentRole,
    simDay: state.simClock.day,
    simHour: state.simClock.hour,
    simMinute: state.simClock.minute,
    realTimestamp: new Date().toISOString(),
    summary: summarizeAction(action, prevState, state),
  };

  const auditLog = [...(state.auditLog || []), entry];
  const trimmed = auditLog.length > AUDIT_LOG_MAX_ENTRIES ? auditLog.slice(auditLog.length - AUDIT_LOG_MAX_ENTRIES) : auditLog;

  return { ...state, auditLog: trimmed };
}

// Human-readable one-line summary per action type, built from the action payload —
// not from diffing the whole state tree, which would be noisy and harder to read.
function summarizeAction(action, prevState, nextState) {
  switch (action.type) {
    case 'SET_ROLE':
      return `Role switched: ${prevState.currentRole} → ${action.role}`;
    case 'SET_CLOCK_SPEED':
      return `Sim clock speed changed to ×${action.speedMultiplier}`;
    case 'TOGGLE_CLOCK_RUNNING':
      return `Sim clock ${nextState.simClock.running ? 'resumed' : 'paused'}`;
    case 'SUBMIT_TEST_REQUEST':
      return `Test request submitted: ${action.dutId} / ${action.procedure}`;
    case 'APPROVE_TEST_REQUEST':
      return `Test request ${action.testRequestId.toUpperCase()} approved`;
    case 'SCHEDULE_TEST_REQUEST':
      return `Test request ${action.testRequestId.toUpperCase()} scheduled on ${action.benchId.toUpperCase()}`;
    case 'ADVANCE_EXECUTION_PHASE':
      return `Execution ${action.executionId} phase advanced`;
    case 'ARCHIVE_TEST_REQUEST':
      return `Test request ${action.testRequestId.toUpperCase()} archived`;
    case 'INSTALL_BENCH':
      return `Bench installed: ${action.benchTypeId} in ${action.roomId}`;
    case 'UPGRADE_BENCH':
      return `Bench upgraded: ${action.benchId.toUpperCase()}`;
    case 'EXPAND_ROOM':
      return `Room expanded: ${action.roomId}`;
    case 'PERFORM_MAINTENANCE':
      return `Maintenance performed: ${action.benchId.toUpperCase()}`;
    case 'PERFORM_CALIBRATION':
      return `Calibration performed: ${action.benchId.toUpperCase()}`;
    case 'REORDER_CONSUMABLE':
      return `Consumable reordered: ${action.consumableId}`;
    case 'ADD_EVENT':
      return action.message;
    default:
      return action.type;
  }
}

function coreReducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, currentRole: action.role };

    case 'LOAD_STATE':
      return { dailySnapshots: [], auditLog: [], consumables: [], personnel: [], ...action.state };

    case 'TICK_CLOCK':
      return tickClock(state, action.simMinutesElapsed);

    case 'SET_CLOCK_SPEED':
      return { ...state, simClock: { ...state.simClock, speedMultiplier: action.speedMultiplier } };

    case 'TOGGLE_CLOCK_RUNNING':
      return { ...state, simClock: { ...state.simClock, running: !state.simClock.running } };

    case 'SUBMIT_TEST_REQUEST':
      return submitTestRequest(state, action);

    case 'APPROVE_TEST_REQUEST':
      return updateTestRequestStatus(state, action.testRequestId, 'approved');

    case 'SCHEDULE_TEST_REQUEST':
      return scheduleTestRequest(state, action);

    case 'ADVANCE_EXECUTION_PHASE':
      return advanceExecutionPhase(state, action);

    case 'ARCHIVE_TEST_REQUEST':
      return updateTestRequestStatus(state, action.testRequestId, 'archived');

    case 'INSTALL_BENCH':
      return installBench(state, action);

    case 'UPGRADE_BENCH':
      return upgradeBench(state, action);

    case 'EXPAND_ROOM':
      return expandRoom(state, action);

    case 'ADD_EVENT':
      return addEvent(state, action.message, action.relatedEntityId, action.severity);

    case 'PERFORM_MAINTENANCE':
      return performMaintenance(state, action);

    case 'PERFORM_CALIBRATION':
      return performCalibration(state, action);

    case 'REORDER_CONSUMABLE':
      return reorderConsumable(state, action);

    default:
      return state;
  }
}

// ---- Clock ----

function tickClock(state, simMinutesElapsed) {
  if (!state.simClock.running || simMinutesElapsed <= 0) return state;

  const totalMinutes = dayHourMinuteToTotal(state.simClock.day, state.simClock.hour, state.simClock.minute) + simMinutesElapsed;
  const { day, hour, minute } = totalMinutesToDayHourMinute(totalMinutes);

  let next = {
    ...state,
    simClock: { ...state.simClock, day, hour, minute },
  };

  const simHoursElapsed = simMinutesElapsed / 60;
  next = accrueBenchWear(next, simHoursElapsed);

  const daysPassed = day - state.simClock.day;
  if (daysPassed > 0) {
    next = chargeDailyUpkeep(next, daysPassed);
    next = recordDailySnapshot(next);
  }

  return next;
}

// One snapshot per sim-day, capturing facility- and room-level metrics at the
// moment the day rolls over. This is the only history mechanism in the app —
// nothing else retroactively reconstructs past state, so the Statistics screen
// is only as deep as how much sim-time has actually elapsed since this was added.
function recordDailySnapshot(state) {
  const roomSnapshots = state.rooms.map((room) => {
    const benches = state.benches.filter((b) => b.roomId === room.id);
    const runningCount = benches.filter((b) => b.status === 'running').length;
    return {
      roomId: room.id,
      benchCount: benches.length,
      runningCount,
      utilizationPct: benches.length === 0 ? 0 : Math.round((runningCount / benches.length) * 100),
    };
  });

  const completedToday = state.testRequests.filter(
    (tr) => tr.status === 'completed'
  ).length; // cumulative completed count at snapshot time; trend is computed from deltas between days

  const snapshot = {
    simDay: state.simClock.day,
    budget: state.facility.budget,
    totalBenches: state.benches.length,
    totalRunning: state.benches.filter((b) => b.status === 'running').length,
    cumulativeCompletedTests: completedToday,
    rooms: roomSnapshots,
  };

  const dailySnapshots = [...(state.dailySnapshots || []), snapshot].slice(-90); // cap history to last 90 days
  return { ...state, dailySnapshots };
}

function accrueBenchWear(state, hoursElapsed) {
  if (hoursElapsed <= 0) return state;
  let events = [];

  const benches = state.benches.map((bench) => {
    if (bench.status !== 'running') return bench;

    const wasMaintOk = (bench.hoursSinceLastMaintenance ?? 0) < MAINTENANCE_DUE_HOURS;
    const updated = {
      ...bench,
      hoursUsed: bench.hoursUsed + hoursElapsed,
      hoursSinceLastMaintenance: (bench.hoursSinceLastMaintenance ?? 0) + hoursElapsed,
      hoursSinceLastCalibration: (bench.hoursSinceLastCalibration ?? 0) + hoursElapsed,
    };

    if (wasMaintOk && updated.hoursSinceLastMaintenance >= MAINTENANCE_DUE_HOURS) {
      events.push({ message: `${bench.id.toUpperCase()} maintenance now due`, relatedEntityId: bench.id, severity: 'warning' });
    }
    if (updated.hoursSinceLastMaintenance >= MAINTENANCE_OVERDUE_HOURS && bench.status !== 'out_of_service') {
      events.push({ message: `${bench.id.toUpperCase()} overdue for maintenance — taken out of service`, relatedEntityId: bench.id, severity: 'warning' });
      updated.status = 'out_of_service';
    }

    return updated;
  });

  let next = { ...state, benches };
  for (const evt of events) {
    next = addEvent(next, evt.message, evt.relatedEntityId, evt.severity);
  }
  return next;
}

function chargeDailyUpkeep(state, daysPassed) {
  const dailyUpkeep = state.rooms.reduce((sum, r) => sum + r.upkeepPerDay, 0);
  if (dailyUpkeep <= 0) return state;
  const totalCharge = dailyUpkeep * daysPassed;

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'opex',
    category: 'facility_upkeep',
    amount: -totalCharge,
    description: `Daily facility upkeep (${daysPassed} day${daysPassed > 1 ? 's' : ''})`,
  };

  return {
    ...state,
    facility: { ...state.facility, budget: state.facility.budget - totalCharge },
    transactions: [...state.transactions, transaction],
  };
}

function dayHourMinuteToTotal(day, hour, minute) {
  return day * 1440 + hour * 60 + minute;
}

function totalMinutesToDayHourMinute(totalMinutes) {
  const day = Math.floor(totalMinutes / 1440);
  const remAfterDay = totalMinutes % 1440;
  const hour = Math.floor(remAfterDay / 60);
  const minute = Math.floor(remAfterDay % 60);
  return { day, hour, minute };
}

function currentSimMinutes(state) {
  return dayHourMinuteToTotal(state.simClock.day, state.simClock.hour, state.simClock.minute);
}

// ---- Test Request workflow ----

function submitTestRequest(state, action) {
  const newRequest = {
    id: nextId('tr'),
    projectId: action.projectId,
    dutId: action.dutId,
    procedure: action.procedure,
    priority: action.priority || 'normal',
    requestedCompletionDay: action.requestedCompletionDay,
    status: 'submitted',
    assignedBenchId: null,
  };
  const withRequest = { ...state, testRequests: [...state.testRequests, newRequest] };
  return addEvent(withRequest, `Test request ${newRequest.id.toUpperCase()} submitted`, newRequest.id, 'info');
}

function updateTestRequestStatus(state, testRequestId, status) {
  const testRequests = state.testRequests.map((tr) =>
    tr.id === testRequestId ? { ...tr, status } : tr
  );
  const next = { ...state, testRequests };
  return addEvent(next, `Test request ${testRequestId.toUpperCase()} ${status}`, testRequestId, 'info');
}

function scheduleTestRequest(state, action) {
  const { testRequestId, benchId } = action;
  const testRequest = state.testRequests.find((tr) => tr.id === testRequestId);
  if (!testRequest || testRequest.status !== 'approved') return state; // enforce Approved -> Scheduled order

  const bench = state.benches.find((b) => b.id === benchId);
  if (!bench || bench.status !== 'idle') return state;

  // Endurance-category procedures require the bench to already be upgraded to
  // MIN_TIER_FOR_ENDURANCE — this is the "the test run requires the update" rule:
  // any tier can run performance-style procedures, but endurance access is gated
  // on the physical bench having been upgraded first.
  const procedureDef = PROCEDURES[testRequest.procedure];
  if (procedureDef?.category === 'endurance' && bench.tier < MIN_TIER_FOR_ENDURANCE) {
    return state;
  }

  const qualification = getQualificationForRoom(bench.roomId);
  const person = qualification ? findAvailablePersonnel(state, qualification.id) : null;
  // Rooms with no qualification domain defined (the view-only rooms) don't require
  // personnel — only the four interactive rooms have a real staffing constraint.
  if (qualification && !person) return state;

  const testRequests = state.testRequests.map((tr) =>
    tr.id === testRequestId ? { ...tr, status: 'scheduled', assignedBenchId: benchId } : tr
  );

  const execution = {
    id: nextId('exec'),
    testRequestId,
    benchId,
    assignedPersonnelId: person ? person.id : null,
    phase: 'scheduled',
    phaseStartedAtSimMinutes: currentSimMinutes(state),
    phaseDurationHours: EXECUTION_PHASE_DURATIONS_HOURS.scheduled,
    result: null,
  };

  const benches = state.benches.map((b) =>
    b.id === benchId ? { ...b, status: 'running', currentExecutionId: execution.id } : b
  );

  const next = {
    ...state,
    testRequests,
    executions: [...state.executions, execution],
    benches,
  };
  const personNote = person ? ` (supervised by ${person.name})` : '';
  return addEvent(next, `${testRequestId.toUpperCase()} scheduled on ${benchId.toUpperCase()}${personNote}`, testRequestId, 'info');
}

function advanceExecutionPhase(state, action) {
  const { executionId } = action;
  const execution = state.executions.find((e) => e.id === executionId);
  if (!execution) return state;

  const bench = state.benches.find((b) => b.id === execution.benchId);
  const testRequest = state.testRequests.find((tr) => tr.id === execution.testRequestId);
  const dut = testRequest ? state.duts.find((d) => d.id === testRequest.dutId) : null;

  const phaseOrder = ['scheduled', 'running', 'review', 'completed'];
  const currentIndex = phaseOrder.indexOf(execution.phase);
  const nextPhase = phaseOrder[currentIndex + 1];
  if (!nextPhase) return state;

  let updatedExecution = {
    ...execution,
    phase: nextPhase,
    phaseStartedAtSimMinutes: currentSimMinutes(state),
  };

  if (nextPhase === 'running') {
    const runningHours = testRequest
      ? getProcedureDurationHours(testRequest.procedure, testRequest.dutId)
      : 4;
    updatedExecution.phaseDurationHours = runningHours;
    updatedExecution.runningPhaseDurationHours = runningHours; // preserved through review/completed for revenue billing
  } else if (nextPhase === 'review') {
    updatedExecution.phaseDurationHours = EXECUTION_PHASE_DURATIONS_HOURS.review;
    // Compute deterministic result when entering review.
    if (testRequest && dut && bench) {
      updatedExecution.result = computeExecutionResult({
        dut,
        procedure: testRequest.procedure,
        benchTier: bench.tier,
      });
    }
  } else if (nextPhase === 'completed') {
    updatedExecution.phaseDurationHours = null;
  }

  const executions = state.executions.map((e) => (e.id === executionId ? updatedExecution : e));

  let testRequests = state.testRequests;
  let benches = state.benches;

  if (nextPhase === 'running') {
    testRequests = testRequests.map((tr) =>
      tr.id === execution.testRequestId ? { ...tr, status: 'running' } : tr
    );
  } else if (nextPhase === 'review') {
    testRequests = testRequests.map((tr) =>
      tr.id === execution.testRequestId ? { ...tr, status: 'review' } : tr
    );
  } else if (nextPhase === 'completed') {
    testRequests = testRequests.map((tr) =>
      tr.id === execution.testRequestId ? { ...tr, status: 'completed' } : tr
    );
    benches = benches.map((b) =>
      b.id === execution.benchId ? { ...b, status: 'idle', currentExecutionId: null } : b
    );
  }

  let next = { ...state, executions, testRequests, benches };

  if (nextPhase === 'completed') {
    next = chargeTestRevenue(next, updatedExecution, bench);
    next = consumeForExecution(next, bench);
  }

  return addEvent(
    next,
    `${execution.testRequestId.toUpperCase()} phase advanced to ${capitalize(nextPhase)}`,
    execution.testRequestId,
    nextPhase === 'completed' ? 'success' : 'info'
  );
}

const REVENUE_PER_CYCLE_HOUR = 145; // billing rate baked into test pricing

function chargeTestRevenue(state, execution, bench) {
  // Revenue is billed for the hours the test actually ran (procedure-driven duration,
  // captured when entering 'running' and preserved through review/completed), not a
  // static per-bench-type number — consistent with the generic-bench consolidation.
  const cycleHours = execution.runningPhaseDurationHours ?? 4;
  const passed = execution.result?.passed;
  // Passed tests bill full rate; failed tests still bill (lab time was spent) but at a discount.
  const revenue = Math.round(cycleHours * REVENUE_PER_CYCLE_HOUR * (passed === false ? 0.6 : 1));

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'revenue',
    category: 'test_billing',
    amount: revenue,
    description: `${execution.testRequestId.toUpperCase()} billed to customer${passed === false ? ' (reduced rate — failed test)' : ''}`,
  };

  return {
    ...state,
    facility: { ...state.facility, budget: state.facility.budget + revenue },
    transactions: [...state.transactions, transaction],
  };
}

// ---- Consumables ----

function consumeForExecution(state, bench) {
  if (!bench) return state;
  const applicable = Object.values(CONSUMABLE_TYPES).filter((c) => c.usedByRoomIds.includes(bench.roomId));
  if (applicable.length === 0) return state;

  let next = state;
  for (const consumableType of applicable) {
    next = consumeStock(next, consumableType.id, consumableType.consumptionPerTest);
  }
  return next;
}

function consumeStock(state, consumableId, amount) {
  const consumables = state.consumables.map((c) =>
    c.id === consumableId ? { ...c, stock: Math.max(0, c.stock - amount) } : c
  );

  const consumableType = CONSUMABLE_TYPES[consumableId];
  const updated = consumables.find((c) => c.id === consumableId);
  let next = { ...state, consumables };

  // Fire a low-stock warning once, at the moment stock crosses the threshold
  // going downward — not on every tick while it stays low.
  const before = state.consumables.find((c) => c.id === consumableId);
  if (before && before.stock > consumableType.lowStockThreshold && updated.stock <= consumableType.lowStockThreshold) {
    next = addEvent(
      next,
      `${consumableType.name} stock low (${updated.stock} ${consumableType.unit} remaining) — reorder recommended`,
      consumableId,
      'warning'
    );
  }

  return next;
}

function reorderConsumable(state, action) {
  const { consumableId } = action;
  const consumableType = CONSUMABLE_TYPES[consumableId];
  if (!consumableType) return state;
  if (state.facility.budget < consumableType.reorderCost) return state;

  const consumables = state.consumables.map((c) =>
    c.id === consumableId ? { ...c, stock: c.stock + consumableType.reorderQuantity } : c
  );

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'opex',
    category: 'consumables',
    amount: -consumableType.reorderCost,
    description: `Reordered ${consumableType.reorderQuantity} ${consumableType.unit} of ${consumableType.name}`,
  };

  const next = {
    ...state,
    consumables,
    facility: { ...state.facility, budget: state.facility.budget - consumableType.reorderCost },
    transactions: [...state.transactions, transaction],
  };
  return addEvent(next, `${consumableType.name} restocked (+${consumableType.reorderQuantity} ${consumableType.unit})`, consumableId, 'success');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Build mode: benches & rooms ----

function installBench(state, action) {
  const { roomId, benchTypeId } = action;
  const room = state.rooms.find((r) => r.id === roomId);
  const benchType = BENCH_TYPES[benchTypeId];
  if (!room || !benchType) return state;

  const slotsUsed = state.benches.filter((b) => b.roomId === roomId).length;
  if (slotsUsed >= room.maxSlots) return state;
  if (state.facility.budget < benchType.baseCost) return state;

  const newBench = {
    id: nextId('bnc'),
    roomId,
    benchTypeId,
    tier: 1,
    status: 'idle',
    currentExecutionId: null,
    purchaseDate: { day: state.simClock.day },
    purchaseCost: benchType.baseCost,
    hoursUsed: 0,
  };

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'capex',
    category: 'bench_purchase',
    amount: -benchType.baseCost,
    description: `Installed ${newBench.id} (${benchType.name})`,
  };

  const next = {
    ...state,
    benches: [...state.benches, newBench],
    facility: { ...state.facility, budget: state.facility.budget - benchType.baseCost },
    transactions: [...state.transactions, transaction],
  };
  return addEvent(next, `${benchType.name} installed (${newBench.id.toUpperCase()})`, newBench.id, 'success');
}

function upgradeBench(state, action) {
  const { benchId } = action;
  const bench = state.benches.find((b) => b.id === benchId);
  if (!bench) return state;
  const benchType = BENCH_TYPES[bench.benchTypeId];
  const nextTier = bench.tier + 1;
  if (nextTier > benchType.maxTier) return state;

  const cost = benchType.upgradeCost[nextTier];
  if (cost === undefined || state.facility.budget < cost) return state;

  const benches = state.benches.map((b) => (b.id === benchId ? { ...b, tier: nextTier } : b));
  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'capex',
    category: 'bench_upgrade',
    amount: -cost,
    description: `Upgraded ${benchId} to Tier ${nextTier}`,
  };

  const next = {
    ...state,
    benches,
    facility: { ...state.facility, budget: state.facility.budget - cost },
    transactions: [...state.transactions, transaction],
  };
  return addEvent(next, `${benchId.toUpperCase()} upgraded to Tier ${nextTier}`, benchId, 'success');
}

// ---- Operator actions: maintenance & calibration ----

function performMaintenance(state, action) {
  const { benchId } = action;
  const bench = state.benches.find((b) => b.id === benchId);
  if (!bench) return state;
  if (bench.status === 'running') return state; // can't pull a bench mid-test

  const benches = state.benches.map((b) =>
    b.id === benchId ? { ...b, status: 'idle', hoursSinceLastMaintenance: 0 } : b
  );

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'opex',
    category: 'maintenance',
    amount: -MAINTENANCE_COST,
    description: `Maintenance performed on ${benchId.toUpperCase()}`,
  };

  const next = {
    ...state,
    benches,
    facility: { ...state.facility, budget: state.facility.budget - MAINTENANCE_COST },
    transactions: [...state.transactions, transaction],
  };
  return addEvent(next, `${benchId.toUpperCase()} maintenance completed`, benchId, 'success');
}

function performCalibration(state, action) {
  const { benchId } = action;
  const bench = state.benches.find((b) => b.id === benchId);
  if (!bench) return state;
  if (bench.status === 'running') return state;

  const benches = state.benches.map((b) =>
    b.id === benchId ? { ...b, hoursSinceLastCalibration: 0 } : b
  );

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'opex',
    category: 'calibration',
    amount: -CALIBRATION_COST,
    description: `Calibration performed on ${benchId.toUpperCase()}`,
  };

  const next = {
    ...state,
    benches,
    facility: { ...state.facility, budget: state.facility.budget - CALIBRATION_COST },
    transactions: [...state.transactions, transaction],
  };
  return addEvent(next, `${benchId.toUpperCase()} calibration completed`, benchId, 'success');
}

function expandRoom(state, action) {
  const { roomId } = action;
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return state;

  const cost = ROOM_EXPANSION_COST_BASE * room.tier;
  if (state.facility.budget < cost) return state;

  const rooms = state.rooms.map((r) =>
    r.id === roomId ? { ...r, tier: r.tier + 1, maxSlots: r.maxSlots + 1, upkeepPerDay: Math.round(r.upkeepPerDay * 1.15) } : r
  );

  const transaction = {
    id: nextId('txn'),
    simDay: state.simClock.day,
    type: 'capex',
    category: 'room_expansion',
    amount: -cost,
    description: `Expanded ${room.name}`,
  };

  const next = {
    ...state,
    rooms,
    facility: { ...state.facility, budget: state.facility.budget - cost },
    transactions: [...state.transactions, transaction],
  };
  return addEvent(next, `${room.name} expanded to Tier ${room.tier + 1}`, roomId, 'success');
}

// ---- Event feed ----

function addEvent(state, message, relatedEntityId, severity = 'info') {
  const event = {
    id: nextId('evt'),
    simDay: state.simClock.day,
    simHour: state.simClock.hour,
    simMinute: state.simClock.minute,
    message,
    relatedEntityId,
    severity,
  };
  const eventFeed = [event, ...state.eventFeed].slice(0, 100);
  return { ...state, eventFeed };
}
