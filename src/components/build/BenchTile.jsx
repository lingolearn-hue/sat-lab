import { getBenchType, getExecutionForBench, getPhaseTimeRemaining, formatHoursMinutes } from '../../data/selectors.js';
import { useAppState } from '../../context/AppContext.jsx';

export default function BenchTile({ bench }) {
  const state = useAppState();
  const benchType = getBenchType(bench);
  const execution = getExecutionForBench(state, bench.id);
  const timing = execution ? getPhaseTimeRemaining(state, execution) : null;
  const isRunning = bench.status === 'running';

  return (
    <div
      className={`border rounded-[2px] bg-bd-panel p-3.5 flex flex-col gap-2.5 relative ${
        isRunning ? 'border-bd-orange-dim shadow-[0_0_0_1px_rgba(232,116,44,0.14)]' : 'border-bd-border'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] text-bd-text-faint">{bench.id.toUpperCase()}</span>
        <span className="text-[10px] px-1.5 py-0.5 border border-bd-border rounded-[2px] text-bd-text-dim">T{bench.tier}</span>
      </div>
      <div>
        <div className="text-[13px] font-semibold text-bd-text">{benchType.name}</div>
        <div className="text-[11px] text-bd-text-dim">{procedureSummary(benchType)}</div>
      </div>
      <div className="h-1 bg-bd-bg rounded-full overflow-hidden">
        <div
          className="h-full bg-bd-orange transition-all"
          style={{ width: `${timing ? Math.round(timing.fractionComplete * 100) : 0}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-bd-text-faint">
        <span>{isRunning ? 'active' : 'idle'}</span>
        <span className={isRunning ? 'text-bd-orange font-semibold' : ''}>
          {timing && !timing.isDue ? formatHoursMinutes(timing.minutesRemaining) : isRunning ? 'ready' : '—'}
        </span>
      </div>
    </div>
  );
}

function procedureSummary(benchType) {
  const summaries = {
    component: 'component-level drive',
    endurance: 'long-duration cycling',
    perf_mapping: 'efficiency mapping',
  };
  return summaries[benchType.id] || benchType.description;
}
