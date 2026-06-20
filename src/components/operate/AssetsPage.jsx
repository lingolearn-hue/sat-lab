import { useAppState } from '../../context/AppContext.jsx';
import { getBenchType, getRoom, formatMoney, formatCalendarWeek } from '../../data/selectors.js';

const STATUS_LABELS = {
  running: 'Running',
  idle: 'Available',
  maintenance_due: 'Maintenance Due',
  calibration_due: 'Calibration Due',
  out_of_service: 'Out of Service',
};

const STATUS_BADGE = {
  running: 'bg-op-teal-glow text-op-teal-dim',
  idle: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  maintenance_due: 'bg-[rgba(194,90,24,0.10)] text-op-orange',
  calibration_due: 'bg-[rgba(194,90,24,0.10)] text-op-orange',
  out_of_service: 'bg-[rgba(192,59,59,0.10)] text-op-red',
};

// Rough modeled service life per bench type, used only to surface a "lifetime used" estimate.
const ASSUMED_LIFETIME_HOURS = 2000;

export default function AssetsPage() {
  const state = useAppState();
  const sortedBenches = [...state.benches].sort((a, b) => a.id.localeCompare(b.id));
  const totalValue = state.benches.reduce((sum, b) => sum + b.purchaseCost, 0);

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Assets</div>
      <div className="text-[13px] text-op-text-dim mb-6">Physical laboratory asset registry — test benches across Electric Propulsion Test Center</div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Kpi label="Total Assets" value={state.benches.length} />
        <Kpi label="Total Asset Value" value={formatMoney(totalValue)} />
        <Kpi label="Running" value={state.benches.filter((b) => b.status === 'running').length} accent="teal" />
        <Kpi label="Needs Attention" value={state.benches.filter((b) => b.status === 'maintenance_due' || b.status === 'calibration_due' || b.status === 'out_of_service').length} accent="orange" />
      </div>

      <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
        <div className="px-4.5 py-3.5 border-b border-op-border">
          <div className="text-[13.5px] font-semibold text-op-text">Test Benches</div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Asset ID', 'Type', 'Laboratory', 'Tier', 'Purchase Date', 'Purchase Cost', 'Hours Used', 'Status'].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-op-text-faint uppercase tracking-wide px-4.5 py-2.5 border-b border-op-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBenches.map((bench) => {
              const benchType = getBenchType(bench);
              const room = getRoom(state, bench.roomId);
              const lifetimeUsedPct = Math.min(100, Math.round((bench.hoursUsed / ASSUMED_LIFETIME_HOURS) * 100));
              return (
                <tr key={bench.id} className="border-b border-op-border last:border-b-0">
                  <td className="px-4.5 py-3 font-mono text-[12.5px] text-op-text-dim">{bench.id.toUpperCase()}</td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text">{benchType?.name || bench.benchTypeId}</td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text-dim">{room?.name}</td>
                  <td className="px-4.5 py-3 text-[12.5px] text-op-text-dim">T{bench.tier}</td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text-dim">{formatCalendarWeek(bench.purchaseDate.day)}</td>
                  <td className="px-4.5 py-3 text-[13px] text-op-text-dim tabular-nums">{formatMoney(bench.purchaseCost)}</td>
                  <td className="px-4.5 py-3 text-[12.5px] text-op-text-dim tabular-nums">
                    {bench.hoursUsed.toLocaleString()}h
                    <span className="text-op-text-faint ml-1.5">({lifetimeUsedPct}% of est. life)</span>
                  </td>
                  <td className="px-4.5 py-3">
                    <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[bench.status] || 'bg-op-panel-raised text-op-text-dim'}`}>
                      {STATUS_LABELS[bench.status] || bench.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  const accentClass = accent === 'teal' ? 'text-op-teal-dim' : accent === 'orange' ? 'text-op-orange' : 'text-op-text';
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accentClass}`}>{value}</div>
    </div>
  );
}
