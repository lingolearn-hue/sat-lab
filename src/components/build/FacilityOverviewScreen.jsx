import { useAppState } from '../../context/AppContext.jsx';
import { getBenchesForRoom, getBenchUtilization } from '../../data/selectors.js';

export default function FacilityOverviewScreen({ onSelectBuilding }) {
  const state = useAppState();
  const buildingsById = Object.fromEntries(state.buildings.map((b) => [b.id, b]));
  const aFloors = ['bldg-a1', 'bldg-a2', 'bldg-a3'].map((id) => buildingsById[id]).filter(Boolean);
  const others = ['bldg-b', 'bldg-c'].map((id) => buildingsById[id]).filter(Boolean);

  return (
    <div
      className="flex-1 px-8 py-7 overflow-y-auto font-mono"
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
      <div className="text-[11.5px] text-bd-text-faint mb-1 tracking-wide">SATELLITE POWERTRAIN TEST DEPARTMENT</div>
      <div className="text-[19px] font-bold tracking-tight text-bd-text mb-0.5">Facility Overview</div>
      <div className="text-xs text-bd-text-dim mb-6">Select a building or floor to inspect</div>

      <div className="grid grid-cols-[1fr_1fr_1fr] gap-5 max-w-[920px]">
        <div className="flex flex-col gap-3">
          <FloorGroupLabel label="Building A — Electric Propulsion Test Center" />
          {aFloors.map((b) => (
            <BuildingCard key={b.id} building={b} state={state} onSelect={onSelectBuilding} compact />
          ))}
        </div>
        {others.map((b) => (
          <div key={b.id} className="flex flex-col gap-3">
            <FloorGroupLabel label={`Building ${b.code}`} />
            <BuildingCard building={b} state={state} onSelect={onSelectBuilding} tall />
          </div>
        ))}
      </div>
    </div>
  );
}

function FloorGroupLabel({ label }) {
  return <div className="text-[10px] text-bd-cad-cyan uppercase tracking-wide opacity-80 h-7 flex items-end">{label}</div>;
}

function BuildingCard({ building, state, onSelect, compact, tall }) {
  const rooms = state.rooms.filter((r) => r.buildingId === building.id);
  const allBenches = rooms.flatMap((r) => getBenchesForRoom(state, r.id));
  const runningCount = allBenches.filter((b) => b.status === 'running').length;
  const avgUtil = rooms.length === 0
    ? 0
    : Math.round(rooms.reduce((sum, r) => sum + getBenchUtilization(state, r.id), 0) / rooms.length);

  return (
    <button
      onClick={() => onSelect(building.id)}
      className={`border border-bd-border text-left p-4 rounded-[2px] bg-bd-panel hover:border-bd-orange-dim transition-colors flex flex-col justify-between ${
        compact ? 'min-h-[108px]' : tall ? 'min-h-[368px]' : 'min-h-[160px]'
      }`}
    >
      <div>
        <div className="text-[10px] text-bd-text-faint">{building.code}</div>
        <div className="text-[14px] font-semibold text-bd-text mt-1">{building.name}</div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[10.5px] text-bd-text-faint mb-1.5">
          <span>{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
          <span>{allBenches.length} bench{allBenches.length !== 1 ? 'es' : ''}</span>
        </div>
        <div className="h-1 bg-bd-bg rounded-full overflow-hidden">
          <div
            className={`h-full ${avgUtil >= 80 ? 'bg-bd-orange' : 'bg-bd-cad-cyan'}`}
            style={{ width: `${avgUtil}%` }}
          />
        </div>
        <div className="text-[10px] text-bd-text-faint mt-1.5">{avgUtil}% avg. util · {runningCount} running</div>
      </div>
    </button>
  );
}
