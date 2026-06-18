// Other rooms in Building A are not modeled in v1 state yet — shown as
// static contextual reference so the facility feels larger than one room.
// TODO: replace with real Room entities when Building A's other labs are added.
const OTHER_ROOMS = [
  { name: 'Fuel Cell Power Lab', benches: '2/3 benches', util: '51% util' },
  { name: 'Solar Array Lab', benches: '1/2 benches', util: '30% util' },
  { name: 'HIL Lab', benches: '2/2 benches', util: '95% util' },
  { name: 'SIL Lab', benches: '1/2 benches', util: '40% util' },
  { name: 'Satellite Integration', benches: '2/2 benches', util: '88% util' },
];

export default function FacilityMap({ currentRoomName, currentSummary }) {
  return (
    <div className="border border-bd-cad-line-bright p-4.5 px-5 relative mt-2">
      <div className="absolute -top-[9px] left-4 bg-bd-bg px-2 text-[10px] text-bd-cad-cyan tracking-wide">
        FACILITY OVERVIEW — BUILDING A: ELECTRIC PROPULSION TEST CENTER
      </div>
      <div className="grid grid-cols-3 gap-3 mt-1.5">
        <div className="border border-bd-orange p-3 text-[11px] text-bd-orange">
          <div className="text-[12px] font-semibold mb-1">{currentRoomName}</div>
          <div className="opacity-80">{currentSummary}</div>
        </div>
        {OTHER_ROOMS.map((r) => (
          <div key={r.name} className="border border-bd-border-dim p-3 text-[11px] text-bd-text-faint">
            <div className="text-[12px] font-semibold text-bd-text-dim mb-1">{r.name}</div>
            <div className="opacity-80">{r.benches} · {r.util}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
