import { useState } from 'react';
import { useAppState } from '../../context/AppContext.jsx';
import { getBenchUtilization, formatMoney, formatCalendarWeek } from '../../data/selectors.js';
import NewTestRequestModal from './NewTestRequestModal.jsx';

const INTERACTIVE_ROOM_IDS = ['room-ipl', 'room-fcpl', 'room-ctl', 'room-tql'];

export default function DashboardPage() {
  const state = useAppState();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const room = state.rooms[0];
  const benches = state.benches.filter((b) => b.roomId === room.id);
  const running = benches.filter((b) => b.status === 'running').length;
  const waiting = state.testRequests.filter((tr) => ['submitted', 'approved'].includes(tr.status)).length;
  const completed = state.testRequests.filter((tr) => tr.status === 'completed').length;
  const utilization = getBenchUtilization(state, room.id);
  const activeProjects = state.projects.filter((p) => p.status === 'active').length;
  const defaultRoomForModal = state.rooms.find((r) => INTERACTIVE_ROOM_IDS.includes(r.id));

  return (
    <div className="px-8 py-7">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xl font-bold tracking-tight text-op-text mb-1">Dashboard</div>
          <div className="text-[13px] text-op-text-dim">Real-time overview of laboratory operations</div>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="bg-op-teal text-white font-semibold text-[13px] px-4 py-2.5 rounded-md hover:bg-op-teal-dim transition-colors whitespace-nowrap"
        >
          + New Test Request
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Kpi label="Running Tests" value={running} />
        <Kpi label="Waiting Tests" value={waiting} />
        <Kpi label="Completed Tests" value={completed} />
        <Kpi label="Bench Utilization" value={`${utilization}%`} accent />
        <Kpi label="Active Projects" value={activeProjects} />
        <Kpi label="Budget" value={formatMoney(state.facility.budget)} />
        <Kpi label="Personnel Utilization" value="—" sub="not tracked in v1" />
        <Kpi label="Calendar Week" value={formatCalendarWeek(state.simClock.day)} />
      </div>

      <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
        <div className="px-4.5 py-3.5 border-b border-op-border">
          <div className="text-[13.5px] font-semibold text-op-text">Recent Events</div>
        </div>
        <div className="py-1.5">
          {state.eventFeed.slice(0, 10).map((evt) => (
            <div key={evt.id} className="flex gap-3 px-4.5 py-2.5 border-b border-op-border last:border-b-0">
              <div className="font-mono text-[11.5px] text-op-text-faint w-11 flex-shrink-0 pt-px tabular-nums">
                {String(evt.simHour).padStart(2, '0')}:{String(evt.simMinute).padStart(2, '0')}
              </div>
              <div className="text-[12.5px] text-op-text-dim">{evt.message}</div>
            </div>
          ))}
        </div>
      </div>
      {showNewRequest && defaultRoomForModal && (
        <NewTestRequestModal room={defaultRoomForModal} onClose={() => setShowNewRequest(false)} />
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accent ? 'text-op-teal-dim' : 'text-op-text'}`}>{value}</div>
      {sub && <div className="text-[11px] text-op-text-faint mt-1">{sub}</div>}
    </div>
  );
}
