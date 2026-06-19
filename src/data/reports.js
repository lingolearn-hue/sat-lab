import { getDut, getProject, getProcedure, getBenchType, getRoom } from './selectors.js';

// Builds the structured content for a single completed Test Request report.
// Returns null if the test request isn't completed yet (no result to report on).
export function buildTestReport(state, testRequestId) {
  const tr = state.testRequests.find((t) => t.id === testRequestId);
  if (!tr) return null;

  const execution = state.executions.find((e) => e.testRequestId === testRequestId);
  if (!execution || !execution.result) return null;

  const dut = getDut(state, tr.dutId);
  const project = getProject(state, tr.projectId);
  const procedure = getProcedure(tr.procedure);
  const bench = state.benches.find((b) => b.id === execution.benchId);
  const benchType = bench ? getBenchType(bench) : null;
  const room = bench ? getRoom(state, bench.roomId) : null;

  return {
    type: 'test',
    reportId: `RPT-${tr.id.toUpperCase()}`,
    generatedOnDay: state.simClock.day,
    testRequest: tr,
    dut,
    project,
    procedure,
    bench,
    benchType,
    room,
    result: execution.result,
    narrative: buildTestNarrative({ tr, dut, procedure, result: execution.result, benchType }),
  };
}

// Rolls up every test request in a project into a single summary report.
export function buildProjectReport(state, projectId) {
  const project = getProject(state, projectId);
  if (!project) return null;

  const testRequests = state.testRequests.filter((tr) => tr.projectId === projectId);
  const completed = testRequests.filter((tr) => tr.status === 'completed');
  const duts = state.duts.filter((d) => d.projectId === projectId);

  const testReports = completed
    .map((tr) => buildTestReport(state, tr.id))
    .filter(Boolean);

  const passCount = testReports.filter((r) => r.result.passed).length;
  const failCount = testReports.length - passCount;

  return {
    type: 'project',
    reportId: `RPT-${project.id.toUpperCase()}-SUMMARY`,
    generatedOnDay: state.simClock.day,
    project,
    duts,
    totalRequests: testRequests.length,
    completedRequests: completed.length,
    passCount,
    failCount,
    testReports,
    narrative: buildProjectNarrative({ project, testRequests, completed, passCount, failCount }),
  };
}

// Templated narrative text — deterministic based on the actual result, not random filler.
// Keeps the "no randomness in results" rule intact: the prose describes the real number,
// it doesn't invent one.
function buildTestNarrative({ tr, dut, procedure, result, benchType }) {
  const verdict = result.passed ? 'met' : 'did not meet';
  const metricPct = (result.metricValue * 100).toFixed(1);
  const margin = result.passed
    ? `${((result.metricValue - thresholdFor(procedure)) * 100).toFixed(1)} points above`
    : `${((thresholdFor(procedure) - result.metricValue) * 100).toFixed(1)} points below`;

  return (
    `${dut?.name || 'The device under test'} was evaluated under the ${procedure?.name || tr.procedure} procedure ` +
    `on a ${benchType?.name || 'qualified bench'}, operating at Tier ${result.benchTierApplied}. ` +
    `The recorded ${procedure?.metricKey || 'result'} of ${metricPct}% ${verdict} the qualification threshold ` +
    `of ${(thresholdFor(procedure) * 100).toFixed(0)}%, a margin of ${margin} the pass/fail line. ` +
    `${result.passed ? 'The unit is recommended for qualification sign-off.' : 'Further investigation or a retest is recommended before qualification sign-off.'}`
  );
}

function buildProjectNarrative({ project, testRequests, completed, passCount, failCount }) {
  const pendingCount = testRequests.length - completed.length;
  const passRate = completed.length > 0 ? ((passCount / completed.length) * 100).toFixed(0) : null;

  let summary = `${project.name} (customer: ${project.customer}) has ${testRequests.length} test request${testRequests.length !== 1 ? 's' : ''} on record, ` +
    `of which ${completed.length} ${completed.length === 1 ? 'has' : 'have'} completed`;

  if (pendingCount > 0) {
    summary += ` and ${pendingCount} remain${pendingCount === 1 ? 's' : ''} in progress or pending`;
  }
  summary += '. ';

  if (completed.length > 0) {
    summary += `Of the completed tests, ${passCount} passed and ${failCount} failed qualification (a ${passRate}% pass rate). `;
    summary += failCount > 0
      ? 'Failed tests should be reviewed before the program proceeds to the next qualification milestone.'
      : 'All completed tests have met their qualification thresholds to date.';
  } else {
    summary += 'No tests have completed yet, so no pass/fail summary is available.';
  }

  return summary;
}

function thresholdFor(procedure) {
  return procedure?.passThreshold ?? 0.6;
}
