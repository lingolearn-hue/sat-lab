import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import {
  getBenchesForRoom,
  getRoom,
  getDut,
  getProcedure,
  getExecutionForTestRequest,
  getPhaseTimeRemaining,
  TEST_REQUEST_STATUS_LABELS,
} from '../../data/selectors.js';
import BenchStatusCard from './BenchStatusCard.jsx';
import NewTestRequestModal from './NewTestRequestModal.jsx';
import { useState } from 'react';

const STATUS_BADGE = {
  running: 'bg-op-teal-glow text-op-teal-dim',
  review: 'bg-[rgba(194,90,24,0.10)] text-op-orange',
  scheduled: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  submitted: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  approved: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  completed: 'bg-op-teal-glow text-op-teal-dim',
  draft: 'bg-[rgba(154,161,171,0.10)] text-op-text-faint',
  archived: 'bg-[rgba(154,161,171,0.10)] text-op-text-faint',
};

// v1: these EPC rooms have a full test-request workflow wired up.
const INTERACTIVE_ROOM_IDS = ['room-ipl', 'room-fcpl'];

export default function SchedulingPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const interactiveRooms = state.rooms.filter((r) => INTERACTIVE_ROOM_IDS.includes(r.id));
  const allBenches = interactiveRooms.flatMap((r) => getBenchesForRoom(state, r.id));

  const runningCount = allBenches.filter((b) => b.status === 'running').length;
  const waitingCount = state.testRequests.filter((tr) => ['submitted', 'approved'].includes(tr.status)).length;
  const completedCount = state.testRequests.filter((tr) => tr.status === 'completed').length;
  const utilization = allBenches.length === 0 ? 0 : Math.round((runningCount / allBenches.length) * 100);

  const visibleRequests = state.testRequests.filter((tr) => tr.status !== 'archived');
  const defaultRoomForModal = interactiveRooms[0];

  return (
    <div className="px-8 py-7">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xl font-bold tracking-tight text-op-text">Scheduling</div>
          <div className="text-[13px] text-op-text-dim mt-1">
            Electric Propulsion Test Center (Building A) · Resource allocation across benches and personnel
          </div>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="bg-op-teal text-white font-semibold text-[13px] px-4 py-2.5 rounded-md hover:bg-op-teal-dim transition-colors"
        >
          + New Test Request
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-7">
        <Kpi label="Running" value={runningCount} delta={`of ${allBenches.length} benches`} />
        <Kpi label="Waiting" value={waitingCount} delta="queued requests" />
        <Kpi label="Bench Util." value={`${utilization}%`} delta="live" accentTeal />
        <Kpi label="Completed" value={completedCount} delta="this scenario" />
        <Kpi label="Avg. Cost / Test" value="$3,140" delta="target $3,000" accentOrange />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
          <div className="px-4.5 py-3.5 border-b border-op-border flex items-center justify-between">
            <div className="text-[13.5px] font-semibold text-op-text">Bench Status</div>
          </div>
          <div className="p-2.5 flex flex-col gap-1.5">
            {interactiveRooms.map((room) => (
              <div key={room.id}>
                <div className="px-1.5 py-1 text-[10.5px] font-semibold text-op-text-faint uppercase tracking-wide">{room.name}</div>
                {getBenchesForRoom(state, room.id).map((bench) => (
                  <BenchStatusCard key={bench.id} bench={bench} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
          <div className="px-4.5 py-3.5 border-b border-op-border">
            <div className="text-[13.5px] font-semibold text-op-text">Event Feed</div>
          </div>
          <div className="py-1.5 max-h-[260px] overflow-y-auto">
            {state.eventFeed.slice(0, 8).map((evt) => (
              <div key={evt.id} className="flex gap-3 px-4.5 py-2.5">
                <div className="font-mono text-[11.5px] text-op-text-faint w-11 flex-shrink-0 pt-px tabular-nums">
                  {String(evt.simHour).padStart(2, '0')}:{String(evt.simMinute).padStart(2, '0')}
                </div>
                <div className="text-[12.5px] text-op-text-dim leading-relaxed">{evt.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden mt-4">
        <div className="px-4.5 py-3.5 border-b border-op-border flex items-center justify-between">
          <div className="text-[13.5px] font-semibold text-op-text">Test Requests — All Laboratories</div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Request', 'Laboratory', 'DUT', 'Procedure', 'Bench', 'Status', 'Due', 'Action'].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-op-text-faint uppercase tracking-wide px-4.5 py-2.5 border-b border-op-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRequests.map((tr) => {
              const dut = getDut(state, tr.dutId);
              const procedure = getProcedure(tr.procedure);
              const execution = getExecutionForTestRequest(state, tr.id);
              const timing = execution ? getPhaseTimeRemaining(state, execution) : null;
              const assignedBench = tr.assignedBenchId ? state.benches.find((b) => b.id === tr.assignedBenchId) : null;
              const room = assignedBench ? getRoom(state, assignedBench.roomId) : roomForProcedure(state, tr.procedure);
              const roomBenches = room ? getBenchesForRoom(state, room.id) : [];
              return (
                <tr key={tr.id} className="border-b border-op-border last:border-b-0">
                  <td className="px-4.5 py-3 font-mono text-[12.5px] text-op-text-dim">{tr.id.toUpperCase()}</td>
                  <td className="px-4.5 py-3 text-[12px] text-op-text-dim">{room?.name || '—'}</td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text">{dut?.name}</td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text">{procedure?.name}</td>
                  <td className="px-4.5 py-3 font-mono text-[12.5px] text-op-text-dim">{tr.assignedBenchId?.toUpperCase() || '—'}</td>
                  <td className="px-4.5 py-3">
                    <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[tr.status] || 'bg-op-panel-raised text-op-text-dim'}`}>
                      {TEST_REQUEST_STATUS_LABELS[tr.status]}
                    </span>
                  </td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text-dim">Day {tr.requestedCompletionDay}</td>
                  <td className="px-4.5 py-3">
                    <RowAction state={state} dispatch={dispatch} testRequest={tr} execution={execution} timing={timing} benches={roomBenches} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNewRequest && defaultRoomForModal && (
        <NewTestRequestModal room={defaultRoomForModal} onClose={() => setShowNewRequest(false)} />
      )}
    </div>
  );
}

// Best-effort room lookup for requests that haven't been assigned a bench yet —
// matches the procedure to whichever bench type in the catalog supports it.
function roomForProcedure(state, procedureId) {
  for (const room of state.rooms) {
    const benches = getBenchesForRoom(state, room.id);
    for (const bench of benches) {
      // local import avoided; check via global catalog through bench type id convention
      if (bench.benchTypeId && procedureSupportsBenchType(procedureId, bench.benchTypeId)) {
        return room;
      }
    }
  }
  return null;
}

function procedureSupportsBenchType(procedureId, benchTypeId) {
  const map = {
    component_drive: ['component'],
    endurance: ['endurance'],
    lifetime: ['endurance'],
    efficiency_mapping: ['perf_mapping'],
    power_consumption: ['perf_mapping'],
    fc_efficiency: ['fuel_cell_stack'],
    fc_load_cycling: ['fuel_cell_stack'],
    fc_thermal: ['fuel_cell_stack'],
  };
  return (map[procedureId] || []).includes(benchTypeId);
}

function RowAction({ state, dispatch, testRequest, execution, timing, benches }) {
  if (testRequest.status === 'submitted') {
    return (
      <button
        onClick={() => dispatch({ type: 'APPROVE_TEST_REQUEST', testRequestId: testRequest.id })}
        className="text-[12px] font-semibold text-op-teal-dim hover:underline"
      >
        Approve
      </button>
    );
  }
  if (testRequest.status === 'approved') {
    const idleBench = benches.find((b) => b.status === 'idle');
    if (!idleBench) {
      return <span className="text-[11.5px] text-op-text-faint">No bench free</span>;
    }
    return (
      <button
        onClick={() => dispatch({ type: 'SCHEDULE_TEST_REQUEST', testRequestId: testRequest.id, benchId: idleBench.id })}
        className="text-[12px] font-semibold text-op-teal-dim hover:underline"
      >
        Schedule on {idleBench.id.toUpperCase()}
      </button>
    );
  }
  if (execution && ['scheduled', 'running', 'review'].includes(execution.phase) && timing?.isDue) {
    const nextLabel = { scheduled: 'Start Test', running: 'Move to Review', review: 'Complete' }[execution.phase];
    return (
      <button
        onClick={() => dispatch({ type: 'ADVANCE_EXECUTION_PHASE', executionId: execution.id })}
        className="text-[12px] font-semibold text-op-orange hover:underline"
      >
        {nextLabel} →
      </button>
    );
  }
  if (execution && timing && !timing.isDue) {
    return <span className="text-[11.5px] text-op-text-faint">In progress…</span>;
  }
  if (testRequest.status === 'completed') {
    return <span className="text-[11.5px] text-op-text-faint">—</span>;
  }
  return null;
}

function Kpi({ label, value, delta, accentTeal, accentOrange }) {
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-[26px] font-bold mt-1.5 tabular-nums ${accentTeal ? 'text-op-teal-dim' : accentOrange ? 'text-op-orange' : 'text-op-text'}`}>
        {value}
      </div>
      <div className="text-[11.5px] text-op-text-dim mt-1">{delta}</div>
    </div>
  );
}
