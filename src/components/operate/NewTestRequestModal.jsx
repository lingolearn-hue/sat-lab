import { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import { PROCEDURES } from '../../data/catalog.js';

export default function NewTestRequestModal({ room, onClose }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [projectId, setProjectId] = useState(state.projects[0]?.id || '');
  const projectDuts = state.duts.filter((d) => d.projectId === projectId);
  const [dutId, setDutId] = useState(projectDuts[0]?.id || '');
  const [procedure, setProcedure] = useState('endurance');
  const [priority, setPriority] = useState('normal');
  const [dueDay, setDueDay] = useState(state.simClock.day + 7);

  function handleProjectChange(newProjectId) {
    setProjectId(newProjectId);
    const firstDut = state.duts.find((d) => d.projectId === newProjectId);
    setDutId(firstDut?.id || '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!projectId || !dutId) return;
    dispatch({
      type: 'SUBMIT_TEST_REQUEST',
      projectId,
      dutId,
      procedure,
      priority,
      requestedCompletionDay: Number(dueDay),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-op-panel border border-op-border rounded-lg w-[440px] shadow-xl"
      >
        <div className="px-5 py-4 border-b border-op-border">
          <div className="text-[15px] font-bold text-op-text">New Test Request</div>
          <div className="text-[12.5px] text-op-text-dim mt-0.5">Electric Propulsion Test Center</div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <Field label="Project">
            <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} className={selectClass}>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Device Under Test">
            <select value={dutId} onChange={(e) => setDutId(e.target.value)} className={selectClass}>
              {projectDuts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
              {projectDuts.length === 0 && <option value="">No DUTs for this project</option>}
            </select>
          </Field>

          <Field label="Test Procedure">
            <select value={procedure} onChange={(e) => setProcedure(e.target.value)} className={selectClass}>
              {Object.values(PROCEDURES).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Requested Completion (Day)">
              <input
                type="number"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className={selectClass}
                min={state.simClock.day}
              />
            </Field>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-op-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="text-[13px] font-semibold text-op-text-dim px-4 py-2 rounded-md hover:bg-op-panel-raised">
            Cancel
          </button>
          <button type="submit" disabled={!dutId} className="text-[13px] font-semibold text-white bg-op-teal px-4 py-2 rounded-md hover:bg-op-teal-dim disabled:opacity-40 disabled:cursor-not-allowed">
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}

const selectClass = "w-full text-[13px] text-op-text bg-op-panel-raised border border-op-border rounded-md px-3 py-2 focus:outline-none focus:border-op-teal";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold text-op-text-faint uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
