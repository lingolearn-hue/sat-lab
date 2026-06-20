import { describe, it, expect } from 'vitest';
import { computeExecutionResult } from './testResults.js';

describe('computeExecutionResult — determinism', () => {
  it('produces identical output for identical input, every time', () => {
    const dut = { specs: { ratedEfficiency: 0.72 } };
    const results = Array.from({ length: 5 }, () =>
      computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 })
    );
    for (const r of results) {
      expect(r).toEqual(results[0]);
    }
  });

  it('throws on an unknown procedure rather than silently guessing', () => {
    const dut = { specs: { ratedEfficiency: 0.7 } };
    expect(() => computeExecutionResult({ dut, procedure: 'not_a_real_procedure', benchTier: 1 })).toThrow();
  });
});

describe('computeExecutionResult — tier bonus', () => {
  it('a higher bench tier never produces a lower metric value than tier 1, same DUT', () => {
    const dut = { specs: { ratedEfficiency: 0.65 } };
    const t1 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    const t2 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 2 });
    const t3 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 3 });
    expect(t2.metricValue).toBeGreaterThanOrEqual(t1.metricValue);
    expect(t3.metricValue).toBeGreaterThanOrEqual(t2.metricValue);
  });

  it('applies exactly +8% per tier above 1 (matches the documented TIER_BONUS_PER_LEVEL)', () => {
    const dut = { specs: { ratedEfficiency: 0.5 } };
    const t1 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    const t2 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 2 });
    expect(t2.metricValue).toBeCloseTo(t1.metricValue * 1.08, 2);
  });

  it('clamps at 1.0 even when the tier bonus would push it over', () => {
    const dut = { specs: { ratedEfficiency: 0.97 } };
    const result = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 3 });
    expect(result.metricValue).toBeLessThanOrEqual(1);
  });
});

describe('computeExecutionResult — pass/fail threshold', () => {
  it('passes when the metric meets the procedure threshold exactly', () => {
    const dut = { specs: { ratedEfficiency: 0.6 } };
    const result = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    expect(result.passed).toBe(true);
  });

  it('fails when the metric falls just under the procedure threshold', () => {
    const dut = { specs: { ratedEfficiency: 0.55 } };
    const result = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    expect(result.passed).toBe(false);
  });

  it('a borderline DUT can be pushed to pass by a higher-tier bench', () => {
    const dut = { specs: { ratedEfficiency: 0.58 } };
    const tier1 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    const tier2 = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 2 });
    expect(tier1.passed).toBe(false);
    expect(tier2.passed).toBe(true);
  });
});

describe('computeExecutionResult — per-domain scoring sanity checks', () => {
  it('power_consumption rewards lower power per unit thrust', () => {
    const efficientDut = { specs: { thrustMN: 100, powerW: 4000 } };
    const inefficientDut = { specs: { thrustMN: 100, powerW: 8000 } };
    const efficientResult = computeExecutionResult({ dut: efficientDut, procedure: 'power_consumption', benchTier: 1 });
    const inefficientResult = computeExecutionResult({ dut: inefficientDut, procedure: 'power_consumption', benchTier: 1 });
    expect(efficientResult.metricValue).toBeGreaterThan(inefficientResult.metricValue);
  });

  it('fuel_consumption rewards lower specific fuel consumption', () => {
    const efficientDut = { specs: { specificFuelConsumption: 0.3 } };
    const inefficientDut = { specs: { specificFuelConsumption: 0.7 } };
    const efficientResult = computeExecutionResult({ dut: efficientDut, procedure: 'fuel_consumption', benchTier: 1 });
    const inefficientResult = computeExecutionResult({ dut: inefficientDut, procedure: 'fuel_consumption', benchTier: 1 });
    expect(efficientResult.metricValue).toBeGreaterThan(inefficientResult.metricValue);
  });

  it('fc_load_cycling rewards a higher cell count', () => {
    const smallStack = { specs: { cellCount: 24 } };
    const largeStack = { specs: { cellCount: 96 } };
    const smallResult = computeExecutionResult({ dut: smallStack, procedure: 'fc_load_cycling', benchTier: 1 });
    const largeResult = computeExecutionResult({ dut: largeStack, procedure: 'fc_load_cycling', benchTier: 1 });
    expect(largeResult.metricValue).toBeGreaterThan(smallResult.metricValue);
  });

  it('metricKey in the result matches the procedure catalog definition', () => {
    const dut = { specs: { ratedEfficiency: 0.7 } };
    const result = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    expect(result.metricKey).toBe('efficiency');
  });

  it('every metricValue is rounded to 3 decimal places', () => {
    const dut = { specs: { ratedEfficiency: 0.7234567 } };
    const result = computeExecutionResult({ dut, procedure: 'efficiency_mapping', benchTier: 1 });
    const decimalPlaces = (String(result.metricValue).split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(3);
  });
});
