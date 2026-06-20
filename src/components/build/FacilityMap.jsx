import { getBenchesForRoom, getBenchUtilization } from '../../data/selectors.js';
import { useAppState } from '../../context/AppContext.jsx';

export default function FacilityMap({ currentRoomId, onSelectRoom }) {
  const state = useAppState();
  const currentRoom = state.rooms.find((r) => r.id === currentRoomId);
  const currentBuilding = currentRoom ? state.buildings.find((b) => b.id === currentRoom.buildingId) : null;

  return (
    <div className="border border-bd-cad-line-bright p-4.5 px-5 relative mt-2">
      <div className="absolute -top-[9px] left-4 bg-bd-bg px-2 text-[10px] text-bd-cad-cyan tracking-wide">
        FACILITY OVERVIEW — SATELLITE POWERTRAIN TEST DEPARTMENT
        {currentBuilding && ` · CURRENT: BUILDING ${currentBuilding.code}`}
      </div>
      <div className="flex flex-col gap-4 mt-2">
        {state.buildings.map((building) => {
          const buildingRooms = state.rooms.filter((r) => r.buildingId === building.id);
          return (
            <div key={building.id}>
              <div className="text-[10px] text-bd-text-faint uppercase tracking-wide mb-1.5">
                BUILDING {building.code} — {building.name.toUpperCase()}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {buildingRooms.map((room) => {
                  const benches = getBenchesForRoom(state, room.id);
                  const util = getBenchUtilization(state, room.id);
                  const isCurrent = room.id === currentRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => onSelectRoom?.(room.id)}
                      className={`border p-3 text-[11px] text-left transition-colors ${
                        isCurrent
                          ? 'border-bd-orange text-bd-orange'
                          : 'border-bd-border-dim text-bd-text-faint hover:border-bd-cad-cyan hover:text-bd-text-dim'
                      }`}
                    >
                      <div className={`text-[12px] font-semibold mb-1 ${isCurrent ? 'text-bd-orange' : 'text-bd-text-dim'}`}>
                        {room.name}
                      </div>
                      <div className="opacity-80">
                        {isCurrent ? `${benches.length}/${room.maxSlots} benches · live` : `${benches.length}/${room.maxSlots} benches · ${util}% util`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
