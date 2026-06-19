import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import {
  getBenchType,
  getRoom,
  getExecutionForBench,
  getPhaseTimeRemaining,
  formatHoursMinutes,
  getMaintenanceState,
  getCalibrationState,
  getDut,
  formatMoney,
} from '../../data/selectors.js';
import { MAINTENANCE_COST, CALIBRATION_COST, MAINTENANCE_DUE_HOURS, CALIBRATION_DUE_HOURS } from '../../data/catalog.js';

const STATUS_DOT = {
  running: 'bg-op-teal',
  idle: 'bg-op-text-faint',
  out_of_service: 'bg-op-red',
};

export default function OperationsPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const allBenches = state.benches;

  const runningBenches = allBenches.filter((b) => b.status === 'running');
  const needsAttention = allBenches.filter(
    (b) => getMaintenanceState(b) !== 'ok' || getCalibrationState(b) !== 'ok' || b.status === 'out_of_service'
  );
  const idleBenches = allBenches.filter((b) => b.status === 'idle' && !needsAttention.includes(b));

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Operations</div>
      <div className="text-[13px] text-op-text-dim mb-6">My tasks, running tests, and equipment status across Electric Propulsion Test Center</div>

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Kpi label="Running" value={runningBenches.length} />
        <Kpi label="Needs Attention" value={needsAttention.length} accent={needsAttention.length > 0 ? 'orange' : undefined} />
        <Kpi label="Idle / Available" value={idleBenches.length} />
        <Kpi label="Total Benches" value={allBenches.length} />
      </div>

      {needsAttention.length > 0 && (
        <Section title="My Tasks — Needs Attention">
          <div className="flex flex-col gap-1.5">
            {needsAttention.map((bench) => (
              <TaskCard key={bench.id} bench={bench} state={state} dispatch={dispatch} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Running Tests">
        <div className="flex flex-col gap-1.5">
          {runningBenches.map((bench) => (
            <RunningCard key={bench.id} bench={bench} state={state} />
          ))}
          {runningBenches.length === 0 && (
            <EmptyRow text="No benches currently running." />
          )}
        </div>
      </Section>

      <Section title="Equipment Status — All Benches">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Asset', 'Laboratory', 'Status', 'Maintenance', 'Calibration', 'Action'].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-op-text-faint uppercase tracking-wide px-4.5 py-2.5 border-b border-op-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBenches.map((bench) => {
              const benchType = getBenchType(bench);
              const room = getRoom(state, bench.roomId);
              const maint = getMaintenanceState(bench);
              const calib = getCalibrationState(bench);
              return (
                <tr key={bench.id} className="border-b border-op-border last:border-b-0">
                  <td className="px-4.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[bench.status] || 'bg-op-text-faint'}`} />
                      <span className="font-mono text-[12.5px] text-op-text-dim">{bench.id.toUpperCase()}</span>
                      <span className="text-[13px] text-op-text">{benchType.name}</span>
                    </div>
                  </td>
                  <td className="px-4.5 py-3 text-[12.5px] text-op-text-dim">{room?.name}</td>
                  <td className="px-4.5 py-3 text-[12.5px] capitalize text-op-text-dim">{bench.status.replace('_', ' ')}</td>
                  <td className="px-4.5 py-3">
                    <MaintBadge state={maint} hours={bench.hoursSinceLastMaintenance} threshold={MAINTENANCE_DUE_HOURS} />
                  </td>
                  <td className="px-4.5 py-3">
                    <MaintBadge state={calib === 'ok' ? 'ok' : 'due'} hours={bench.hoursSinceLastCalibration} threshold={CALIBRATION_DUE_HOURS} />
                  </td>
                  <td className="px-4.5 py-3">
                    <ActionLinks bench={bench} dispatch={dispatch} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function TaskCard({ bench, state, dispatch }) {
  const benchType = getBenchType(bench);
  const room = getRoom(state, bench.roomId);
  const maint = getMaintenanceState(bench);
  const calib = getCalibrationState(bench);
  const blocked = bench.status === 'running';

  return (
    <div className="flex items-center gap-3.5 px-3.5 py-3 rounded-md bg-[rgba(194,90,24,0.05)] border border-[rgba(194,90,24,0.25)]">
      <span className={`w-2 h-2 rounded-full ${bench.status === 'out_of_service' ? 'bg-op-red' : 'bg-op-orange'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-op-text">
          {benchType.name} <span className="font-mono text-op-text-faint text-[11.5px]">{bench.id.toUpperCase()}</span>
        </div>
        <div className="text-[11.5px] text-op-text-dim">
          {room?.name}
          {bench.status === 'out_of_service' && ' · Out of service'}
          {maint !== 'ok' && ` · Maintenance ${maint} (${Math.round(bench.hoursSinceLastMaintenance)}h since last)`}
          {calib !== 'ok' && ` · Calibration due (${Math.round(bench.hoursSinceLastCalibration)}h since last)`}
        </div>
      </div>
      <ActionLinks bench={bench} dispatch={dispatch} />
      {blocked && <span className="text-[11px] text-op-text-faint whitespace-nowrap">finishes test first</span>}
    </div>
  );
}

function ActionLinks({ bench, dispatch }) {
  const maint = getMaintenanceState(bench);
  const calib = getCalibrationState(bench);
  const blocked = bench.status === 'running';

  return (
    <div className="flex gap-3 whitespace-nowrap">
      {maint !== 'ok' && (
        <button
          disabled={blocked}
          onClick={() => dispatch({ type: 'PERFORM_MAINTENANCE', benchId: bench.id })}
          className="text-[12px] font-semibold text-op-teal-dim hover:underline disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
        >
          Perform Maintenance ({formatMoney(MAINTENANCE_COST)})
        </button>
      )}
      {calib !== 'ok' && (
        <button
          disabled={blocked}
          onClick={() => dispatch({ type: 'PERFORM_CALIBRATION', benchId: bench.id })}
          className="text-[12px] font-semibold text-op-teal-dim hover:underline disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
        >
          Calibrate ({formatMoney(CALIBRATION_COST)})
        </button>
      )}
      {maint === 'ok' && calib === 'ok' && <span className="text-[11.5px] text-op-text-faint">—</span>}
    </div>
  );
}

function RunningCard({ bench, state }) {
  const benchType = getBenchType(bench);
  const room = getRoom(state, bench.roomId);
  const execution = getExecutionForBench(state, bench.id);
  const testRequest = execution ? state.testRequests.find((tr) => tr.id === execution.testRequestId) : null;
  const dut = testRequest ? getDut(state, testRequest.dutId) : null;
  const timing = execution ? getPhaseTimeRemaining(state, execution) : null;

  return (
    <div className="flex items-center gap-3.5 px-3.5 py-3 rounded-md bg-op-panel-raised border border-op-border">
      <span className="w-2 h-2 rounded-full bg-op-teal" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-op-text">
          {benchType.name} <span className="font-mono text-op-text-faint text-[11.5px]">{bench.id.toUpperCase()}</span>
        </div>
        <div className="text-[11.5px] text-op-text-dim">
          {room?.name}{dut ? ` · ${dut.name}` : ''}
        </div>
      </div>
      <div className="font-mono text-[13px] font-semibold text-op-teal-dim tabular-nums">
        {timing && !timing.isDue ? formatHoursMinutes(timing.minutesRemaining) : timing ? 'Ready →' : '—'}
      </div>
    </div>
  );
}

function MaintBadge({ state, hours }) {
  const rounded = Math.round(hours || 0);
  if (state === 'ok') {
    return <span className="text-[11.5px] text-op-text-faint">OK · {rounded}h</span>;
  }
  if (state === 'overdue') {
    return <span className="inline-flex items-center text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(192,59,59,0.10)] text-op-red">Overdue · {rounded}h</span>;
  }
  return <span className="inline-flex items-center text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(194,90,24,0.10)] text-op-orange">Due · {rounded}h</span>;
}

function Section({ title, children }) {
  return (
    <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden mb-4">
      <div className="px-4.5 py-3.5 border-b border-op-border">
        <div className="text-[13.5px] font-semibold text-op-text">{title}</div>
      </div>
      <div className="p-2.5">{children}</div>
    </div>
  );
}

function EmptyRow({ text }) {
  return <div className="text-center text-[12.5px] text-op-text-faint py-6">{text}</div>;
}

function Kpi({ label, value, accent }) {
  const accentClass = accent === 'orange' ? 'text-op-orange' : 'text-op-text';
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accentClass}`}>{value}</div>
    </div>
  );
}
