import { jsPDF } from 'jspdf';
import { formatMoney, formatCalendarWeek } from './selectors.js';

const MARGIN = 18;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function exportTestReportPdf(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  y = drawHeader(doc, y, 'Test Report', report.reportId, report.generatedOnDay);

  y = drawSectionTitle(doc, y, 'Test Summary');
  y = drawKeyValueRows(doc, y, [
    ['Device Under Test', report.dut?.name || '—'],
    ['Project', report.project ? `${report.project.name} (${report.project.customer})` : '—'],
    ['Procedure', report.procedure?.name || report.testRequest.procedure],
    ['Laboratory', report.room?.name || '—'],
    ['Bench', `${report.benchType?.name || '—'} (Tier ${report.result.benchTierApplied})`],
    ['Priority', capitalize(report.testRequest.priority)],
    ['Requested Completion', formatCalendarWeek(report.testRequest.requestedCompletionDay)],
  ]);

  y += 4;
  y = drawSectionTitle(doc, y, 'Result');
  const passed = report.result.passed;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(passed ? 30 : 192, passed ? 120 : 60, passed ? 100 : 60);
  doc.text(passed ? 'PASS' : 'FAIL', MARGIN, y);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${(report.result.metricValue * 100).toFixed(1)}% (${report.result.metricKey})`, MARGIN + 28, y);
  y += 8;

  y = drawSectionTitle(doc, y, 'Narrative');
  y = drawWrappedText(doc, y, report.narrative);

  drawFooter(doc, report.reportId);

  doc.save(`${report.reportId}.pdf`);
}

export function exportProjectReportPdf(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  y = drawHeader(doc, y, 'Project Summary Report', report.reportId, report.generatedOnDay);

  y = drawSectionTitle(doc, y, 'Project Overview');
  y = drawKeyValueRows(doc, y, [
    ['Project', report.project.name],
    ['Customer', report.project.customer],
    ['Status', capitalize(report.project.status)],
    ['Due', formatCalendarWeek(report.project.dueDate.day)],
    ['Budget', formatMoney(report.project.budget)],
    ['Devices Under Test', String(report.duts.length)],
  ]);

  y += 4;
  y = drawSectionTitle(doc, y, 'Test Progress');
  y = drawKeyValueRows(doc, y, [
    ['Total Test Requests', String(report.totalRequests)],
    ['Completed', String(report.completedRequests)],
    ['Passed', String(report.passCount)],
    ['Failed', String(report.failCount)],
  ]);

  y += 4;
  y = drawSectionTitle(doc, y, 'Summary');
  y = drawWrappedText(doc, y, report.narrative);

  if (report.testReports.length > 0) {
    y += 4;
    y = drawSectionTitle(doc, y, 'Completed Test Detail');
    for (const tr of report.testReports) {
      if (y > 260) {
        doc.addPage();
        y = MARGIN;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(`${tr.testRequest.id.toUpperCase()} — ${tr.dut?.name || ''}`, MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(tr.result.passed ? 30 : 192, tr.result.passed ? 120 : 60, tr.result.passed ? 100 : 60);
      doc.text(tr.result.passed ? 'PASS' : 'FAIL', MARGIN + CONTENT_WIDTH - 15, y);
      y += 5;
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(8.5);
      const line = `${tr.procedure?.name || tr.testRequest.procedure} · ${(tr.result.metricValue * 100).toFixed(1)}% ${tr.result.metricKey}`;
      doc.text(line, MARGIN, y);
      y += 7;
    }
  }

  drawFooter(doc, report.reportId);

  doc.save(`${report.reportId}.pdf`);
}

function drawHeader(doc, y, title, reportId, generatedOnDay) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text('Satellite Powertrain Test Department', MARGIN, y);
  y += 6;
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(title, MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`${reportId}  ·  Generated on simulated ${formatCalendarWeek(generatedOnDay)}`, MARGIN, y);
  y += 4;
  doc.setDrawColor(210, 210, 210);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 8;
  return y;
}

function drawSectionTitle(doc, y, title) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 6;
  return y;
}

function drawKeyValueRows(doc, y, rows) {
  doc.setFontSize(9.5);
  for (const [key, value] of rows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(key, MARGIN, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(value), MARGIN + 55, y);
    y += 5.5;
  }
  return y;
}

function drawWrappedText(doc, y, text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  for (const line of lines) {
    doc.text(line, MARGIN, y);
    y += 5;
  }
  return y;
}

function drawFooter(doc, reportId) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`${reportId} · Page ${i} of ${pageCount}`, MARGIN, 290);
  }
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}
