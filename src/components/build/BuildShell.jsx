import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import { getBenchesForRoom, getRoomSlotsUsed, formatMoney } from '../../data/selectors.js';
import { ROOM_EXPANSION_COST_BASE, BENCH_TYPES } from '../../data/catalog.js';
import BenchTile from './BenchTile.jsx';
import BuildPanel from './BuildPanel.jsx';
import FacilityMap from './FacilityMap.jsx';

export default function BuildShell() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const room = state.rooms[0];
  const benches = getBenchesForRoom(state, room.id);
  const slotsUsed = getRoomSlotsUsed(state, room.id);
  const emptySlots = Math.max(0, room.maxSlots - slotsUsed);
  const expansionCost = ROOM_EXPANSION_COST_BASE * room.tier;

  return (
    <div className="grid grid-cols-[1fr_280px] bg-bd-bg min-h-0 flex-1 overflow-hidden font-mono">
      <div
        className="relative px-8 py-7 overflow-y-auto"
        style={{
          backgroundColor: 'var(--color-bd-bg)',
          backgroundImage: `
            linear-gradient(var(--color-bd-cad-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-bd-cad-line) 1px, transparent 1px),
            linear-gradient(var(--color-bd-cad-line-bright) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-bd-cad-line-bright) 1px, transparent 1px)
          `,
          backgroundSize: '14px 14px, 14px 14px, 70px 70px, 70px 70px',
          backgroundPosition: '-1px -1px',
        }}
      >
        <div className="absolute top-3.5 right-4.5 text-[10px] text-bd-text-faint text-right leading-relaxed opacity-70">
          DWG: EPC-IPL-A3<br />SCALE 1:50
        </div>

        <div className="text-[11.5px] text-bd-text-faint mb-1 tracking-wide">
          SATELLITE POWERTRAIN TEST DEPT → <span className="text-bd-orange">ELECTRIC PROPULSION TEST CENTER</span> → ION PROPULSION LAB
        </div>
        <div className="text-[19px] font-bold tracking-tight text-bd-text mb-0.5">{room.name}</div>
        <div className="text-xs text-bd-text-dim mb-5">Building A · Electric Propulsion Test Center · room tier {room.tier}</div>

        <div className="border border-bd-cad-cyan p-6 pt-7 relative mb-2" style={{ boxShadow: '0 0 0 1px rgba(63,168,173,0.15)' }}>
          <div className="absolute -top-[9px] left-4 bg-bd-bg px-2 text-[10px] text-bd-cad-cyan tracking-wide">
            ROOM ENVELOPE — {(4 + room.tier * 1.2).toFixed(1)}m × 5.2m
          </div>
          <div className="absolute -top-[9px] right-4 bg-bd-bg px-1.5 text-[9.5px] text-bd-cad-cyan opacity-55">
            {room.maxSlots} SLOTS
          </div>
          <div className="grid grid-cols-4 gap-4">
            {benches.map((bench) => (
              <BenchTile key={bench.id} bench={bench} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} />
            ))}
          </div>
        </div>
        <div className="text-[10.5px] text-bd-cad-cyan opacity-70 mb-5 tracking-wide">
          {slotsUsed} / {room.maxSlots} BENCH SLOTS USED · UPKEEP {formatMoney(room.upkeepPerDay)}/DAY
        </div>

        <div className="flex gap-2.5 items-center mb-8 flex-wrap">
          <ActionButton
            primary
            label="+ EXPAND ROOM"
            cost={formatMoney(expansionCost)}
            disabled={state.facility.budget < expansionCost}
            onClick={() => dispatch({ type: 'EXPAND_ROOM', roomId: room.id })}
          />
          {benches.map((bench) => {
            const benchType = BENCH_TYPES[bench.benchTypeId];
            const nextTier = bench.tier + 1;
            const cost = benchType.upgradeCost[nextTier];
            if (cost === undefined) return null;
            return (
              <ActionButton
                key={bench.id}
                label={`⤒ UPGRADE ${bench.id.toUpperCase()}`}
                cost={formatMoney(cost)}
                disabled={state.facility.budget < cost}
                onClick={() => dispatch({ type: 'UPGRADE_BENCH', benchId: bench.id })}
              />
            );
          })}
        </div>

        <FacilityMap
          currentRoomName={room.name}
          currentSummary={`${slotsUsed}/${room.maxSlots} benches · live`}
        />

        <div className="absolute bottom-3.5 right-4.5 text-[10.5px] text-bd-cad-cyan opacity-60 tracking-wide">
          X 412.0 · Y 188.5 · Z 0.0
        </div>
      </div>

      <BuildPanel room={room} hasEmptySlot={emptySlots > 0} />
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="border border-dashed border-bd-cad-line-bright flex items-center justify-center flex-col text-bd-text-faint text-xs min-h-[112px] cursor-default">
      <div className="text-[22px] mb-1">+</div>
      <div>Install bench</div>
    </div>
  );
}

function ActionButton({ label, cost, primary, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-xs font-semibold px-3.5 py-2.5 rounded-[3px] flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        primary
          ? 'bg-bd-orange text-[#2A0F00] border border-bd-orange'
          : 'bg-bd-panel-raised border border-bd-border text-bd-text hover:border-bd-orange-dim'
      }`}
    >
      {label}
      <span className={primary ? 'opacity-75' : 'text-bd-orange'}>{cost}</span>
    </button>
  );
}
