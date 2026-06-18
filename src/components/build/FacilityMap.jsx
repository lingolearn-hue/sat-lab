import { getBenchesForRoom, getBenchUtilization } from '../../data/selectors.js';
import { useAppState } from '../../context/AppContext.jsx';

export default function FacilityMap({ currentRoomId, onSelectRoom }) {
  const state = useAppState();

  return (
    <div className="border border-bd-cad-line-bright p-4.5 px-5 relative mt-2">
      <div className="absolute -top-[9px] left-4 bg-bd-bg px-2 text-[10px] text-bd-cad-cyan tracking-wide">
        FACILITY OVERVIEW — BUILDING A: ELECTRIC PROPULSION TEST CENTER
      </div>
      <div className="grid grid-cols-3 gap-3 mt-1.5">
        {state.rooms.map((room) => {
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
}
