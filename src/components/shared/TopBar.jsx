import { useAppState, useAppDispatch, useSaveLoad } from '../../context/AppContext.jsx';
import { formatMoney } from '../../data/selectors.js';
import { useRef, useState } from 'react';

const ROLES = {
  test_engineer: { label: 'Test Engineer', initials: 'TE' },
  lab_manager: { label: 'Laboratory Manager', initials: 'LM' },
};

export default function TopBar({ mode, onModeChange }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { exportToFile, importFromFile, resetToSeed } = useSaveLoad();
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOperate = mode === 'operate';
  const role = ROLES[state.currentRole];

  const theme = isOperate
    ? {
        bg: 'bg-op-panel',
        border: 'border-op-border',
        text: 'text-op-text',
        textDim: 'text-op-text-dim',
        accent: 'bg-op-teal',
        accentText: 'text-white',
        chipBg: 'bg-op-panel-raised',
        chipBorder: 'border-op-border',
        dotColor: 'bg-op-teal',
        font: 'font-sans',
      }
    : {
        bg: 'bg-bd-panel',
        border: 'border-bd-border-dim',
        text: 'text-bd-text',
        textDim: 'text-bd-text-dim',
        accent: 'bg-bd-orange',
        accentText: 'text-[#2A0F00]',
        chipBg: 'bg-bd-panel-raised',
        chipBorder: 'border-bd-border-dim',
        dotColor: 'bg-bd-orange',
        font: 'font-mono',
      };

  return (
    <div className={`${theme.bg} border-b ${theme.border} flex items-center px-5 h-14 gap-6 ${theme.font}`}>
      <div className={`font-bold text-sm tracking-wide flex items-center gap-2 ${theme.text}`}>
        <span className={`w-2 h-2 rounded-full ${theme.dotColor} ${isOperate ? '' : 'shadow-[0_0_8px_#E8742C]'}`} />
        SATELLITE POWERTRAIN TEST DEPARTMENT
      </div>

      <div className={`flex ${isOperate ? 'bg-op-bg' : 'bg-bd-bg'} border ${theme.chipBorder} rounded-md p-0.5 ml-2`}>
        <button
          onClick={() => onModeChange('operate')}
          className={`font-sans text-xs font-semibold px-3.5 py-1.5 rounded-[5px] transition-colors ${
            isOperate ? 'bg-op-teal text-white' : `${theme.textDim}`
          }`}
        >
          Operate
        </button>
        <button
          onClick={() => onModeChange('build')}
          className={`font-sans text-xs font-semibold px-3.5 py-1.5 rounded-[5px] transition-colors ${
            !isOperate ? 'bg-bd-orange text-[#2A0F00]' : `${theme.textDim}`
          }`}
        >
          Build
        </button>
      </div>

      <div className="flex-1" />

      <div className={`flex items-center gap-2 text-[13px] ${theme.chipBg} border ${theme.chipBorder} rounded-md px-3 py-1.5 ${theme.textDim}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor} animate-pulse-dot`} />
        <span className="tabular-nums">
          Day {state.simClock.day} · {String(state.simClock.hour).padStart(2, '0')}:{String(state.simClock.minute).padStart(2, '0')} · ×{state.simClock.speedMultiplier}
        </span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CLOCK_RUNNING' })}
          className={`ml-1 px-1.5 rounded ${theme.text} opacity-70 hover:opacity-100`}
          title={state.simClock.running ? 'Pause' : 'Resume'}
        >
          {state.simClock.running ? '⏸' : '▶'}
        </button>
      </div>

      <div className={`text-[13px] font-semibold ${theme.chipBg} border ${theme.chipBorder} rounded-md px-3 py-1.5 ${isOperate ? 'text-op-text' : 'text-bd-orange'} tabular-nums`}>
        {formatMoney(state.facility.budget)}
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${theme.chipBg} border ${theme.chipBorder} cursor-pointer ${theme.font}`}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-op-teal to-op-teal-dim flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {role.initials}
          </div>
          {isOperate && (
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold text-op-text">{role.label}</div>
            </div>
          )}
          {!isOperate && <div className="text-xs font-semibold text-bd-text">{role.label.toUpperCase()}</div>}
        </button>
        {menuOpen && (
          <div className={`absolute right-0 top-full mt-2 w-56 rounded-md border ${theme.chipBorder} ${theme.bg} shadow-lg z-50 font-sans overflow-hidden`}>
            <div className={`text-[11px] uppercase tracking-wide px-3 pt-3 pb-1 ${theme.textDim}`}>Switch Role</div>
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => {
                  dispatch({ type: 'SET_ROLE', role: key });
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[13px] hover:bg-op-teal-glow ${
                  state.currentRole === key ? 'font-semibold text-op-teal' : theme.text
                }`}
              >
                {r.label}
              </button>
            ))}
            <div className={`border-t ${theme.chipBorder} mt-1`}>
              <button
                onClick={() => { exportToFile(); setMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] ${theme.text} hover:bg-op-teal-glow`}
              >
                Export save (.json)
              </button>
              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className={`w-full text-left px-3 py-2 text-[13px] ${theme.text} hover:bg-op-teal-glow`}
              >
                Import save (.json)
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset to the default scenario? This will overwrite your current state.')) {
                    resetToSeed();
                  }
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[13px] text-op-red hover:bg-op-teal-glow`}
              >
                Reset to default scenario
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFromFile(file);
            e.target.value = '';
            setMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}
