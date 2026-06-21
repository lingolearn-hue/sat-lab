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
  getGanttData,
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

  // Default window: a week before today through ~5 weeks after, wide enough to
  // show both recently-finished work and any far-out deferred reservations without
  // the chart becoming illegibly compressed for the common case.
  const ganttWindowStart = Math.max(1, state.simClock.day - 7);
  const ganttWindowEnd = state.simClock.day + 35;
  const ganttLanes = getGanttData(state, { windowStartDay: ganttWindowStart, windowEndDay: ganttWindowEnd });

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

      <Panel title="Bench Schedule (Gantt) — All Interactive Labs">
        <GanttChart lanes={ganttLanes} windowStartDay={ganttWindowStart} windowEndDay={ganttWindowEnd} todayDay={state.simClock.day} />
      </Panel>

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

// Custom SVG rather than a recharts stacked-bar hack: recharts' bar primitives
// assume one row = one value, which doesn't fit "one bench lane with an arbitrary
// number of time-segments, including gaps between them." A hand-rolled SVG gives
// direct control over arbitrary segment positions/widths per lane, which is what a
// Gantt view fundamentally needs. This is read-only — segments aren't draggable;
// rescheduling happens through the normal Scheduling page action, not here.
const PHASE_COLORS = {
  queued: { fill: '#E3E6EA', stroke: '#9AA1AB', label: 'Reserved (not yet started)' },
  scheduled: { fill: '#9AA1AB', stroke: '#6B7280', label: 'Starting' },
  running: { fill: TEAL, stroke: '#16695D', label: 'Running' },
  review: { fill: ORANGE, stroke: '#8A4310', label: 'In review' },
  completed: { fill: '#C9D6D3', stroke: '#8FA59F', label: 'Completed' },
};

function GanttChart({ lanes, windowStartDay, windowEndDay, todayDay }) {
  const lanesWithSegments = lanes.filter((l) => l.segments.length > 0);
  if (lanesWithSegments.length === 0) {
    return <EmptyChart text="No scheduled or running tests in the current window yet." />;
  }

  const totalDays = windowEndDay - windowStartDay;
  const rowHeight = 34;
  const headerHeight = 26;
  const labelWidth = 96;
  const chartWidth = 760;
  const chartHeight = headerHeight + lanesWithSegments.length * rowHeight + 8;
  const dayToX = (day) => labelWidth + ((day - windowStartDay) / totalDays) * (chartWidth - labelWidth);

  // Week gridlines (every 7 days from the window start) give a sense of scale
  // without needing every single day labeled, which would be too dense at this width.
  const weekTicks = [];
  for (let d = windowStartDay; d <= windowEndDay; d += 7) weekTicks.push(d);

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} style={{ minWidth: chartWidth }}>
        {weekTicks.map((day) => (
          <g key={day}>
            <line x1={dayToX(day)} y1={headerHeight} x2={dayToX(day)} y2={chartHeight - 4} stroke={GRID} strokeWidth={1} />
            <text x={dayToX(day)} y={16} fontSize={10} fill="#9AA1AB" textAnchor="middle">
              {formatCalendarWeek(day)}
            </text>
          </g>
        ))}
        {todayDay >= windowStartDay && todayDay <= windowEndDay && (
          <line x1={dayToX(todayDay)} y1={headerHeight} x2={dayToX(todayDay)} y2={chartHeight - 4} stroke={RED} strokeWidth={1.5} strokeDasharray="3,3" />
        )}

        {lanesWithSegments.map((lane, rowIndex) => {
          const y = headerHeight + rowIndex * rowHeight;
          return (
            <g key={lane.benchId}>
              <text x={0} y={y + rowHeight / 2 + 4} fontSize={11} fontWeight={600} fill="#3A3F47">
                {lane.benchLabel}
              </text>
              <line x1={labelWidth} y1={y + rowHeight} x2={chartWidth} y2={y + rowHeight} stroke={GRID} strokeWidth={1} />
              {lane.segments.map((seg) => {
                const colors = PHASE_COLORS[seg.phase] || PHASE_COLORS.scheduled;
                const x1 = Math.max(labelWidth, dayToX(Math.max(seg.startDay, windowStartDay)));
                const x2 = Math.min(chartWidth, dayToX(Math.min(seg.endDay, windowEndDay)));
                const barWidth = Math.max(2, x2 - x1);
                return (
                  <g key={seg.executionId}>
                    <rect
                      x={x1}
                      y={y + 6}
                      width={barWidth}
                      height={rowHeight - 14}
                      rx={3}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={seg.isDeferred ? 1.5 : 1}
                      strokeDasharray={seg.isDeferred ? '4,2' : undefined}
                    >
                      <title>{`${seg.testRequestId.toUpperCase()} — ${seg.procedureName} (${colors.label}, ${formatCalendarWeek(seg.startDay)} – ${formatCalendarWeek(seg.endDay)})`}</title>
                    </rect>
                    {barWidth > 70 && (
                      <text x={x1 + 6} y={y + rowHeight / 2 + 4} fontSize={10} fill={seg.phase === 'running' ? '#fff' : '#3A3F47'} pointerEvents="none">
                        {seg.testRequestId.toUpperCase()}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-3 px-1">
        {Object.entries(PHASE_COLORS).map(([phase, c]) => (
          <div key={phase} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.fill, border: `1px solid ${c.stroke}` }} />
            <span className="text-[10.5px] text-op-text-faint">{c.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0 border-t border-dashed" style={{ borderColor: RED }} />
          <span className="text-[10.5px] text-op-text-faint">Today</span>
        </div>
      </div>
    </div>
  );
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
