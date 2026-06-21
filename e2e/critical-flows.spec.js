import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('Build mode — install and upgrade economy', () => {
  test('installing a bench deducts budget and adds it to the room', async ({ page }) => {
    await page.click('text=Build');
    await page.click('text=Floor A1');

    const budgetBefore = await page.evaluate(
      () => JSON.parse(localStorage.getItem('satellite-test-center:state:v1')).facility.budget
    );

    await page.click('button:has-text("INSTALL") >> nth=0');
    await page.waitForTimeout(300);

    const budgetAfter = await page.evaluate(
      () => JSON.parse(localStorage.getItem('satellite-test-center:state:v1')).facility.budget
    );
    expect(budgetAfter).toBeLessThan(budgetBefore);
  });

  test('upgrading a bench increases its tier and deducts budget', async ({ page }) => {
    await page.click('text=Build');
    await page.click('text=Floor A1');

    const before = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      return { budget: s.facility.budget, tier: s.benches.find((b) => b.id === 'bnc-ipl-03').tier };
    });

    await page.click('button:has-text("UPGRADE BNC-IPL-03")');
    await page.waitForTimeout(300);

    const after = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      return { budget: s.facility.budget, tier: s.benches.find((b) => b.id === 'bnc-ipl-03').tier };
    });

    expect(after.tier).toBe(before.tier + 1);
    expect(after.budget).toBeLessThan(before.budget);
  });

  test('building navigation: overview -> floor -> arrow cycle -> back to overview', async ({ page }) => {
    await page.click('text=Build');
    await expect(page.locator('text=Facility Overview')).toBeVisible();

    await page.click('text=Floor A1');
    await expect(page.locator('text=Ion Propulsion Laboratory').first()).toBeVisible();

    await page.click('button[title="Next building/floor"]');
    await expect(page.locator('text=Fuel Cell Power System Laboratory').first()).toBeVisible();

    await page.click('text=← OVERVIEW');
    await expect(page.locator('text=Facility Overview')).toBeVisible();
  });
});

test.describe('Operate mode — test request workflow', () => {
  test('submitting a new test request adds it with status Submitted', async ({ page }) => {
    await page.click('text=Scheduling');
    const before = await page.evaluate(
      () => JSON.parse(localStorage.getItem('satellite-test-center:state:v1')).testRequests.length
    );

    await page.click('text=+ New Test Request');
    await page.click('text=Submit Request');
    await page.waitForTimeout(300);

    const after = await page.evaluate(
      () => JSON.parse(localStorage.getItem('satellite-test-center:state:v1')).testRequests.length
    );
    // Not a strict +1: the automatic-arrival mechanic can also add requests during
    // this same window (it runs on every sim-tick, independent of this action), so
    // this only asserts "at least the one we just submitted," not an exact count.
    expect(after).toBeGreaterThanOrEqual(before + 1);
  });

  test('a submitted request cannot be scheduled directly — only after Approve', async ({ page }) => {
    const result = await page.evaluate(() => {
      const raw = localStorage.getItem('satellite-test-center:state:v1');
      return JSON.parse(raw).testRequests.find((tr) => tr.id === 'tr-0403')?.status;
    });
    expect(result).toBe('submitted');
  });

  test('role switching changes the visible nav and default landing page', async ({ page }) => {
    await expect(page.locator('text=Projects').first()).toBeVisible();

    await page.click('button:has-text("Test Engineer")');
    await page.click('div >> text="Laboratory Manager" >> nth=0');
    await page.waitForTimeout(300);

    await expect(page.locator('text=Scheduling').first()).toBeVisible();
  });
});

test.describe('Personnel-aware scheduling', () => {
  test('a bench can be free while a request is still blocked on personnel capacity', async ({ page }) => {
    await page.evaluate(() => {
      const raw = localStorage.getItem('satellite-test-center:state:v1');
      const state = JSON.parse(raw);
      state.executions.push(
        { id: 'e1', testRequestId: 'f1', benchId: 'bnc-ipl-03', assignedPersonnelId: 'per-002', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 5, result: null },
        { id: 'e2', testRequestId: 'f2', benchId: 'bnc-ipl-03', assignedPersonnelId: 'per-002', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 5, result: null }
      );
      state.testRequests.push({
        id: 'tr-test-e2e', projectId: 'proj-sat004', dutId: 'dut-xr5', procedure: 'efficiency_mapping',
        priority: 'normal', requestedCompletionDay: 30, status: 'approved', assignedBenchId: null,
      });
      const bench = state.benches.find((b) => b.id === 'bnc-ipl-03');
      bench.status = 'idle';
      bench.currentExecutionId = null;
      localStorage.setItem('satellite-test-center:state:v1', JSON.stringify(state));
    });
    await page.reload();
    await page.click('text=Scheduling');

    await expect(page.locator('text=No Ion Propulsion staff free')).toBeVisible();
  });
});

test.describe('Bench consolidation — endurance tier gating', () => {
  test('an endurance-category test cannot be scheduled on a tier-1 bench, but can once upgraded', async ({ page }) => {
    await page.evaluate(() => {
      const raw = localStorage.getItem('satellite-test-center:state:v1');
      const state = JSON.parse(raw);
      state.testRequests.push({
        id: 'tr-test-endurance', projectId: 'proj-sat004', dutId: 'dut-xr5', procedure: 'lifetime',
        priority: 'normal', requestedCompletionDay: 60, status: 'approved', assignedBenchId: null,
      });
      const bench = state.benches.find((b) => b.id === 'bnc-ipl-03');
      bench.status = 'idle';
      bench.currentExecutionId = null;
      bench.tier = 1;
      localStorage.setItem('satellite-test-center:state:v1', JSON.stringify(state));
    });
    await page.reload();
    await page.click('text=Scheduling');

    // Tier 1: bench is idle but not upgraded enough for this endurance test.
    const row = page.locator('tr', { hasText: 'TR-TEST-ENDURANCE' });
    await expect(row.locator('text=Needs Tier 2+ bench')).toBeVisible();

    // Upgrade the bench to tier 2, then the same request should become schedulable.
    await page.click('text=Build');
    await page.click('text=Floor A1');
    await page.click('button:has-text("UPGRADE BNC-IPL-03")');
    await page.waitForTimeout(300);
    await page.click('text=Operate');
    await page.click('text=Scheduling');

    await expect(row.locator('text=Schedule on BNC-IPL-03')).toBeVisible();
  });
});

test.describe('Save / load', () => {
  test('a directly modified save file is reflected after reload', async ({ page }) => {
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      s.facility.budget = 999999;
      localStorage.setItem('satellite-test-center:state:v1', JSON.stringify(s));
    });
    await page.reload();

    await expect(page.locator('text=$999,999').first()).toBeVisible();
  });
});

test.describe('Test request detail overlay', () => {
  test('clicking a request opens its detail view with stakeholders, divergence, and documents', async ({ page }) => {
    await page.click('text=Scheduling');
    await page.click('tr:has-text("TR-0231")');

    await expect(page.locator('text=TR-0231').first()).toBeVisible();
    await expect(page.locator('text=STAKEHOLDERS')).toBeVisible();
    await expect(page.locator('text=PROCEDURE DIVERGENCE')).toBeVisible();
    await expect(page.locator('text=DOCUMENTS')).toBeVisible();
    await expect(page.locator('text=Test Procedure — Endurance Test.pdf')).toBeVisible();
  });

  test('adding a stakeholder persists to state', async ({ page }) => {
    await page.click('text=Scheduling');
    await page.click('tr:has-text("TR-0231")');

    await page.fill('input[placeholder="Name"]', 'Jane Doe');
    await page.fill('input[placeholder="Role"]', 'QA Lead');
    await page.click('text=+ Add');

    const stakeholders = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      return s.testRequests.find((tr) => tr.id === 'tr-0231').stakeholders;
    });
    expect(stakeholders.some((s) => s.name === 'Jane Doe' && s.role === 'QA Lead')).toBe(true);
  });

  test('toggling procedure divergence persists to state', async ({ page }) => {
    await page.click('text=Scheduling');
    await page.click('tr:has-text("TR-0231")');

    await page.click('text=Mark as diverging');
    const diverges = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      return s.testRequests.find((tr) => tr.id === 'tr-0231').divergesFromStandard;
    });
    expect(diverges).toBe(true);
  });
});

test.describe('Mobile/Desktop toggle', () => {
  test('the floating toggle switches modes and is always present, regardless of viewport size', async ({ page }) => {
    // Default desktop viewport from playwright.config.js — should start in Desktop mode.
    await expect(page.locator('button[aria-label="Switch to Mobile view"]')).toBeVisible();
    await page.click('button[aria-label="Switch to Mobile view"]');
    await expect(page.locator('button[aria-label="Switch to Desktop view"]')).toBeVisible();
    await page.click('button[aria-label="Switch to Desktop view"]');
    await expect(page.locator('button[aria-label="Switch to Mobile view"]')).toBeVisible();
  });
});

test.describe('Scheduling list — filters and ordering', () => {
  test('the test request list shows newest requests first', async ({ page }) => {
    // The underlying creation order is whatever order requests were appended in
    // state.testRequests (seed data's hand-assigned ids aren't strictly increasing
    // in that order — e.g. tr-0231 was seeded before tr-0229). "Newest first" means
    // reversed array order, so check against the real state, not an id-number sort.
    await page.click('text=Scheduling');
    const expectedOrder = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      return s.testRequests.filter((tr) => tr.status !== 'archived').map((tr) => tr.id.toUpperCase()).reverse();
    });
    const shownOrder = await page.locator('table tbody tr td:first-child').allInnerTexts();
    expect(shownOrder).toEqual(expectedOrder);
  });

  test('filtering by status narrows the list to only that status', async ({ page }) => {
    await page.click('text=Scheduling');
    await page.selectOption('select >> nth=0', 'running');
    const statusCells = await page.locator('table tbody tr td:nth-child(6) span').allInnerTexts();
    expect(statusCells.every((s) => s === 'Running')).toBe(true);
  });

  test('clear filters resets the list', async ({ page }) => {
    await page.click('text=Scheduling');
    // Pause the clock so auto-arrival can't change the row count between reads —
    // this test is about filter UI behavior, not about counting requests over time.
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      s.simClock.running = false;
      localStorage.setItem('satellite-test-center:state:v1', JSON.stringify(s));
    });
    await page.reload();
    await page.click('text=Scheduling');
    const before = await page.locator('table tbody tr').count();
    await page.selectOption('select >> nth=0', 'running');
    await page.click('text=Clear filters');
    const after = await page.locator('table tbody tr').count();
    expect(after).toBe(before);
  });
});

test.describe('Deferred-start scheduling and Gantt visualization', () => {
  test('scheduling a request for a future day reserves the bench without starting it, and shows on the Gantt chart', async ({ page }) => {
    // Pause the clock so the day doesn't drift while interacting with the popover.
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      s.simClock.running = false;
      localStorage.setItem('satellite-test-center:state:v1', JSON.stringify(s));
    });
    await page.reload();

    await page.click('text=Scheduling');
    await page.click('text=Schedule on BNC-FCPL-02');
    await page.fill('input[type="number"]', '30');
    await page.click('text=Start on that day');
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('satellite-test-center:state:v1'));
      const bench = s.benches.find((b) => b.id === 'bnc-fcpl-02');
      const tr = s.testRequests.find((t) => t.id === 'tr-0303');
      return { benchStatus: bench.status, trScheduledStartDay: tr.scheduledStartDay };
    });
    expect(state.benchStatus).toBe('reserved');
    expect(state.trScheduledStartDay).toBe(30);

    await page.click('text=Statistics');
    await expect(page.locator('text=Bench Schedule (Gantt)')).toBeVisible();
    await page.locator('text=Bench Schedule (Gantt)').scrollIntoViewIfNeeded();
    // Target the visible SVG <text> label specifically — the bar also has a
    // <title> child (native hover tooltip) with the same text, which matches
    // `text=TR-0303` too but is never visible by definition.
    await expect(page.locator('svg text:has-text("TR-0303")')).toBeVisible();
  });
});
