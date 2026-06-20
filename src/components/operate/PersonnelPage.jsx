import { useAppState } from '../../context/AppContext.jsx';
import { QUALIFICATION_DOMAINS } from '../../data/catalog.js';
import { getPersonnelLoad, getRoom } from '../../data/selectors.js';

export default function PersonnelPage() {
  const state = useAppState();
  const personnel = state.personnel || [];

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Personnel</div>
      <div className="text-[13px] text-op-text-dim mb-6">
        Staffing and qualifications across the four staffed laboratories
      </div>

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Kpi label="Total Staff" value={personnel.length} />
        {Object.values(QUALIFICATION_DOMAINS).map((domain) => {
          const qualified = personnel.filter((p) => p.qualification === domain.id);
          const totalCapacity = qualified.length * domain.capacityPerPerson;
          const totalLoad = qualified.reduce((sum, p) => sum + getPersonnelLoad(state, p.id), 0);
          const pct = totalCapacity === 0 ? 0 : Math.round((totalLoad / totalCapacity) * 100);
          return (
            <Kpi
              key={domain.id}
              label={domain.name}
              value={`${totalLoad}/${totalCapacity}`}
              sub={`${qualified.length} staff · ${pct}% loaded`}
              accent={pct >= 100 ? 'orange' : undefined}
            />
          );
        })}
      </div>

      <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
        <div className="px-4.5 py-3.5 border-b border-op-border">
          <div className="text-[13.5px] font-semibold text-op-text">Roster</div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Name', 'Qualification', 'Laboratory', 'Current Load', 'Capacity', 'Status'].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-op-text-faint uppercase tracking-wide px-4.5 py-2.5 border-b border-op-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personnel.map((person) => {
              const domain = QUALIFICATION_DOMAINS[person.qualification];
              const room = domain ? getRoom(state, domain.roomId) : null;
              const load = getPersonnelLoad(state, person.id);
              const atCapacity = domain && load >= domain.capacityPerPerson;
              return (
                <tr key={person.id} className="border-b border-op-border last:border-b-0">
                  <td className="px-4.5 py-3 text-[13px] font-semibold text-op-text">{person.name}</td>
                  <td className="px-4.5 py-3 text-[12.5px] text-op-text-dim">{domain?.name || person.qualification}</td>
                  <td className="px-4.5 py-3 text-[12.5px] text-op-text-dim">{room?.name || '—'}</td>
                  <td className="px-4.5 py-3 text-[13px] tabular-nums text-op-text">{load}</td>
                  <td className="px-4.5 py-3 text-[13px] tabular-nums text-op-text-dim">{domain?.capacityPerPerson ?? '—'}</td>
                  <td className="px-4.5 py-3">
                    <span
                      className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                        atCapacity ? 'bg-[rgba(194,90,24,0.10)] text-op-orange' : load > 0 ? 'bg-op-teal-glow text-op-teal-dim' : 'bg-[rgba(154,161,171,0.14)] text-op-text-dim'
                      }`}
                    >
                      {atCapacity ? 'At Capacity' : load > 0 ? 'Active' : 'Available'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {personnel.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4.5 py-8 text-center text-[12.5px] text-op-text-faint">
                  No personnel on record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[11.5px] text-op-text-faint mt-4 leading-relaxed">
        Capacity reflects how hands-on the work is — Chemical Thruster supervision is hazardous and hands-on
        (low capacity per person), Fuel Cell channel monitoring is mostly passive (high capacity per person).
        A test request can't be scheduled if every qualified person for that laboratory is already at capacity,
        even if a bench is free.
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  const accentClass = accent === 'orange' ? 'text-op-orange' : 'text-op-text';
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accentClass}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-op-text-faint mt-1">{sub}</div>}
    </div>
  );
}
