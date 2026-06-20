import { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext.jsx';
import { getDut, getProcedure, TEST_REQUEST_STATUS_LABELS, formatCalendarWeek } from '../../data/selectors.js';
import { buildTestReport, buildProjectReport } from '../../data/reports.js';
import NewTestRequestModal from './NewTestRequestModal.jsx';
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
};

export default function ProjectsPage() {
  const state = useAppState();
  const [expandedProjectId, setExpandedProjectId] = useState(state.projects[0]?.id);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const room = state.rooms[0];

  function openTestReport(testRequestId) {
    const report = buildTestReport(state, testRequestId);
    if (report) setActiveReport(report);
  }

  function openProjectReport(projectId) {
    const report = buildProjectReport(state, projectId);
    if (report) setActiveReport(report);
  }

  return (
    <div className="px-8 py-7">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xl font-bold tracking-tight text-op-text">Projects</div>
          <div className="text-[13px] text-op-text-dim mt-1">Customer programs and their test request pipelines</div>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="bg-op-teal text-white font-semibold text-[13px] px-4 py-2.5 rounded-md hover:bg-op-teal-dim transition-colors"
        >
          + New Test Request
        </button>
      </div>

      {state.projects.map((project) => {
        const projectDuts = state.duts.filter((d) => d.projectId === project.id);
        const projectRequests = state.testRequests.filter((tr) => tr.projectId === project.id);
        const isExpanded = expandedProjectId === project.id;
        const completedCount = projectRequests.filter((tr) => tr.status === 'completed').length;

        return (
          <div key={project.id} className="bg-op-panel border border-op-border rounded-lg overflow-hidden mb-4">
            <div className="w-full flex items-center justify-between px-5 py-4">
              <button
                onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                className="flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <div className="text-[15px] font-bold text-op-text">{project.name}</div>
                <div className="text-[12.5px] text-op-text-dim mt-0.5">
                  {project.customer} · Due {formatCalendarWeek(project.dueDate.day)} · {formatStatus(project.status)}
                </div>
              </button>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="text-[11px] text-op-text-faint uppercase tracking-wide">Progress</div>
                  <div className="text-[13px] font-semibold text-op-text-dim tabular-nums">
                    {completedCount} / {projectRequests.length} requests
                  </div>
                </div>
                {completedCount > 0 && (
                  <button
                    onClick={() => openProjectReport(project.id)}
                    className="text-[12px] font-semibold text-op-teal-dim hover:underline whitespace-nowrap"
                  >
                    View Report
                  </button>
                )}
                <button onClick={() => setExpandedProjectId(isExpanded ? null : project.id)} className="text-op-text-faint text-xs">
                  {isExpanded ? '▾' : '▸'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-op-border">
                <div className="px-5 py-3 border-b border-op-border bg-op-panel-raised">
                  <div className="text-[11px] font-semibold text-op-text-faint uppercase tracking-wide">
                    Devices Under Test ({projectDuts.length})
                  </div>
                </div>
                <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-op-border">
                  {projectDuts.map((dut) => (
                    <div key={dut.id} className="text-[12px] px-3 py-1.5 rounded-md bg-op-panel-raised border border-op-border text-op-text-dim">
                      <span className="font-semibold text-op-text">{dut.name}</span>
                      {dut.specs.ratedEfficiency != null && <>{' · '}{(dut.specs.ratedEfficiency * 100).toFixed(0)}% rated eff.</>}
                    </div>
                  ))}
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Request', 'DUT', 'Procedure', 'Priority', 'Status', 'Due', 'Report'].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-op-text-faint uppercase tracking-wide px-5 py-2.5 border-b border-op-border">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projectRequests.map((tr) => {
                      const dut = getDut(state, tr.dutId);
                      const procedure = getProcedure(tr.procedure);
                      return (
                        <tr key={tr.id} className="border-b border-op-border last:border-b-0">
                          <td className="px-5 py-3 font-mono text-[12.5px] text-op-text-dim">{tr.id.toUpperCase()}</td>
                          <td className="px-5 py-3 text-[13px] text-op-text">{dut?.name}</td>
                          <td className="px-5 py-3 text-[13px] text-op-text">{procedure?.name}</td>
                          <td className="px-5 py-3 text-[12.5px] text-op-text-dim capitalize">{tr.priority}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[tr.status] || 'bg-op-panel-raised text-op-text-dim'}`}>
                              {TEST_REQUEST_STATUS_LABELS[tr.status]}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[13px] text-op-text-dim">{formatCalendarWeek(tr.requestedCompletionDay)}</td>
                          <td className="px-5 py-3">
                            {tr.status === 'completed' ? (
                              <button onClick={() => openTestReport(tr.id)} className="text-[12px] font-semibold text-op-teal-dim hover:underline">
                                View →
                              </button>
                            ) : (
                              <span className="text-[11.5px] text-op-text-faint">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {projectRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-6 text-center text-[12.5px] text-op-text-faint">
                          No test requests yet for this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {showNewRequest && <NewTestRequestModal room={room} onClose={() => setShowNewRequest(false)} />}
      {activeReport && <ReportOverlay report={activeReport} onClose={() => setActiveReport(null)} />}
    </div>
  );
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}
