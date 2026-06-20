import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import { CONSUMABLE_TYPES } from '../../data/catalog.js';
import { formatMoney } from '../../data/selectors.js';

export default function ConsumablesPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const consumables = state.consumables || [];

  const lowStockCount = consumables.filter((c) => {
    const type = CONSUMABLE_TYPES[c.id];
    return type && c.stock <= type.lowStockThreshold;
  }).length;

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Consumables</div>
      <div className="text-[13px] text-op-text-dim mb-6">
        Inventory tracking for propellants, gases, and fluids consumed by completed tests
      </div>

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Kpi label="Tracked Items" value={consumables.length} />
        <Kpi label="Low Stock" value={lowStockCount} accent={lowStockCount > 0 ? 'orange' : undefined} />
        <Kpi
          label="Restock Value (if all reordered)"
          value={formatMoney(consumables.reduce((sum, c) => sum + (CONSUMABLE_TYPES[c.id]?.reorderCost || 0), 0))}
        />
        <Kpi label="Current Budget" value={formatMoney(state.facility.budget)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {consumables.map((consumable) => {
          const type = CONSUMABLE_TYPES[consumable.id];
          if (!type) return null;
          const isLow = consumable.stock <= type.lowStockThreshold;
          const stockPct = Math.min(100, Math.round((consumable.stock / (type.lowStockThreshold * 4)) * 100));
          const affordable = state.facility.budget >= type.reorderCost;
          const usedByRooms = type.usedByRoomIds
            .map((id) => state.rooms.find((r) => r.id === id)?.name)
            .filter(Boolean);

          return (
            <div key={consumable.id} className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
              <div className="px-4.5 py-3.5 border-b border-op-border flex items-start justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-op-text">{type.name}</div>
                  <div className="text-[11.5px] text-op-text-dim mt-0.5">Used by: {usedByRooms.join(', ')}</div>
                </div>
                {isLow && (
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[rgba(194,90,24,0.10)] text-op-orange whitespace-nowrap">
                    LOW STOCK
                  </span>
                )}
              </div>
              <div className="p-4.5">
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`text-[26px] font-bold tabular-nums ${isLow ? 'text-op-orange' : 'text-op-text'}`}>
                    {consumable.stock}
                  </span>
                  <span className="text-[12px] text-op-text-dim">{type.unit} in stock</span>
                </div>
                <div className="h-1.5 bg-op-panel-raised rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all ${isLow ? 'bg-op-orange' : 'bg-op-teal'}`}
                    style={{ width: `${stockPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-op-text-faint mb-3">
                  <span>{type.consumptionPerTest} {type.unit} per completed test</span>
                  <span>reorder below {type.lowStockThreshold}</span>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REORDER_CONSUMABLE', consumableId: consumable.id })}
                  disabled={!affordable}
                  className="w-full text-[12.5px] font-semibold text-white bg-op-teal px-3.5 py-2 rounded-md hover:bg-op-teal-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Reorder {type.reorderQuantity} {type.unit} — {formatMoney(type.reorderCost)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  const accentClass = accent === 'orange' ? 'text-op-orange' : 'text-op-text';
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accentClass}`}>{value}</div>
    </div>
  );
}
