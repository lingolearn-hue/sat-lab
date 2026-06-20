import { useState } from 'react';
import { useAppState } from '../../context/AppContext.jsx';
import { formatCalendarWeek } from '../../data/selectors.js';

export default function AuditLogPage() {
  const state = useAppState();
  const [filterRole, setFilterRole] = useState('all');
  const [searchText, setSearchText] = useState('');

  const auditLog = state.auditLog || [];
  const filtered = [...auditLog].reverse().filter((entry) => {
    if (filterRole !== 'all' && entry.role !== filterRole) return false;
    if (searchText && !entry.summary.toLowerCase().includes(searchText.toLowerCase()) && !entry.actionType.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  function exportJson() {
    const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `audit-log-day${state.simClock.day}.json`);
  }

  function exportCsv() {
    const header = ['seq', 'id', 'actionType', 'role', 'simDay', 'simHour', 'simMinute', 'realTimestamp', 'summary'];
    const rows = auditLog.map((e) => header.map((k) => csvEscape(e[k])).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    triggerDownload(blob, `audit-log-day${state.simClock.day}.csv`);
  }

  return (
    <div className="px-8 py-7">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xl font-bold tracking-tight text-op-text">Audit Log</div>
          <div className="text-[13px] text-op-text-dim mt-1">
            Immutable, append-only record of every state-changing action — who, what, and when.
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="text-[12.5px] font-semibold text-op-text-dim px-3.5 py-2 rounded-md border border-op-border hover:bg-op-panel-raised">
            Export CSV
          </button>
          <button onClick={exportJson} className="text-[12.5px] font-semibold text-white bg-op-teal px-3.5 py-2 rounded-md hover:bg-op-teal-dim">
            Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Kpi label="Total Entries" value={auditLog.length} />
        <Kpi label="Capacity" value="2,000" sub="oldest entries roll off past this" />
        <Kpi label="Oldest Entry" value={auditLog[0] ? formatCalendarWeek(auditLog[0].simDay) : '—'} />
        <Kpi label="Latest Entry" value={auditLog.length ? formatCalendarWeek(auditLog[auditLog.length - 1].simDay) : '—'} />
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search actions…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 text-[13px] bg-op-panel border border-op-border rounded-md px-3 py-2 focus:outline-none focus:border-op-teal"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="text-[13px] bg-op-panel border border-op-border rounded-md px-3 py-2 focus:outline-none focus:border-op-teal"
        >
          <option value="all">All roles</option>
          <option value="operator">Operator</option>
          <option value="test_engineer">Test Engineer</option>
          <option value="lab_manager">Laboratory Manager</option>
        </select>
      </div>

      <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Seq', 'Sim Time', 'Role', 'Action', 'Summary', 'Real Timestamp'].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-op-text-faint uppercase tracking-wide px-4.5 py-2.5 border-b border-op-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 300).map((entry) => (
              <tr key={entry.id} className="border-b border-op-border last:border-b-0">
                <td className="px-4.5 py-2.5 font-mono text-[11.5px] text-op-text-faint">{entry.seq}</td>
                <td className="px-4.5 py-2.5 font-mono text-[11.5px] text-op-text-dim whitespace-nowrap">
                  {formatCalendarWeek(entry.simDay)} {String(entry.simHour).padStart(2, '0')}:{String(entry.simMinute).padStart(2, '0')}
                </td>
                <td className="px-4.5 py-2.5 text-[11.5px] text-op-text-dim capitalize whitespace-nowrap">{entry.role?.replace('_', ' ')}</td>
                <td className="px-4.5 py-2.5 font-mono text-[10.5px] text-op-text-faint whitespace-nowrap">{entry.actionType}</td>
                <td className="px-4.5 py-2.5 text-[12.5px] text-op-text">{entry.summary}</td>
                <td className="px-4.5 py-2.5 text-[10.5px] text-op-text-faint whitespace-nowrap">{formatRealTime(entry.realTimestamp)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4.5 py-8 text-center text-[12.5px] text-op-text-faint">
                  No matching entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length > 300 && (
          <div className="px-4.5 py-3 text-center text-[11.5px] text-op-text-faint border-t border-op-border">
            Showing latest 300 of {filtered.length} matching entries. Export for the full record.
          </div>
        )}
      </div>
    </div>
  );
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatRealTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function Kpi({ label, value, sub }) {
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1.5 tabular-nums text-op-text">{value}</div>
      {sub && <div className="text-[10.5px] text-op-text-faint mt-1">{sub}</div>}
    </div>
  );
}
