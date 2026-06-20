import { getBenchType, getExecutionForBench, getPhaseTimeRemaining, formatHoursMinutes } from '../../data/selectors.js';
import { getChannelStatuses, groupChannels, getMaintenanceState } from '../../data/selectors.js';
import { useAppState } from '../../context/AppContext.jsx';

const CHANNEL_COLOR = {
  active: 'bg-bd-orange',
  standby: 'bg-bd-cad-cyan',
  offline: 'bg-bd-border',
  fault: 'bg-[#C03B3B]',
};

export default function BenchTile({ bench }) {
  const state = useAppState();
  const benchType = getBenchType(bench);
  const execution = getExecutionForBench(state, bench.id);
  const timing = execution ? getPhaseTimeRemaining(state, execution) : null;
  const isRunning = bench.status === 'running';
  const hasChannels = !!benchType.channelsByTier;

  if (hasChannels) {
    return <FuelCellChannelTile bench={bench} benchType={benchType} timing={timing} isRunning={isRunning} />;
  }

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

function FuelCellChannelTile({ bench, benchType, timing, isRunning }) {
  const channelStatuses = getChannelStatuses(bench, benchType);
  const groups = groupChannels(channelStatuses);
  const maintenanceState = getMaintenanceState(bench);
  const counts = channelStatuses.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});

  return (
    <div
      className={`col-span-4 border rounded-[2px] bg-bd-panel p-4 flex flex-col gap-3 relative ${
        isRunning ? 'border-bd-orange-dim shadow-[0_0_0_1px_rgba(232,116,44,0.14)]' : 'border-bd-border'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-bd-text-faint">{bench.id.toUpperCase()}</span>
            <span className="text-[10px] px-1.5 py-0.5 border border-bd-border rounded-[2px] text-bd-text-dim">T{bench.tier}</span>
          </div>
          <div className="text-[13px] font-semibold text-bd-text mt-1">{benchType.name}</div>
          <div className="text-[11px] text-bd-text-dim">{channelStatuses.length} channels · {groups.length} groups of 6</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-bd-text-faint">{isRunning ? 'active' : 'idle'}</div>
          <div className={`font-mono text-[13px] font-semibold ${isRunning ? 'text-bd-orange' : 'text-bd-text-faint'}`}>
            {timing && !timing.isDue ? formatHoursMinutes(timing.minutesRemaining) : isRunning ? 'ready' : '—'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-[3px] p-2.5 bg-bd-bg rounded-[2px] border border-bd-border-dim">
        {groups.map((group, gi) => (
          <div key={gi} className="grid grid-cols-3 grid-rows-2 gap-[2px] p-[3px] border border-bd-border-dim rounded-[1px]">
            {group.map((status, ci) => (
              <div
                key={ci}
                title={`Channel ${gi * 6 + ci + 1}: ${status}`}
                className={`w-[7px] h-[7px] rounded-[1px] ${CHANNEL_COLOR[status]}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10.5px] text-bd-text-faint">
        <div className="flex gap-3.5">
          <LegendDot color={CHANNEL_COLOR.active} label={`${counts.active || 0} active`} />
          <LegendDot color={CHANNEL_COLOR.standby} label={`${counts.standby || 0} standby`} />
          <LegendDot color={CHANNEL_COLOR.offline} label={`${counts.offline || 0} offline`} />
          {counts.fault > 0 && <LegendDot color={CHANNEL_COLOR.fault} label={`${counts.fault} fault`} />}
        </div>
        {maintenanceState !== 'ok' && (
          <span className="text-[#C03B3B] font-semibold">⚠ maintenance {maintenanceState}</span>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-[1px] ${color}`} />
      {label}
    </span>
  );
}

function procedureSummary(benchType) {
  return benchType.description;
}
