import { getBenchType, getExecutionForBench, getPhaseTimeRemaining, formatHoursMinutes, getDut, getProject } from '../../data/selectors.js';
import { useAppState } from '../../context/AppContext.jsx';

const STATUS_DOT = {
  running: 'bg-op-teal',
  idle: 'bg-op-text-faint',
  maintenance_due: 'bg-op-orange',
  calibration_due: 'bg-op-orange',
  out_of_service: 'bg-op-red',
};

export default function BenchStatusCard({ bench }) {
  const state = useAppState();
  const benchType = getBenchType(bench);
  const execution = getExecutionForBench(state, bench.id);
  const testRequest = execution ? state.testRequests.find((tr) => tr.id === execution.testRequestId) : null;
  const dut = testRequest ? getDut(state, testRequest.dutId) : null;

  const timing = execution ? getPhaseTimeRemaining(state, execution) : null;

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 px-3.5 py-2.5 rounded-md bg-op-panel-raised border border-op-border">
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[bench.status] || 'bg-op-text-faint'}`} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="text-[13px] font-semibold text-op-text truncate">{benchType.name}</div>
        <div className="text-[11.5px] text-op-text-dim truncate">
          {dut ? `${dut.name} — ${testRequest && phaseLabel(execution.phase)}` : 'Idle — awaiting assignment'}
        </div>
      </div>
      <div className="font-mono text-[11.5px] text-op-text-faint">{bench.id.toUpperCase()}</div>
      <div className="font-mono text-[13px] font-semibold text-op-teal-dim tabular-nums">
        {timing && !timing.isDue ? formatHoursMinutes(timing.minutesRemaining) : timing ? 'Ready →' : '—'}
      </div>
    </div>
  );
}

function phaseLabel(phase) {
  const labels = { scheduled: 'Setup', running: 'Running', review: 'Review' };
  return labels[phase] || phase;
}
