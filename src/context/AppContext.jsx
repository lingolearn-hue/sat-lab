import { createContext, useContext, useEffect, useReducer, useRef, useCallback } from 'react';
import { appReducer } from './appReducer.js';
import { createInitialState } from '../data/seed.js';

const STORAGE_KEY = 'satellite-test-center:state:v1';

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load saved state, starting fresh.', err);
    return null;
  }
}

function init() {
  return loadFromStorage() || createInitialState();
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, init);

  // Auto-save to localStorage on every state change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save state to localStorage.', err);
    }
  }, [state]);

  // Real-time accelerated clock: 1 real second = speedMultiplier sim minutes.
  const lastTickRef = useRef(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const realSecondsElapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (state.simClock.running) {
        const simMinutesElapsed = realSecondsElapsed * state.simClock.speedMultiplier;
        dispatch({ type: 'TICK_CLOCK', simMinutesElapsed });
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.simClock.running, state.simClock.speedMultiplier]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (ctx === null) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (ctx === null) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

// Save/Load JSON file helpers, used by Settings / top bar controls.
export function useSaveLoad() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const exportToFile = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satellite-test-center-day${state.simClock.day}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const importFromFile = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          dispatch({ type: 'LOAD_STATE', state: parsed });
        } catch (err) {
          console.error('Failed to parse imported file.', err);
          alert('Could not load this file — it does not look like a valid save file.');
        }
      };
      reader.readAsText(file);
    },
    [dispatch]
  );

  const resetToSeed = useCallback(() => {
    dispatch({ type: 'LOAD_STATE', state: createInitialState() });
  }, [dispatch]);

  return { exportToFile, importFromFile, resetToSeed };
}
