import { useState } from 'react';
import { useAppDispatch, useAppState } from '../../context/AppContext.jsx';
import {
  getDut,
  getProject,
  getProcedure,
  getRoom,
  getBenchType,
  getPlaceholderDocuments,
  formatCalendarWeek,
  TEST_REQUEST_STATUS_LABELS,
} from '../../data/selectors.js';
import { buildTestReport } from '../../data/reports.js';
import ReportOverlay from './ReportOverlay.jsx';

const STATUS_BADGE = {
  running: 'bg-op-teal-glow text-op-teal-dim',
  review: 'bg-[rgba(194,90,24,0.10)] text-op-orange',
  scheduled: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  submitted: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  approved: 'bg-[rgba(154,161,171,0.14)] text-op-text-dim',
  completed: 'bg-op-teal-glow text-op-teal-dim',
  draft: 'bg-[rgba(154,161,171,0.10)] text-op-text-faint',
  archived: 'bg-[rgba(154,161,171,0.10)] text-op-text-faint',
  expired: 'bg-[rgba(192,59,59,0.10)] text-op-red',
};

export default function TestRequestDetailOverlay({ testRequest, onClose }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [showReport, setShowReport] = useState(false);
  const [newStakeholderName, setNewStakeholderName] = useState('');
  const [newStakeholderRole, setNewStakeholderRole] = useState('');
  const [editingDivergence, setEditingDivergence] = useState(false);
  const [divergenceNoteDraft, setDivergenceNoteDraft] = useState(testRequest.divergenceNote || '');

  if (!testRequest) return null;

  const dut = getDut(state, testRequest.dutId);
  const project = getProject(state, testRequest.projectId);
  const procedure = getProcedure(testRequest.procedure);
  const bench = testRequest.assignedBenchId ? state.benches.find((b) => b.id === testRequest.assignedBenchId) : null;
  const room = bench ? getRoom(state, bench.roomId) : null;
  const benchType = bench ? getBenchType(bench) : null;
  const documents = getPlaceholderDocuments(state, testRequest);
  const stakeholders = testRequest.stakeholders || [];

  function addStakeholder() {
    if (!newStakeholderName.trim()) return;
    const updated = [...stakeholders, { name: newStakeholderName.trim(), role: newStakeholderRole.trim() || 'Stakeholder' }];
    dispatch({ type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: testRequest.id, stakeholders: updated });
    setNewStakeholderName('');
    setNewStakeholderRole('');
  }

  function removeStakeholder(index) {
    const updated = stakeholders.filter((_, i) => i !== index);
    dispatch({ type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: testRequest.id, stakeholders: updated });
  }

  function toggleDivergence() {
    const nextValue = !testRequest.divergesFromStandard;
    dispatch({
      type: 'UPDATE_TEST_REQUEST_DETAILS',
      testRequestId: testRequest.id,
      divergesFromStandard: nextValue,
      divergenceNote: nextValue ? (testRequest.divergenceNote || divergenceNoteDraft) : '',
    });
    if (nextValue) setEditingDivergence(true);
  }

  function saveDivergenceNote() {
    dispatch({ type: 'UPDATE_TEST_REQUEST_DETAILS', testRequestId: testRequest.id, divergenceNote: divergenceNoteDraft });
    setEditingDivergence(false);
  }

  function openReport() {
    const report = buildTestReport(state, testRequest.id);
    if (report) setShowReport(report);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-8" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg w-full max-w-[640px] max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-op-border px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-op-text-faint uppercase tracking-wide">{testRequest.id.toUpperCase()}</div>
            <div className="text-[15px] font-bold text-op-text">{dut?.name || 'Test Request'}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[testRequest.status] || 'bg-op-panel-raised text-op-text-dim'}`}>
              {TEST_REQUEST_STATUS_LABELS[testRequest.status] || testRequest.status}
            </span>
            <button onClick={onClose} className="text-[20px] text-op-text-faint hover:text-op-text px-2">×</button>
          </div>
        </div>

        <div className="px-7 py-6">
          <SectionTitle>Test Summary</SectionTitle>
          <KeyValueGrid
            rows={[
              ['Project', project ? `${project.name} (${project.customer})` : '—'],
              ['Procedure', procedure?.name || testRequest.procedure],
              ['Laboratory', room?.name || '—'],
              ['Bench', bench ? `${benchType?.name || '—'} (Tier ${bench.tier})` : '—'],
              ['Priority', capitalize(testRequest.priority)],
              ['Submitted', testRequest.submittedOnDay != null ? formatCalendarWeek(testRequest.submittedOnDay) : '—'],
              ['Requested Completion', formatCalendarWeek(testRequest.requestedCompletionDay)],
            ]}
          />

          {testRequest.status === 'completed' && (
            <button
              onClick={openReport}
              className="w-full text-center text-[13px] font-semibold text-white bg-op-teal py-2.5 rounded-md mt-2 mb-1 hover:bg-op-teal-dim"
            >
              View Test Report →
            </button>
          )}

          <SectionTitle>Procedure Divergence</SectionTitle>
          <div className={`rounded-md border p-3.5 ${testRequest.divergesFromStandard ? 'border-op-orange bg-[rgba(194,90,24,0.05)]' : 'border-op-border bg-op-panel-raised'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${testRequest.divergesFromStandard ? 'bg-op-orange' : 'bg-op-text-faint'}`} />
                <span className="text-[13px] font-semibold text-op-text">
                  {testRequest.divergesFromStandard ? 'Diverges from standard procedure' : 'Follows standard procedure'}
                </span>
              </div>
              <button onClick={toggleDivergence} className="text-[11.5px] font-semibold text-op-teal-dim hover:underline whitespace-nowrap">
                Mark as {testRequest.divergesFromStandard ? 'standard' : 'diverging'}
              </button>
            </div>
            {testRequest.divergesFromStandard && (
              editingDivergence ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={divergenceNoteDraft}
                    onChange={(e) => setDivergenceNoteDraft(e.target.value)}
                    placeholder="Describe how this diverges…"
                    className="flex-1 text-[12.5px] bg-white border border-op-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-op-teal"
                  />
                  <button onClick={saveDivergenceNote} className="text-[11.5px] font-semibold text-white bg-op-teal px-3 py-1.5 rounded-md whitespace-nowrap">
                    Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingDivergence(true)} className="text-[12.5px] text-op-text-dim text-left hover:underline">
                  {testRequest.divergenceNote || 'Add a note…'}
                </button>
              )
            )}
          </div>

          <SectionTitle>Stakeholders</SectionTitle>
          <div className="flex flex-col gap-1.5 mb-2.5">
            {stakeholders.map((s, i) => (
              <div key={`${s.name}-${i}`} className="flex items-center justify-between px-3.5 py-2 rounded-md bg-op-panel-raised border border-op-border">
                <div>
                  <span className="text-[12.5px] font-semibold text-op-text">{s.name}</span>
                  <span className="text-[11.5px] text-op-text-faint ml-2">{s.role}</span>
                </div>
                <button onClick={() => removeStakeholder(i)} className="text-[11px] text-op-text-faint hover:text-op-red">
                  Remove
                </button>
              </div>
            ))}
            {stakeholders.length === 0 && <div className="text-[12px] text-op-text-faint">No stakeholders listed yet.</div>}
          </div>
          <div className="flex gap-2 mb-1">
            <input
              type="text"
              value={newStakeholderName}
              onChange={(e) => setNewStakeholderName(e.target.value)}
              placeholder="Name"
              className="flex-1 text-[12.5px] bg-white border border-op-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-op-teal"
            />
            <input
              type="text"
              value={newStakeholderRole}
              onChange={(e) => setNewStakeholderRole(e.target.value)}
              placeholder="Role"
              className="w-32 text-[12.5px] bg-white border border-op-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-op-teal"
            />
            <button onClick={addStakeholder} className="text-[11.5px] font-semibold text-op-teal-dim border border-op-border rounded-md px-3 py-1.5 hover:bg-op-panel-raised whitespace-nowrap">
              + Add
            </button>
          </div>

          <SectionTitle>Documents</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-op-panel-raised border border-op-border">
                <span className="text-[14px] text-op-text-faint">📄</span>
                <span className="text-[12.5px] text-op-text-dim flex-1">{doc.name}</span>
                <span className="text-[10.5px] text-op-text-faint">not available in this simulation</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReport && <ReportOverlay report={showReport} onClose={() => setShowReport(null)} />}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="text-[11px] font-bold text-op-text-faint uppercase tracking-wide mb-2.5 mt-5 first:mt-0">{children}</div>;
}

function KeyValueGrid({ rows }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-y-1.5 mb-2">
      {rows.map(([key, value]) => (
        <div key={key} className="contents">
          <div className="text-[12.5px] text-op-text-faint">{key}</div>
          <div className="text-[12.5px] text-op-text font-medium">{value}</div>
        </div>
      ))}
    </div>
  );
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}
