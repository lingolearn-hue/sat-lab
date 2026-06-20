import { useAppState } from '../../context/AppContext.jsx';
import { getBenchUtilization, formatMoney } from '../../data/selectors.js';

export default function MobileDashboardPage() {
  const state = useAppState();
  const room = state.rooms[0];
  const benches = state.benches.filter((b) => b.roomId === room.id);
  const running = benches.filter((b) => b.status === 'running').length;
  const waiting = state.testRequests.filter((tr) => ['submitted', 'approved'].includes(tr.status)).length;
  const completed = state.testRequests.filter((tr) => tr.status === 'completed').length;
  const utilization = getBenchUtilization(state, room.id);

  return (
    <div className="px-4 py-4">
      <div className="text-[17px] font-bold text-op-text mb-0.5">Dashboard</div>
      <div className="text-[12.5px] text-op-text-dim mb-4">Real-time facility overview</div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <BigStat label="Running Tests" value={running} accent="teal" />
        <BigStat label="Waiting" value={waiting} />
        <BigStat label="Bench Util." value={`${utilization}%`} accent="teal" />
        <BigStat label="Completed" value={completed} />
      </div>

      <div className="bg-op-panel border border-op-border rounded-xl p-4 mb-3">
        <div className="text-[11px] font-bold text-op-text-faint uppercase tracking-wide mb-1">Budget</div>
        <div className="text-[26px] font-bold text-op-text tabular-nums">{formatMoney(state.facility.budget)}</div>
      </div>

      <div className="bg-op-panel border border-op-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-op-border text-[13px] font-bold text-op-text">Recent Events</div>
        <div>
          {state.eventFeed.slice(0, 6).map((evt) => (
            <div key={evt.id} className="flex gap-3 px-4 py-3 border-b border-op-border last:border-b-0">
              <div className="font-mono text-[10.5px] text-op-text-faint w-9 flex-shrink-0 pt-0.5 tabular-nums">
                {String(evt.simHour).padStart(2, '0')}:{String(evt.simMinute).padStart(2, '0')}
              </div>
              <div className="text-[12.5px] text-op-text-dim leading-snug">{evt.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, accent }) {
  return (
    <div className="bg-op-panel border border-op-border rounded-xl p-3.5">
      <div className="text-[10.5px] text-op-text-faint font-semibold uppercase tracking-wide leading-tight">{label}</div>
      <div className={`text-[24px] font-bold mt-1 tabular-nums ${accent === 'teal' ? 'text-op-teal-dim' : 'text-op-text'}`}>{value}</div>
    </div>
  );
}
