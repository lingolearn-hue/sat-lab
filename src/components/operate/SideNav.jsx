const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▢' },
  { id: 'projects', label: 'Projects', icon: '▣' },
  { id: 'scheduling', label: 'Scheduling', icon: '▦' },
  { id: 'laboratories', label: 'Laboratories', icon: '⌂' },
  { id: 'assets', label: 'Assets', icon: '◫' },
  { id: 'personnel', label: 'Personnel', icon: '◍' },
  { id: 'finance', label: 'Finance', icon: '$' },
];

export default function SideNav({ activePage, onNavigate, roomLabel, roomSummary }) {
  return (
    <div className="bg-op-panel border-r border-op-border p-3 flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium text-left transition-colors ${
            activePage === item.id
              ? 'bg-op-teal-glow text-op-teal-dim'
              : 'text-op-text-dim hover:bg-op-panel-raised hover:text-op-text'
          }`}
        >
          <span className="w-4 inline-block text-center opacity-80">{item.icon}</span>
          {item.label}
        </button>
      ))}
      <div className="text-[10.5px] font-semibold tracking-wide text-op-text-faint uppercase px-3 pt-4 pb-1.5">
        Electric Propulsion Test Center
      </div>
      <div className="px-3 text-xs text-op-text-faint leading-relaxed">
        <span className="font-semibold text-op-text-dim">{roomLabel}</span>
        <br />
        {roomSummary}
      </div>
    </div>
  );
}
