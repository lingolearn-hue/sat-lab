import { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import { getBenchesForRoom, getRoomSlotsUsed, formatMoney } from '../../data/selectors.js';
import { ROOM_EXPANSION_COST_BASE, BENCH_TYPES } from '../../data/catalog.js';
import BenchTile from './BenchTile.jsx';
import BuildPanel from './BuildPanel.jsx';
import FacilityOverviewScreen from './FacilityOverviewScreen.jsx';

const BUILDING_ORDER = ['bldg-a1', 'bldg-a2', 'bldg-a3', 'bldg-b', 'bldg-c'];
const INTERACTIVE_ROOM_IDS = ['room-ipl', 'room-fcpl', 'room-ctl', 'room-tql']; // v1: these four rooms have a full install/upgrade economy + test workflow wired

export default function BuildShell() {
  const state = useAppState();
  const [view, setView] = useState('overview'); // 'overview' | 'building'
  const [buildingId, setBuildingId] = useState('bldg-a1');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  function openBuilding(id) {
    setBuildingId(id);
    setSelectedRoomId(null);
    setView('building');
  }

  function cycleBuilding(direction) {
    const idx = BUILDING_ORDER.indexOf(buildingId);
    const nextIdx = (idx + direction + BUILDING_ORDER.length) % BUILDING_ORDER.length;
    setBuildingId(BUILDING_ORDER[nextIdx]);
    setSelectedRoomId(null);
  }

  if (view === 'overview') {
    return (
      <div className="flex bg-bd-bg min-h-0 flex-1 overflow-hidden">
        <FacilityOverviewScreen onSelectBuilding={openBuilding} />
      </div>
    );
  }

  return (
    <BuildingDetailScreen
      state={state}
      buildingId={buildingId}
      selectedRoomId={selectedRoomId}
      onSelectRoom={setSelectedRoomId}
      onCycle={cycleBuilding}
      onBackToOverview={() => setView('overview')}
    />
  );
}

function BuildingDetailScreen({ state, buildingId, selectedRoomId, onSelectRoom, onCycle, onBackToOverview }) {
  const dispatch = useAppDispatch();
  const building = state.buildings.find((b) => b.id === buildingId);
  const rooms = state.rooms.filter((r) => r.buildingId === buildingId);
  const panelRoom = (selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : null) || rooms[0];

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
        <div className="flex items-center justify-between mb-1">
          <button onClick={onBackToOverview} className="text-[11px] text-bd-cad-cyan hover:underline tracking-wide">
            ← OVERVIEW
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => onCycle(-1)} className="text-bd-text-dim hover:text-bd-orange text-[13px] px-1" title="Previous building/floor">‹</button>
            <span className="text-[10.5px] text-bd-text-faint tracking-wide">{building?.parentLabel || `BUILDING ${building?.code}`}</span>
            <button onClick={() => onCycle(1)} className="text-bd-text-dim hover:text-bd-orange text-[13px] px-1" title="Next building/floor">›</button>
          </div>
        </div>

        <div className="text-[19px] font-bold tracking-tight text-bd-text mb-0.5 mt-2">{building?.name}</div>
        <div className="text-xs text-bd-text-dim mb-6">{rooms.length} room{rooms.length !== 1 ? 's' : ''} on this floor</div>

        <div className="flex flex-col gap-7">
          {rooms.map((room) => (
            <RoomBlock key={room.id} room={room} state={state} dispatch={dispatch} isFocused={panelRoom?.id === room.id} onFocus={() => onSelectRoom(room.id)} />
          ))}
          {rooms.length === 0 && (
            <div className="text-[12.5px] text-bd-text-faint border border-dashed border-bd-border p-8 text-center">
              No rooms assigned to this floor.
            </div>
          )}
        </div>

        <div className="absolute bottom-3.5 right-4.5 text-[10.5px] text-bd-cad-cyan opacity-60 tracking-wide">
          X 412.0 · Y 188.5 · Z 0.0
        </div>
      </div>

      <BuildPanel
        room={panelRoom}
        hasEmptySlot={panelRoom ? isRoomInteractive(panelRoom) && getRoomSlotsUsed(state, panelRoom.id) < panelRoom.maxSlots : false}
        isInteractive={panelRoom ? isRoomInteractive(panelRoom) : false}
      />
    </div>
  );
}

function isRoomInteractive(room) {
  return INTERACTIVE_ROOM_IDS.includes(room.id);
}

function RoomBlock({ room, state, dispatch, isFocused, onFocus }) {
  const benches = getBenchesForRoom(state, room.id);
  const slotsUsed = getRoomSlotsUsed(state, room.id);
  const emptySlots = Math.max(0, room.maxSlots - slotsUsed);
  const expansionCost = ROOM_EXPANSION_COST_BASE * room.tier;
  const isInteractive = isRoomInteractive(room);
  const isOffice = room.maxSlots === 0;

  return (
    <div
      onClick={onFocus}
      className={`border p-6 pt-7 relative cursor-pointer transition-colors ${
        isFocused ? 'border-bd-orange' : 'border-bd-cad-cyan hover:border-bd-cad-cyan'
      }`}
      style={{ boxShadow: isFocused ? '0 0 0 1px rgba(232,116,44,0.2)' : '0 0 0 1px rgba(63,168,173,0.15)' }}
    >
      <div className="absolute -top-[9px] left-4 bg-bd-bg px-2 text-[10px] text-bd-cad-cyan tracking-wide">
        {room.name.toUpperCase()} — {(7.2 + room.tier * 1.2).toFixed(1)}m × 5.2m
      </div>
      {!isOffice && (
        <div className="absolute -top-[9px] right-4 bg-bd-bg px-1.5 text-[9.5px] text-bd-cad-cyan opacity-55">
          {room.maxSlots} SLOTS
        </div>
      )}

      {isOffice ? (
        <div className="py-6 text-center text-[12px] text-bd-text-faint">
          Administrative space — no test benches.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {benches.map((bench) => (
              <BenchTile key={bench.id} bench={bench} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} />
            ))}
          </div>
          <div className="text-[10.5px] text-bd-cad-cyan opacity-70 mt-3 tracking-wide">
            {slotsUsed} / {room.maxSlots} BENCH SLOTS USED · UPKEEP {formatMoney(room.upkeepPerDay)}/DAY
            {!isInteractive && ' · VIEW ONLY IN V1'}
          </div>

          {isInteractive && (
            <div className="flex gap-2.5 items-center mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
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
          )}
        </>
      )}
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
