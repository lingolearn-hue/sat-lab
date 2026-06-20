import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppState } from '../../context/AppContext.jsx';
import {
  getFacilityUtilizationTrend,
  getRoomUtilizationTrend,
  getCurrentUtilizationByRoom,
  getPassFailStats,
  getThroughputByProcedure,
  getProcedure,
  formatMoney,
  formatCalendarWeek,
} from '../../data/selectors.js';

const TEAL = '#1E8A7C';
const ORANGE = '#C25A18';
const RED = '#C03B3B';
const GRID = '#E3E6EA';

export default function StatisticsPage() {
  const state = useAppState();
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const facilityTrend = getFacilityUtilizationTrend(state);
  const roomComparison = getCurrentUtilizationByRoom(state);
  const passFail = getPassFailStats(state);
  const throughputByProcedure = getThroughputByProcedure(state);
  const hasHistory = facilityTrend.length >= 2;

  const selectedRoom = state.rooms.find((r) => r.id === selectedRoomId);
  const roomTrend = selectedRoomId ? getRoomUtilizationTrend(state, selectedRoomId) : [];

  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">Statistics</div>
      <div className="text-[13px] text-op-text-dim mb-6">Bench utilization, throughput, and quality trends across the facility</div>

      <div className="grid grid-cols-4 gap-3 mb-7">
        <Kpi label="Days Tracked" value={facilityTrend.length} sub={!hasHistory ? 'history builds day by day' : undefined} />
        <Kpi label="Tests Completed" value={passFail.total} />
        <Kpi label="Pass Rate" value={passFail.total > 0 ? `${Math.round((passFail.passed / passFail.total) * 100)}%` : '—'} accent="teal" />
        <Kpi label="Current Budget" value={formatMoney(state.facility.budget)} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Panel title="Facility Utilization Trend">
          {hasHistory ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={facilityTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tickFormatter={(d) => formatCalendarWeek(d)} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip formatter={(v) => `${v}%`} labelFormatter={(d) => formatCalendarWeek(d)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="utilizationPct" stroke={TEAL} strokeWidth={2} dot={false} name="Utilization %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Utilization trend builds up as sim-days pass. Let the clock run to see history accumulate." />
          )}
        </Panel>

        <Panel title="Daily Throughput (Tests Completed)">
          {hasHistory ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={facilityTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tickFormatter={(d) => formatCalendarWeek(d)} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip labelFormatter={(d) => formatCalendarWeek(d)} contentStyle={tooltipStyle} />
                <Bar dataKey="testsCompletedThatDay" fill={TEAL} radius={[3, 3, 0, 0]} name="Tests Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Throughput trend builds up as sim-days pass." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Panel title="Utilization by Laboratory (Live)">
          <ResponsiveContainer width="100%" height={Math.max(180, roomComparison.length * 36)}>
            <BarChart data={roomComparison} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={170}
                tick={<ClickableRoomTick onSelect={setSelectedRoomId} rooms={roomComparison} />}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={tooltipStyle} />
              <Bar
                dataKey="utilizationPct"
                radius={[0, 3, 3, 0]}
                onClick={(data) => setSelectedRoomId(data.roomId)}
                cursor="pointer"
                minPointSize={2}
              >
                {roomComparison.map((r) => (
                  <Cell key={r.roomId} fill={r.utilizationPct >= 80 ? ORANGE : TEAL} cursor="pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[11px] text-op-text-faint text-center mt-1">Click a bar or laboratory name to drill in</div>
        </Panel>

        <Panel title="Pass / Fail — All Completed Tests">
          {passFail.total > 0 ? (
            <div className="flex items-center gap-6 px-2">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={[{ name: 'Passed', value: passFail.passed }, { name: 'Failed', value: passFail.failed }]}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    <Cell fill={TEAL} />
                    <Cell fill={RED} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5">
                <LegendRow color={TEAL} label="Passed" value={passFail.passed} />
                <LegendRow color={RED} label="Failed" value={passFail.failed} />
                <div className="text-[11.5px] text-op-text-faint mt-1">{passFail.total} total completed</div>
              </div>
            </div>
          ) : (
            <EmptyChart text="No completed tests yet." />
          )}
        </Panel>
      </div>

      {throughputByProcedure.length > 0 && (
        <Panel title="Throughput by Test Procedure">
          <div className="flex flex-col gap-1.5">
            {throughputByProcedure.map((p) => {
              const procedure = getProcedure(p.procedureId);
              const passRate = p.count > 0 ? Math.round((p.passed / p.count) * 100) : 0;
              return (
                <div key={p.procedureId} className="flex items-center justify-between px-3.5 py-2.5 rounded-md bg-op-panel-raised border border-op-border">
                  <div className="text-[12.5px] font-semibold text-op-text">{procedure?.name || p.procedureId}</div>
                  <div className="flex items-center gap-4 text-[12px] text-op-text-dim">
                    <span>{p.count} run{p.count !== 1 ? 's' : ''}</span>
                    <span className={passRate === 100 ? 'text-op-teal-dim font-semibold' : 'text-op-text-dim'}>{passRate}% pass rate</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {selectedRoom && (
        <RoomDrilldownOverlay room={selectedRoom} trend={roomTrend} onClose={() => setSelectedRoomId(null)} />
      )}
    </div>
  );
}

function RoomDrilldownOverlay({ room, trend, onClose }) {
  const hasHistory = trend.length >= 2;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-8" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg w-full max-w-[560px] shadow-2xl">
        <div className="px-6 py-4 border-b border-op-border flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-op-text-faint uppercase tracking-wide">Laboratory Drill-Down</div>
            <div className="text-[15px] font-bold text-op-text">{room.name}</div>
          </div>
          <button onClick={onClose} className="text-[20px] text-op-text-faint hover:text-op-text px-2">×</button>
        </div>
        <div className="px-6 py-5">
          <div className="text-[11px] font-bold text-op-text-faint uppercase tracking-wide mb-3">Utilization Trend</div>
          {hasHistory ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tickFormatter={(d) => formatCalendarWeek(d)} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9AA1AB' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip formatter={(v) => `${v}%`} labelFormatter={(d) => formatCalendarWeek(d)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="utilizationPct" stroke={TEAL} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Not enough history yet for this laboratory. Let more sim-days pass." />
          )}
          <div className="text-[12px] text-op-text-faint mt-3">
            Tier {room.tier} · {room.maxSlots} slots · {formatMoney(room.upkeepPerDay)}/day upkeep
          </div>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = { fontSize: 12, borderRadius: 6, border: '1px solid #E3E6EA', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };

function ClickableRoomTick({ x, y, payload, onSelect, rooms }) {
  const room = rooms[payload.index];
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontSize={11}
      fill="#6B7280"
      cursor="pointer"
      onClick={() => room && onSelect(room.roomId)}
    >
      {payload.value}
    </text>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-op-panel border border-op-border rounded-lg overflow-hidden mb-4">
      <div className="px-4.5 py-3.5 border-b border-op-border">
        <div className="text-[13.5px] font-semibold text-op-text">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyChart({ text }) {
  return <div className="flex items-center justify-center h-[180px] text-[12.5px] text-op-text-faint text-center px-8">{text}</div>;
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[12.5px] text-op-text-dim">{label}</span>
      <span className="text-[12.5px] font-bold text-op-text ml-auto tabular-nums">{value}</span>
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  const accentClass = accent === 'teal' ? 'text-op-teal-dim' : 'text-op-text';
  return (
    <div className="bg-op-panel border border-op-border rounded-lg p-4">
      <div className="text-[11.5px] text-op-text-faint font-semibold uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 tabular-nums ${accentClass}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-op-text-faint mt-1">{sub}</div>}
    </div>
  );
}
