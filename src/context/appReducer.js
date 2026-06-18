import { BENCH_TYPES, ROOM_EXPANSION_COST_BASE, EXECUTION_PHASE_DURATIONS_HOURS } from '../data/catalog.js';
import { computeExecutionResult } from '../engine/testResults.js';

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, currentRole: action.role };

    case 'LOAD_STATE':
      return action.state;

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

    default:
      return state;
  }
}

// ---- Clock ----

function tickClock(state, simMinutesElapsed) {
  if (!state.simClock.running || simMinutesElapsed <= 0) return state;

  const totalMinutes = dayHourMinuteToTotal(state.simClock.day, state.simClock.hour, state.simClock.minute) + simMinutesElapsed;
  const { day, hour, minute } = totalMinutesToDayHourMinute(totalMinutes);

  return {
    ...state,
    simClock: { ...state.simClock, day, hour, minute },
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
  return addEvent(withRequest, `Test request ${newRequest.id} submitted`, newRequest.id, 'info');
}

function updateTestRequestStatus(state, testRequestId, status) {
  const testRequests = state.testRequests.map((tr) =>
    tr.id === testRequestId ? { ...tr, status } : tr
  );
  const next = { ...state, testRequests };
  return addEvent(next, `Test request ${testRequestId} ${status}`, testRequestId, 'info');
}

function scheduleTestRequest(state, action) {
  const { testRequestId, benchId } = action;
  const bench = state.benches.find((b) => b.id === benchId);
  if (!bench || bench.status !== 'idle') return state;

  const testRequests = state.testRequests.map((tr) =>
    tr.id === testRequestId ? { ...tr, status: 'scheduled', assignedBenchId: benchId } : tr
  );

  const execution = {
    id: nextId('exec'),
    testRequestId,
    benchId,
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
  return addEvent(next, `${testRequestId} scheduled on ${benchId}`, testRequestId, 'info');
}

function advanceExecutionPhase(state, action) {
  const { executionId } = action;
  const execution = state.executions.find((e) => e.id === executionId);
  if (!execution) return state;

  const bench = state.benches.find((b) => b.id === execution.benchId);
  const benchType = bench ? BENCH_TYPES[bench.benchTypeId] : null;

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
    updatedExecution.phaseDurationHours = benchType ? benchType.baseCycleTimeHours : 4;
  } else if (nextPhase === 'review') {
    updatedExecution.phaseDurationHours = EXECUTION_PHASE_DURATIONS_HOURS.review;
    // Compute deterministic result when entering review.
    const testRequest = state.testRequests.find((tr) => tr.id === execution.testRequestId);
    const dut = testRequest ? state.duts.find((d) => d.id === testRequest.dutId) : null;
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

  const next = { ...state, executions, testRequests, benches };
  return addEvent(
    next,
    `${execution.testRequestId} phase advanced to ${capitalize(nextPhase)}`,
    execution.testRequestId,
    nextPhase === 'completed' ? 'success' : 'info'
  );
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
  return addEvent(next, `${benchType.name} installed (${newBench.id})`, newBench.id, 'success');
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
  return addEvent(next, `${benchId} upgraded to Tier ${nextTier}`, benchId, 'success');
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
