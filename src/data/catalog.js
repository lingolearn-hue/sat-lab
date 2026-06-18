// Static catalog data — not part of mutable state, referenced by id.
// Bench types available in the Ion Propulsion Laboratory.

export const BENCH_TYPES = {
  component: {
    id: 'component',
    name: 'Component Bench',
    description: 'Component-level ion drive testing. Lowest throughput, lowest cost.',
    procedures: ['component_drive'],
    baseCost: 18000,
    baseCycleTimeHours: 6,
    maxTier: 2,
    upgradeCost: { 2: 9800 },
  },
  endurance: {
    id: 'endurance',
    name: 'Endurance Bench',
    description: 'Long-duration lifetime and endurance testing. Slower throughput, high data value.',
    procedures: ['endurance', 'lifetime'],
    baseCost: 31500,
    baseCycleTimeHours: 18,
    maxTier: 3,
    upgradeCost: { 2: 12500, 3: 21000 },
  },
  perf_mapping: {
    id: 'perf_mapping',
    name: 'Perf. Mapping Bench',
    description: 'Efficiency and power consumption mapping. Fast cycle time.',
    procedures: ['efficiency_mapping', 'power_consumption'],
    baseCost: 26000,
    baseCycleTimeHours: 4,
    maxTier: 2,
    upgradeCost: { 2: 14200 },
  },
};

// Test procedures (from spec: Ion Propulsion Laboratory tests)
export const PROCEDURES = {
  component_drive: { id: 'component_drive', name: 'Component Drive Test', metricKey: 'driveStability', passThreshold: 0.7 },
  endurance: { id: 'endurance', name: 'Endurance Test', metricKey: 'enduranceScore', passThreshold: 0.65 },
  lifetime: { id: 'lifetime', name: 'Lifetime Test', metricKey: 'lifetimeScore', passThreshold: 0.65 },
  efficiency_mapping: { id: 'efficiency_mapping', name: 'Efficiency Mapping', metricKey: 'efficiency', passThreshold: 0.6 },
  power_consumption: { id: 'power_consumption', name: 'Power Consumption Characterization', metricKey: 'powerEfficiency', passThreshold: 0.6 },
};

export const ROOM_EXPANSION_COST_BASE = 38000;
export const ROOM_EXPANSION_SLOTS_PER_LEVEL = 1;

export const TEST_REQUEST_STATUSES = [
  'draft', 'submitted', 'approved', 'scheduled', 'running', 'review', 'completed', 'archived',
];

export const EXECUTION_PHASE_DURATIONS_HOURS = {
  scheduled: 1, // setup buffer before running
  running: null, // comes from bench cycle time
  review: 2,
};
