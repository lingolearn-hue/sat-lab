import { useAppState } from '../../context/AppContext.jsx';
import { getBenchesForRoom, getBenchUtilization, getBenchType, formatMoney } from '../../data/selectors.js';

export default function LaboratoriesPage() {
  const state = useAppState();

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Laboratories</div>
      <div className="text-[13px] text-op-text-dim mb-6">
        Satellite Powertrain Test Department · Digital twin overview of all buildings, rooms, and benches
      </div>

      {state.buildings.map((building) => {
        const buildingRooms = state.rooms.filter((r) => r.buildingId === building.id);
        return (
          <div key={building.id} className="mb-7">
            <div className="text-[11px] font-bold text-op-text-faint uppercase tracking-wide mb-3">
              {building.parentLabel ? `${building.parentLabel} — ${building.name}` : `Building ${building.code} — ${building.name}`}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {buildingRooms.map((room) => {
                const benches = getBenchesForRoom(state, room.id);
                const utilization = getBenchUtilization(state, room.id);
                const runningCount = benches.filter((b) => b.status === 'running').length;

                return (
                  <div key={room.id} className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
                    <div className="px-4.5 py-3.5 border-b border-op-border flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-op-text">{room.name}</div>
                        <div className="text-[11.5px] text-op-text-dim mt-0.5">Tier {room.tier} · {formatMoney(room.upkeepPerDay)}/day upkeep</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[20px] font-bold tabular-nums ${utilization >= 80 ? 'text-op-orange' : 'text-op-teal-dim'}`}>
                          {utilization}%
                        </div>
                        <div className="text-[10.5px] text-op-text-faint uppercase tracking-wide">utilization</div>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      {benches.map((bench) => {
                        const benchType = getBenchType(bench);
                        return (
                          <div key={bench.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-op-panel-raised border border-op-border">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                bench.status === 'running' ? 'bg-op-teal' : bench.status === 'idle' ? 'bg-op-text-faint' : 'bg-op-orange'
                              }`}
                            />
                            <span className="text-[12.5px] text-op-text flex-1 truncate">{benchType.name}</span>
                            <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-op-border text-op-text-faint">T{bench.tier}</span>
                            <span className="font-mono text-[11px] text-op-text-faint">{bench.id.toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-4.5 py-2.5 border-t border-op-border text-[11.5px] text-op-text-dim flex justify-between">
                      <span>{benches.length} / {room.maxSlots} slots used</span>
                      <span>{runningCount} running</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
