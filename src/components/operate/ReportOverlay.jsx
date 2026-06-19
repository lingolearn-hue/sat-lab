import { Fragment } from 'react';
import { exportTestReportPdf, exportProjectReportPdf } from '../../data/reportPdf.js';
import { formatMoney } from '../../data/selectors.js';

export default function ReportOverlay({ report, onClose }) {
  if (!report) return null;
  const isTest = report.type === 'test';

  function handleDownload() {
    if (isTest) exportTestReportPdf(report);
    else exportProjectReportPdf(report);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-8 print:bg-white print:p-0" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg w-full max-w-[680px] max-h-[85vh] overflow-y-auto shadow-2xl print:max-h-none print:shadow-none print:rounded-none print:max-w-none"
      >
        <div className="sticky top-0 bg-white border-b border-op-border px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <div className="text-[11px] font-semibold text-op-text-faint uppercase tracking-wide">{report.reportId}</div>
            <div className="text-[15px] font-bold text-op-text">{isTest ? 'Test Report' : 'Project Summary Report'}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="text-[12.5px] font-semibold text-op-text-dim px-3.5 py-2 rounded-md border border-op-border hover:bg-op-panel-raised">
              Print
            </button>
            <button onClick={handleDownload} className="text-[12.5px] font-semibold text-white bg-op-teal px-3.5 py-2 rounded-md hover:bg-op-teal-dim">
              Download PDF
            </button>
            <button onClick={onClose} className="text-[20px] text-op-text-faint hover:text-op-text px-2">×</button>
          </div>
        </div>

        <div className="px-7 py-6">
          <div className="mb-5 pb-4 border-b border-op-border">
            <div className="text-[18px] font-bold text-op-text">Satellite Powertrain Test Department</div>
            <div className="text-[13px] text-op-text-dim mt-0.5">
              {isTest ? 'Test Report' : 'Project Summary Report'} · {report.reportId} · Generated on simulated Day {report.generatedOnDay}
            </div>
          </div>

          {isTest ? <TestReportBody report={report} /> : <ProjectReportBody report={report} />}
        </div>
      </div>
    </div>
  );
}

function TestReportBody({ report }) {
  const passed = report.result.passed;
  return (
    <>
      <SectionTitle>Test Summary</SectionTitle>
      <KeyValueGrid
        rows={[
          ['Device Under Test', report.dut?.name || '—'],
          ['Project', report.project ? `${report.project.name} (${report.project.customer})` : '—'],
          ['Procedure', report.procedure?.name || report.testRequest.procedure],
          ['Laboratory', report.room?.name || '—'],
          ['Bench', `${report.benchType?.name || '—'} (Tier ${report.result.benchTierApplied})`],
          ['Priority', capitalize(report.testRequest.priority)],
          ['Requested Completion', `Day ${report.testRequest.requestedCompletionDay}`],
        ]}
      />

      <SectionTitle>Result</SectionTitle>
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-flex items-center text-[13px] font-bold px-3 py-1 rounded-full ${passed ? 'bg-op-teal-glow text-op-teal-dim' : 'bg-[rgba(192,59,59,0.10)] text-op-red'}`}>
          {passed ? 'PASS' : 'FAIL'}
        </span>
        <span className="text-[13px] text-op-text-dim">
          {(report.result.metricValue * 100).toFixed(1)}% ({report.result.metricKey})
        </span>
      </div>

      <SectionTitle>Narrative</SectionTitle>
      <p className="text-[13px] text-op-text-dim leading-relaxed">{report.narrative}</p>
    </>
  );
}

function ProjectReportBody({ report }) {
  return (
    <>
      <SectionTitle>Project Overview</SectionTitle>
      <KeyValueGrid
        rows={[
          ['Project', report.project.name],
          ['Customer', report.project.customer],
          ['Status', capitalize(report.project.status)],
          ['Due Day', `Day ${report.project.dueDate.day}`],
          ['Budget', formatMoney(report.project.budget)],
          ['Devices Under Test', String(report.duts.length)],
        ]}
      />

      <SectionTitle>Test Progress</SectionTitle>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MiniStat label="Total Requests" value={report.totalRequests} />
        <MiniStat label="Completed" value={report.completedRequests} />
        <MiniStat label="Passed" value={report.passCount} accent="teal" />
        <MiniStat label="Failed" value={report.failCount} accent={report.failCount > 0 ? 'red' : undefined} />
      </div>

      <SectionTitle>Summary</SectionTitle>
      <p className="text-[13px] text-op-text-dim leading-relaxed mb-5">{report.narrative}</p>

      {report.testReports.length > 0 && (
        <>
          <SectionTitle>Completed Test Detail</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {report.testReports.map((tr) => (
              <div key={tr.testRequest.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-md bg-op-panel-raised border border-op-border">
                <div>
                  <div className="text-[12.5px] font-semibold text-op-text">
                    {tr.testRequest.id.toUpperCase()} — {tr.dut?.name}
                  </div>
                  <div className="text-[11.5px] text-op-text-faint">
                    {tr.procedure?.name} · {(tr.result.metricValue * 100).toFixed(1)}% {tr.result.metricKey}
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tr.result.passed ? 'bg-op-teal-glow text-op-teal-dim' : 'bg-[rgba(192,59,59,0.10)] text-op-red'}`}>
                  {tr.result.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SectionTitle({ children }) {
  return <div className="text-[11px] font-bold text-op-text-faint uppercase tracking-wide mb-2.5 mt-5 first:mt-0">{children}</div>;
}

function KeyValueGrid({ rows }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-y-1.5 mb-2">
      {rows.map(([key, value]) => (
        <Fragment key={key}>
          <div className="text-[12.5px] text-op-text-faint">{key}</div>
          <div className="text-[12.5px] text-op-text font-medium">{value}</div>
        </Fragment>
      ))}
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  const accentClass = accent === 'teal' ? 'text-op-teal-dim' : accent === 'red' ? 'text-op-red' : 'text-op-text';
  return (
    <div className="bg-op-panel-raised border border-op-border rounded-md p-3">
      <div className="text-[10.5px] text-op-text-faint uppercase tracking-wide">{label}</div>
      <div className={`text-[20px] font-bold mt-1 ${accentClass}`}>{value}</div>
    </div>
  );
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}
