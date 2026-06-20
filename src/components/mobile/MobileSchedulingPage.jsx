import { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import {
  getBenchesForRoom,
  getRoom,
  getDut,
  getProcedure,
  getExecutionForTestRequest,
  getPhaseTimeRemaining,
  roomForProcedure,
  formatHoursMinutes,
  TEST_REQUEST_STATUS_LABELS,
  formatCalendarWeek,
} from '../../data/selectors.js';
import { getSchedulingAction } from '../operate/SchedulingPage.jsx';
import NewTestRequestModal from '../operate/NewTestRequestModal.jsx';

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

const INTERACTIVE_ROOM_IDS = ['room-ipl', 'room-fcpl', 'room-ctl', 'room-tql'];

export default function MobileSchedulingPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const interactiveRooms = state.rooms.filter((r) => INTERACTIVE_ROOM_IDS.includes(r.id));
  const allBenches = interactiveRooms.flatMap((r) => getBenchesForRoom(state, r.id));
  const runningCount = allBenches.filter((b) => b.status === 'running').length;
  const waitingCount = state.testRequests.filter((tr) => ['submitted', 'approved'].includes(tr.status)).length;
  const visibleRequests = state.testRequests.filter((tr) => tr.status !== 'archived');
  const defaultRoomForModal = interactiveRooms[0];

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[17px] font-bold text-op-text">Scheduling</div>
          <div className="text-[12px] text-op-text-dim">All laboratories</div>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="bg-op-teal text-white font-semibold text-[12.5px] px-3.5 py-2.5 rounded-lg"
        >
          + New
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-op-panel border border-op-border rounded-xl p-3">
          <div className="text-[10.5px] text-op-text-faint font-semibold uppercase">Running</div>
          <div className="text-[22px] font-bold text-op-teal-dim tabular-nums">{runningCount} <span className="text-[13px] text-op-text-faint font-normal">/ {allBenches.length}</span></div>
        </div>
        <div className="bg-op-panel border border-op-border rounded-xl p-3">
          <div className="text-[10.5px] text-op-text-faint font-semibold uppercase">Waiting</div>
          <div className="text-[22px] font-bold text-op-text tabular-nums">{waitingCount}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {visibleRequests.map((tr) => {
          const dut = getDut(state, tr.dutId);
          const procedure = getProcedure(tr.procedure);
          const execution = getExecutionForTestRequest(state, tr.id);
          const timing = execution ? getPhaseTimeRemaining(state, execution) : null;
          const assignedBench = tr.assignedBenchId ? state.benches.find((b) => b.id === tr.assignedBenchId) : null;
          const room = assignedBench ? getRoom(state, assignedBench.roomId) : roomForProcedure(state, tr.procedure);
          const roomBenches = room ? getBenchesForRoom(state, room.id) : [];
          const action = getSchedulingAction(state, tr, execution, timing, roomBenches);

          return (
            <div key={tr.id} className="bg-op-panel border border-op-border rounded-xl p-3.5">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="font-mono text-[11px] text-op-text-faint">{tr.id.toUpperCase()}</div>
                  <div className="text-[14px] font-semibold text-op-text mt-0.5">{dut?.name}</div>
                </div>
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[tr.status] || 'bg-op-panel-raised text-op-text-dim'}`}>
                  {TEST_REQUEST_STATUS_LABELS[tr.status]}
                </span>
              </div>
              <div className="text-[12.5px] text-op-text-dim mb-1">{procedure?.name}</div>
              <div className="flex items-center justify-between text-[11px] text-op-text-faint mb-2.5">
                <span>{room?.name || 'Unassigned lab'}</span>
                <span>Due {formatCalendarWeek(tr.requestedCompletionDay)}</span>
              </div>
              {timing && !timing.isDue && (
                <div className="font-mono text-[12px] text-op-teal-dim mb-2.5 tabular-nums">⏱ {formatHoursMinutes(timing.minutesRemaining)} remaining</div>
              )}
              <MobileActionButton action={action} dispatch={dispatch} testRequest={tr} />
            </div>
          );
        })}
        {visibleRequests.length === 0 && (
          <div className="text-center text-[12.5px] text-op-text-faint py-8">No test requests yet.</div>
        )}
      </div>

      {showNewRequest && defaultRoomForModal && (
        <NewTestRequestModal room={defaultRoomForModal} onClose={() => setShowNewRequest(false)} />
      )}
    </div>
  );
}

function MobileActionButton({ action, dispatch, testRequest }) {
  if (action.kind === 'approve') {
    return (
      <button
        onClick={() => dispatch({ type: 'APPROVE_TEST_REQUEST', testRequestId: testRequest.id })}
        className="w-full text-center text-[13px] font-semibold text-white bg-op-teal py-2.5 rounded-lg"
      >
        Approve
      </button>
    );
  }
  if (action.kind === 'schedule') {
    return (
      <button
        onClick={() => dispatch({ type: 'SCHEDULE_TEST_REQUEST', testRequestId: testRequest.id, benchId: action.benchId })}
        className="w-full text-center text-[13px] font-semibold text-white bg-op-teal py-2.5 rounded-lg"
      >
        Schedule on {action.benchId.toUpperCase()}
      </button>
    );
  }
  if (action.kind === 'advance') {
    return (
      <button
        onClick={() => dispatch({ type: 'ADVANCE_EXECUTION_PHASE', executionId: action.executionId })}
        className="w-full text-center text-[13px] font-semibold text-white bg-op-orange py-2.5 rounded-lg"
      >
        {action.label} →
      </button>
    );
  }
  if (action.kind === 'blocked') {
    return (
      <div className={`w-full text-center text-[12.5px] font-medium py-2.5 rounded-lg border ${action.severity === 'warning' ? 'border-op-orange text-op-orange' : 'border-op-border text-op-text-faint'}`}>
        {action.reason}
      </div>
    );
  }
  if (action.kind === 'waiting') {
    return <div className="w-full text-center text-[12.5px] text-op-text-faint py-2">{action.reason}</div>;
  }
  return null;
}
