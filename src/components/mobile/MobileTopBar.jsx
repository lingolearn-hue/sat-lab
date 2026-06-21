import { useState } from 'react';
import { useAppState, useAppDispatch, useSaveLoad } from '../../context/AppContext.jsx';
import { formatMoney, formatCalendarWeek } from '../../data/selectors.js';
import ViewModeToggle from '../shared/ViewModeToggle.jsx';

const ROLES = {
  operator: { label: 'Operator', initials: 'OP' },
  test_engineer: { label: 'Test Engineer', initials: 'TE' },
  lab_manager: { label: 'Laboratory Manager', initials: 'LM' },
};

// Same gap as the desktop top bar had: SET_CLOCK_SPEED already worked in the
// reducer, but nothing in the mobile UI ever showed or let you change the speed.
const SPEED_OPTIONS = [1, 6, 24, 60];

export default function MobileTopBar({ onViewModeChange }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { exportToFile, importFromFile, resetToSeed } = useSaveLoad();
  const [sheetOpen, setSheetOpen] = useState(false);
  const role = ROLES[state.currentRole];

  return (
    <>
      <div className="flex items-center gap-2 px-3 h-12 border-b border-op-border bg-op-panel">
        <div className="w-1.5 h-1.5 rounded-full bg-op-teal flex-shrink-0" />
        <div className="text-[11px] font-bold text-op-text truncate flex-1">SAT POWERTRAIN DEPT</div>
        <div className="text-[11px] font-semibold text-op-text-dim tabular-nums whitespace-nowrap">
          {formatCalendarWeek(state.simClock.day)} · {String(state.simClock.hour).padStart(2, '0')}:{String(state.simClock.minute).padStart(2, '0')} · ×{state.simClock.speedMultiplier}
        </div>
        <div className="text-[11px] font-bold text-op-teal-dim tabular-nums whitespace-nowrap">
          {formatMoney(state.facility.budget)}
        </div>
        <ViewModeToggle viewMode="mobile" onViewModeChange={onViewModeChange} />
        <button
          onClick={() => setSheetOpen(true)}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-op-teal to-op-teal-dim flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        >
          {role.initials}
        </button>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full bg-op-panel rounded-t-2xl pb-6 pt-2 shadow-2xl">
            <div className="w-10 h-1 bg-op-border rounded-full mx-auto mb-4" />

            <div className="px-5 pb-2 text-[11px] font-bold text-op-text-faint uppercase tracking-wide">Switch Role</div>
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => { dispatch({ type: 'SET_ROLE', role: key }); setSheetOpen(false); }}
                className={`w-full text-left px-5 py-3 text-[14px] ${state.currentRole === key ? 'font-bold text-op-teal-dim' : 'text-op-text'}`}
              >
                {r.label}
              </button>
            ))}

            <div className="border-t border-op-border mt-2 pt-3 px-5">
              <div className="text-[11px] font-bold text-op-text-faint uppercase tracking-wide mb-2">Sim Clock Speed</div>
              <div className="flex gap-2">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => dispatch({ type: 'SET_CLOCK_SPEED', speedMultiplier: speed })}
                    className={`flex-1 text-[13px] font-semibold py-2 rounded-md border ${
                      state.simClock.speedMultiplier === speed
                        ? 'bg-op-teal text-white border-op-teal'
                        : 'text-op-text-dim border-op-border'
                    }`}
                  >
                    ×{speed}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CLOCK_RUNNING' })}
                className="w-full text-left px-5 py-3 text-[14px] text-op-text"
              >
                {state.simClock.running ? 'Pause' : 'Resume'} sim clock
              </button>
              <button
                onClick={() => { exportToFile(); setSheetOpen(false); }}
                className="w-full text-left px-5 py-3 text-[14px] text-op-text"
              >
                Export save (.json)
              </button>
              <label className="w-full text-left px-5 py-3 text-[14px] text-op-text block">
                Import save (.json)
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importFromFile(file);
                    e.target.value = '';
                    setSheetOpen(false);
                  }}
                />
              </label>
              <button
                onClick={() => {
                  if (confirm('Reset to the default scenario? This will overwrite your current state.')) {
                    resetToSeed();
                  }
                  setSheetOpen(false);
                }}
                className="w-full text-left px-5 py-3 text-[14px] text-op-red"
              >
                Reset to default scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
