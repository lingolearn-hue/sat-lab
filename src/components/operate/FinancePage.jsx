import { useAppState } from '../../context/AppContext.jsx';
import {
  formatMoney,
  getTotalUpkeepPerDay,
  getCapexTotal,
  getTransactionsByCategory,
  getCostPerCompletedTest,
} from '../../data/selectors.js';

const CATEGORY_LABELS = {
  bench_purchase: 'Bench Purchases',
  bench_upgrade: 'Bench Upgrades',
  room_expansion: 'Room Expansions',
  facility_upkeep: 'Facility Upkeep',
  test_billing: 'Test Billing',
  consumables: 'Consumables',
  maintenance: 'Maintenance',
  calibration: 'Calibration',
};

export default function FinancePage() {
  const state = useAppState();
  const dailyUpkeep = getTotalUpkeepPerDay(state);
  const capexTotal = getCapexTotal(state);
  const categories = getTransactionsByCategory(state);
  const costPerTest = getCostPerCompletedTest(state);

  const revenueTotal = state.transactions.filter((t) => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const opexTotal = state.transactions.filter((t) => t.type === 'opex').reduce((s, t) => s + Math.abs(t.amount), 0);
  const netTotal = revenueTotal - opexTotal - capexTotal;

  const recentTransactions = [...state.transactions].slice(-12).reverse();

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Finance</div>
      <div className="text-[13px] text-op-text-dim mb-6">Operational financial visibility — revenue, opex, capex</div>

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Kpi label="Budget" value={formatMoney(state.facility.budget)} />
        <Kpi label="Revenue (lifetime)" value={formatMoney(revenueTotal)} accent="teal" />
        <Kpi label="Opex (lifetime)" value={formatMoney(opexTotal)} accent="orange" />
        <Kpi label="Capex (lifetime)" value={formatMoney(capexTotal)} accent="orange" />
        <Kpi label="Net (lifetime)" value={formatMoney(netTotal)} accent={netTotal >= 0 ? 'teal' : 'red'} />
        <Kpi label="Daily Upkeep" value={`${formatMoney(dailyUpkeep)}/day`} />
        <Kpi label="Cost / Completed Test" value={costPerTest != null ? formatMoney(costPerTest) : '—'} sub={costPerTest == null ? 'no completed tests yet' : undefined} />
        <Kpi label="Sim Day" value={state.simClock.day} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
          <div className="px-4.5 py-3.5 border-b border-op-border">
            <div className="text-[13.5px] font-semibold text-op-text">By Category</div>
          </div>
          <div className="p-2.5 flex flex-col gap-1.5">
            {categories.map((c) => (
              <div key={c.category} className="flex items-center justify-between px-3.5 py-2.5 rounded-md bg-op-panel-raised border border-op-border">
                <div>
                  <div className="text-[13px] font-semibold text-op-text">{CATEGORY_LABELS[c.category] || c.category}</div>
                  <div className="text-[11px] text-op-text-faint">{c.count} transaction{c.count !== 1 ? 's' : ''}</div>
                </div>
                <div className={`text-[14px] font-bold tabular-nums ${c.total >= 0 ? 'text-op-teal-dim' : 'text-op-orange'}`}>
                  {formatMoney(c.total)}
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center text-[12.5px] text-op-text-faint py-6">No transactions yet.</div>
            )}
          </div>
        </div>

        <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
          <div className="px-4.5 py-3.5 border-b border-op-border">
            <div className="text-[13.5px] font-semibold text-op-text">Recent Transactions</div>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {recentTransactions.map((t) => (
                <tr key={t.id} className="border-b border-op-border last:border-b-0">
                  <td className="px-4.5 py-2.5 text-[11.5px] text-op-text-faint font-mono whitespace-nowrap">Day {t.simDay}</td>
                  <td className="px-4.5 py-2.5 text-[12.5px] text-op-text">{t.description}</td>
                  <td className={`px-4.5 py-2.5 text-[12.5px] font-semibold text-right tabular-nums whitespace-nowrap ${t.amount >= 0 ? 'text-op-teal-dim' : 'text-op-text-dim'}`}>
                    {formatMoney(t.amount)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td className="px-4.5 py-6 text-center text-[12.5px] text-op-text-faint">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  const accentClass = accent === 'teal' ? 'text-op-teal-dim' : accent === 'orange' ? 'text-op-orange' : accent === 'red' ? 'text-op-red' : 'text-op-text';
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accentClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-op-text-faint mt-1">{sub}</div>}
    </div>
  );
}
