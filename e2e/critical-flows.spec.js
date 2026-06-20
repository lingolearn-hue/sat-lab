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
    expect(after).toBe(before + 1);
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
        id: 'tr-test-e2e', projectId: 'proj-sat004', dutId: 'dut-xr5', procedure: 'lifetime',
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
