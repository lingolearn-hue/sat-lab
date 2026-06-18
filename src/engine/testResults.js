import { PROCEDURES } from '../data/catalog.js';

// Deterministic result formula: DUT's rated stats scaled by bench tier bonus.
// Higher tier bench = better measured outcome, same DUT.
// No randomness in v1 — identical inputs always produce identical outputs.

const TIER_BONUS_PER_LEVEL = 0.08; // +8% per bench tier above 1

export function computeExecutionResult({ dut, procedure, benchTier }) {
  const procedureDef = PROCEDURES[procedure];
  if (!procedureDef) {
    throw new Error(`Unknown procedure: ${procedure}`);
  }

  const tierBonus = 1 + TIER_BONUS_PER_LEVEL * (benchTier - 1);
  const baseScore = baseScoreForProcedure(procedure, dut);
  const metricValue = clamp01(baseScore * tierBonus);

  const passed = metricValue >= procedureDef.passThreshold;

  return {
    procedure,
    metricKey: procedureDef.metricKey,
    metricValue: round(metricValue, 3),
    passed,
    benchTierApplied: benchTier,
  };
}

function baseScoreForProcedure(procedure, dut) {
  const specs = dut.specs;
  switch (procedure) {
    case 'efficiency_mapping':
      return specs.ratedEfficiency;
    case 'power_consumption':
      // Lower power per unit thrust is better; normalize to a 0-1 "efficiency" style score.
      return clamp01(1 - specs.powerW / (specs.thrustMN * 80));
    case 'endurance':
      // Heavier/higher-thrust units modeled as marginally harder to sustain.
      return clamp01(0.78 - specs.thrustMN / 2000);
    case 'lifetime':
      return clamp01(0.75 - specs.thrustMN / 2200);
    case 'component_drive':
      return clamp01(specs.ratedEfficiency - 0.05);
    default:
      return 0.5;
  }
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function round(n, decimals) {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
