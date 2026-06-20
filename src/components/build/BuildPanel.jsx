import { BENCH_TYPES } from '../../data/catalog.js';
import { useAppDispatch, useAppState } from '../../context/AppContext.jsx';
import { formatMoney, getRoomSlotsUsed, getBenchUtilization, getBenchesForRoom } from '../../data/selectors.js';

export default function BuildPanel({ room, hasEmptySlot, isInteractive }) {
  const state = useAppState();
  const dispatch = useAppDispatch();

  if (room.maxSlots === 0) {
    return (
      <div className="bg-bd-panel border-l border-bd-border-dim p-4 overflow-y-auto">
        <div className="text-[11px] text-bd-text-faint uppercase tracking-wide mb-3">{room.name}</div>
        <div className="border border-dashed border-bd-border-dim rounded-[3px] p-4 text-[11.5px] text-bd-text-faint leading-relaxed">
          Administrative space. No test benches to install or upgrade here.
        </div>
        <div className="border-t border-bd-border-dim mt-4 pt-2.5">
          <div className="text-[11px] text-bd-text-faint uppercase tracking-wide mb-2">Room Stats</div>
          <StatRow label="Upkeep / day" value={formatMoney(room.upkeepPerDay)} />
        </div>
      </div>
    );
  }

  const slotsUsed = getRoomSlotsUsed(state, room.id);
  const utilization = getBenchUtilization(state, room.id);

  // Catalog shown is whatever bench types already exist in this room —
  // matches the spec's per-lab equipment without a separate catalog-by-room map.
  const roomBenchTypeIds = [...new Set(getBenchesForRoom(state, room.id).map((b) => b.benchTypeId))];
  const catalog = roomBenchTypeIds.map((id) => BENCH_TYPES[id]).filter(Boolean);

  function install(benchTypeId) {
    dispatch({ type: 'INSTALL_BENCH', roomId: room.id, benchTypeId });
  }

  if (!isInteractive) {
    return (
      <div className="bg-bd-panel border-l border-bd-border-dim p-4 overflow-y-auto">
        <div className="text-[11px] text-bd-text-faint uppercase tracking-wide mb-3">{room.name}</div>
        <div className="border border-dashed border-bd-border-dim rounded-[3px] p-4 text-[11.5px] text-bd-text-faint leading-relaxed mb-4">
          This laboratory is shown for facility context. Install/upgrade actions aren't wired up for it in v1 — only Ion Propulsion, Fuel Cell Power System, Chemical Thruster, and Thermal Qualification Laboratories are fully interactive right now.
        </div>
        <div className="border-t border-bd-border-dim pt-2.5">
          <div className="text-[11px] text-bd-text-faint uppercase tracking-wide mb-2">Room Stats</div>
          <StatRow label="Slots used" value={`${slotsUsed} / ${room.maxSlots}`} />
          <StatRow label="Avg. utilization" value={`${utilization}%`} />
          <StatRow label="Upkeep / day" value={formatMoney(room.upkeepPerDay)} />
          <StatRow label="Room tier" value={room.tier} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bd-panel border-l border-bd-border-dim p-4 overflow-y-auto">
      <div className="text-[11px] text-bd-text-faint uppercase tracking-wide mb-3">
        {hasEmptySlot ? 'Install — Empty Slot' : 'Bench Catalog'}
      </div>

      {catalog.map((bt) => {
        const affordable = state.facility.budget >= bt.baseCost;
        const disabled = !hasEmptySlot || !affordable;
        return (
          <div key={bt.id} className="border border-bd-border-dim rounded-[3px] p-3 mb-2.5 bg-bd-panel-raised">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[12.5px] font-semibold text-bd-text">{bt.name}</span>
              <span className="text-[12px] text-bd-orange">{formatMoney(bt.baseCost)}</span>
            </div>
            <div className="text-[11px] text-bd-text-dim leading-relaxed mb-2.5">{bt.description}</div>
            <button
              onClick={() => install(bt.id)}
              disabled={disabled}
              className="w-full font-mono text-[11.5px] font-semibold py-1.5 rounded-[2px] border border-bd-orange-dim text-bd-orange hover:bg-bd-orange-glow disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              INSTALL
            </button>
          </div>
        );
      })}

      <div className="border-t border-bd-border-dim mt-2 pt-2.5">
        <div className="text-[11px] text-bd-text-faint uppercase tracking-wide mb-2">Room Stats</div>
        <StatRow label="Slots used" value={`${slotsUsed} / ${room.maxSlots}`} />
        <StatRow label="Avg. utilization" value={`${utilization}%`} />
        <StatRow label="Upkeep / day" value={formatMoney(room.upkeepPerDay)} />
        <StatRow label="Room tier" value={room.tier} />
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-[11.5px] text-bd-text-dim py-1.5">
      <span>{label}</span>
      <span className="text-bd-text font-semibold">{value}</span>
    </div>
  );
}
