// Static catalog data — not part of mutable state, referenced by id.
// Bench types available in the Ion Propulsion Laboratory.

export const BENCH_TYPES = {
  // Ion Propulsion Laboratory — one generic bench replaces the old Component/
  // Endurance/Perf. Mapping split. Tier 1 can run performance-style procedures;
  // endurance-style procedures additionally require MIN_TIER_FOR_ENDURANCE (see
  // PROCEDURES above) — that's the "update" that unlocks endurance testing, not a
  // separate physical bench.
  ion_propulsion_bench: {
    id: 'ion_propulsion_bench',
    name: 'Ion Propulsion Test Bench',
    description: 'Component-level drive, efficiency mapping, and power characterization. Upgrade to Tier 2 to unlock endurance and lifetime testing.',
    procedures: ['component_drive', 'efficiency_mapping', 'power_consumption', 'endurance', 'lifetime'],
    baseCost: 24000,
    maxTier: 3,
    upgradeCost: { 2: 13000, 3: 22000 },
  },

  // Other EPC labs — not yet installable/upgradeable in v1 (display-only on the
  // facility minimap and Laboratories module). Real Room + Bench entities, just
  // without an Operate-mode test-request workflow built on top yet.
  fuel_cell_stack: {
    id: 'fuel_cell_stack',
    name: 'Fuel Cell Stack Bench',
    description: 'Fuel cell stack efficiency, lifetime, and load cycling.',
    procedures: ['fc_efficiency', 'fc_load_cycling', 'fc_thermal'],
    baseCost: 24000,
    maxTier: 3,
    upgradeCost: { 2: 11000, 3: 19000 },
    channelsByTier: { 1: 96, 2: 192, 3: 192 }, // channels grouped visually in 6s
  },
  solar_panel: {
    id: 'solar_panel',
    name: 'Solar Panel Bench',
    description: 'Solar cell and panel efficiency, thermal aging, deployment testing.',
    procedures: [],
    baseCost: 21000,
    baseCycleTimeHours: 8,
    maxTier: 2,
    upgradeCost: { 2: 9500 },
  },
  hil_rig: {
    id: 'hil_rig',
    name: 'HIL Rig',
    description: 'Closed-loop hardware-in-the-loop subsystem validation and fault injection.',
    procedures: [],
    baseCost: 38000,
    baseCycleTimeHours: 5,
    maxTier: 2,
    upgradeCost: { 2: 17500 },
  },
  sil_workstation: {
    id: 'sil_workstation',
    name: 'SIL Workstation',
    description: 'Flight software, guidance, and navigation algorithm validation.',
    procedures: [],
    baseCost: 16000,
    baseCycleTimeHours: 3,
    maxTier: 2,
    upgradeCost: { 2: 7200 },
  },
  integration_stand: {
    id: 'integration_stand',
    name: 'Integration Stand',
    description: 'Full satellite subsystem integration and acceptance testing.',
    procedures: [],
    baseCost: 42000,
    baseCycleTimeHours: 14,
    maxTier: 2,
    upgradeCost: { 2: 19000 },
  },

  // Building B — Chemical Propulsion Center.
  // Chemical Thruster Laboratory is the second fully-interactive room outside Building A,
  // matching the precedent set by Ion Propulsion + Fuel Cell Power System.
  // One generic bench replaces the old Stand/Endurance-Stand split — same consolidation
  // as Ion Propulsion: Tier 2+ unlocks the ct_lifetime endurance procedure.
  chemical_thruster_bench: {
    id: 'chemical_thruster_bench',
    name: 'Chemical Thruster Test Bench',
    description: 'Thrust characterization, ignition reliability, fuel consumption, and thermal performance. Upgrade to Tier 2 to unlock lifetime testing.',
    procedures: ['thrust_characterization', 'ignition_reliability', 'ct_thermal_performance', 'fuel_consumption', 'ct_lifetime'],
    baseCost: 31000,
    maxTier: 3,
    upgradeCost: { 2: 14500, 3: 24000 },
  },

  // Building B — view-only rooms.
  propellant_test_rig: {
    id: 'propellant_test_rig',
    name: 'Propellant Test Rig',
    description: 'Tank, feed system, valve, and regulator leak/pressure/flow testing.',
    procedures: [],
    baseCost: 27000,
    baseCycleTimeHours: 9,
    maxTier: 2,
    upgradeCost: { 2: 12000 },
  },
  propulsion_integration_stand: {
    id: 'propulsion_integration_stand',
    name: 'Propulsion Integration Stand',
    description: 'Validation of complete chemical propulsion assemblies before satellite integration.',
    procedures: [],
    baseCost: 36000,
    baseCycleTimeHours: 12,
    maxTier: 2,
    upgradeCost: { 2: 16500 },
  },

  // Building C — Safety and Qualification Center.
  // Thermal Qualification Laboratory is the second fully-interactive room in this building
  // set, alongside Chemical Thruster Laboratory in Building B. One generic bench replaces
  // the old Chamber/Endurance-Chamber split — Tier 2+ unlocks thermal_endurance.
  thermal_chamber_bench: {
    id: 'thermal_chamber_bench',
    name: 'Thermal Qualification Chamber',
    description: 'Thermal cycling, extreme temperature operation, and thermal vacuum simulation. Upgrade to Tier 2 to unlock thermal endurance testing.',
    procedures: ['thermal_cycling', 'extreme_temp_operation', 'thermal_vacuum', 'thermal_endurance'],
    baseCost: 32000,
    maxTier: 3,
    upgradeCost: { 2: 15000, 3: 25000 },
  },

  // Building C — view-only rooms.
  preconditioning_unit: {
    id: 'preconditioning_unit',
    name: 'Preconditioning Unit',
    description: 'Temperature, humidity, and electrical conditioning prior to qualification.',
    procedures: [],
    baseCost: 19000,
    baseCycleTimeHours: 6,
    maxTier: 2,
    upgradeCost: { 2: 8500 },
  },
  electrical_fault_rig: {
    id: 'electrical_fault_rig',
    name: 'Electrical Fault Rig',
    description: 'Short circuit, over-current, over-voltage, and wiring fault testing.',
    procedures: [],
    baseCost: 23000,
    baseCycleTimeHours: 5,
    maxTier: 2,
    upgradeCost: { 2: 10000 },
  },
  emc_chamber: {
    id: 'emc_chamber',
    name: 'EMC Chamber',
    description: 'Electromagnetic compatibility, interference, and emissions testing.',
    procedures: [],
    baseCost: 41000,
    baseCycleTimeHours: 8,
    maxTier: 2,
    upgradeCost: { 2: 18500 },
  },
  shock_rig: {
    id: 'shock_rig',
    name: 'Shock & Impact Rig',
    description: 'Mechanical shock, impact resistance, and structural survivability testing.',
    procedures: [],
    baseCost: 26000,
    baseCycleTimeHours: 4,
    maxTier: 2,
    upgradeCost: { 2: 11500 },
  },
  fire_hazard_chamber: {
    id: 'fire_hazard_chamber',
    name: 'Fire & Hazard Chamber',
    description: 'Fire resistance, thermal runaway, and hazard containment testing.',
    procedures: [],
    baseCost: 32000,
    baseCycleTimeHours: 7,
    maxTier: 2,
    upgradeCost: { 2: 14500 },
  },
};

// Test procedures (from spec: Ion Propulsion Laboratory tests)
// category: 'performance' (days-scale) or 'endurance' (weeks-scale) — drives both
// how long the running phase takes and whether a tier-1 bench can run it at all
// (endurance requires MIN_TIER_FOR_ENDURANCE, performance runs at any tier).
export const PROCEDURE_DURATION_HOURS = {
  performance: { min: 48, max: 120 }, // 2-5 sim-days
  endurance: { min: 672, max: 1008 }, // 4-6 sim-weeks
};

export const MIN_TIER_FOR_ENDURANCE = 2;

// Deterministic duration within the category's range — varies slightly by DUT id
// so different devices don't all take the exact same number of hours, without
// introducing randomness (same DUT + same procedure always yields the same duration).
export function getProcedureDurationHours(procedureId, dutId) {
  const procedure = PROCEDURES[procedureId];
  const category = procedure?.category || 'performance';
  const range = PROCEDURE_DURATION_HOURS[category];
  const seed = hashStringToUnitInterval(`${procedureId}:${dutId || ''}`);
  return Math.round(range.min + seed * (range.max - range.min));
}

// Deterministic [0,1) value from a string seed — same input always produces the
// same output. Used anywhere this app needs "looks varied" without Math.random(),
// consistent with the project's no-randomness rule (test results, channel statuses,
// procedure durations, and incoming test request generation all use this).
//
// Uses an FNV-1a-style hash specifically because the simpler `hash*31+char` hash
// has weak avalanche behavior: consecutive seeds like "x:1", "x:2", "x:3" produced
// nearly-identical output (within ~0.001 of each other), which silently collapsed
// to the same bucket whenever a caller did Math.floor(seed * smallN) — exactly what
// happened with the auto-generated test requests, which all came out identical
// because every "incoming-pick:day:0..5" seed rounded to the same project index.
export function hashStringToUnitInterval(str) {
  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0; // FNV prime
  }
  // One extra avalanche round so the low bits (which determine small-modulus
  // buckets) are well-mixed, not just the high bits.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b) >>> 0;
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296; // unsigned 32-bit range, guarantees a [0, 1) result
}

export const PROCEDURES = {
  component_drive: { id: 'component_drive', name: 'Component Drive Test', metricKey: 'driveStability', passThreshold: 0.7, category: 'performance' },
  endurance: { id: 'endurance', name: 'Endurance Test', metricKey: 'enduranceScore', passThreshold: 0.65, category: 'endurance' },
  lifetime: { id: 'lifetime', name: 'Lifetime Test', metricKey: 'lifetimeScore', passThreshold: 0.65, category: 'endurance' },
  efficiency_mapping: { id: 'efficiency_mapping', name: 'Efficiency Mapping', metricKey: 'efficiency', passThreshold: 0.6, category: 'performance' },
  power_consumption: { id: 'power_consumption', name: 'Power Consumption Characterization', metricKey: 'powerEfficiency', passThreshold: 0.6, category: 'performance' },

  // Fuel Cell Power System Laboratory tests (spec: efficiency, lifetime, load cycling, thermal, system integration)
  fc_efficiency: { id: 'fc_efficiency', name: 'Fuel Cell Efficiency Test', metricKey: 'efficiency', passThreshold: 0.55, category: 'performance' },
  fc_load_cycling: { id: 'fc_load_cycling', name: 'Load Cycling Test', metricKey: 'cyclingStability', passThreshold: 0.6, category: 'performance' },
  fc_thermal: { id: 'fc_thermal', name: 'Thermal Behavior Test', metricKey: 'thermalStability', passThreshold: 0.6, category: 'performance' },

  // Chemical Thruster Laboratory tests (spec: thrust characterization, fuel consumption,
  // ignition reliability, thermal performance, lifetime testing)
  thrust_characterization: { id: 'thrust_characterization', name: 'Thrust Characterization', metricKey: 'thrustEfficiency', passThreshold: 0.6, category: 'performance' },
  ignition_reliability: { id: 'ignition_reliability', name: 'Ignition Reliability Test', metricKey: 'ignitionReliability', passThreshold: 0.7, category: 'performance' },
  ct_thermal_performance: { id: 'ct_thermal_performance', name: 'Thermal Performance Test', metricKey: 'thermalStability', passThreshold: 0.6, category: 'performance' },
  fuel_consumption: { id: 'fuel_consumption', name: 'Fuel Consumption Test', metricKey: 'fuelEfficiency', passThreshold: 0.55, category: 'performance' },
  ct_lifetime: { id: 'ct_lifetime', name: 'Thruster Lifetime Test', metricKey: 'lifetimeScore', passThreshold: 0.6, category: 'endurance' },

  // Thermal Qualification Laboratory tests (spec: thermal cycling, extreme temperature
  // operation, thermal endurance, thermal vacuum simulation)
  thermal_cycling: { id: 'thermal_cycling', name: 'Thermal Cycling Test', metricKey: 'thermalStability', passThreshold: 0.6, category: 'performance' },
  extreme_temp_operation: { id: 'extreme_temp_operation', name: 'Extreme Temperature Operation Test', metricKey: 'operationalMargin', passThreshold: 0.55, category: 'performance' },
  thermal_vacuum: { id: 'thermal_vacuum', name: 'Thermal Vacuum Simulation', metricKey: 'vacuumStability', passThreshold: 0.6, category: 'performance' },
  thermal_endurance: { id: 'thermal_endurance', name: 'Thermal Endurance Test', metricKey: 'enduranceScore', passThreshold: 0.6, category: 'endurance' },
};

export const ROOM_EXPANSION_COST_BASE = 38000;
export const ROOM_EXPANSION_SLOTS_PER_LEVEL = 1;

export const TEST_REQUEST_STATUSES = [
  'draft', 'submitted', 'approved', 'scheduled', 'running', 'review', 'completed', 'archived', 'expired',
];

// A submitted/approved request that hasn't been scheduled within this many sim-days
// of being created expires — keeps the incoming-request backlog from growing
// indefinitely (rooms can only process so much) and creates real urgency to act on
// new work rather than letting it sit. Once a request reaches 'scheduled' or later,
// it's no longer subject to expiry — the customer's request has been acted on, even
// if the actual test takes weeks (e.g. endurance procedures).
export const TEST_REQUEST_EXPIRY_DAYS = 4;

// Expired requests aren't deleted — they're auto-archived after this many further
// days, which hides them from the default Scheduling/active views (already filtered
// by status !== 'archived') while keeping the full record for history/audit on the
// Projects page, which intentionally shows a project's complete request history
// including archived ones.
export const EXPIRED_TO_ARCHIVED_DAYS = 7;

export const EXECUTION_PHASE_DURATIONS_HOURS = {
  scheduled: 1, // setup buffer before running
  running: null, // computed per-execution via getProcedureDurationHours(procedure, dutId)
  review: 2,
};

// Maintenance/calibration lifecycle (Operator role).
// Hours are accrued in real bench.hoursUsed, which already increments as tests run.
export const MAINTENANCE_DUE_HOURS = 250; // hours of use since last maintenance before it's due
export const MAINTENANCE_OVERDUE_HOURS = 400; // hours since last maintenance before bench goes out of service
export const CALIBRATION_DUE_HOURS = 500; // hours of use since last calibration before it's due
export const MAINTENANCE_DURATION_HOURS = 3; // sim-hours an Operator's maintenance action takes
export const CALIBRATION_DURATION_HOURS = 2;
export const MAINTENANCE_COST = 1200; // flat opex cost per maintenance action
export const CALIBRATION_COST = 800;

// ---- Consumables ----
// A handful of shared types used across several interactive rooms, plus two
// room-specific propellants. Consumed automatically per completed test execution
// (see appReducer.consumeForExecution); reordering is a manual Operator/Lab Manager
// action that costs money and restocks.

export const CONSUMABLE_TYPES = {
  calibration_gas: {
    id: 'calibration_gas',
    name: 'Calibration Gas',
    unit: 'canisters',
    usedByRoomIds: ['room-ipl', 'room-fcpl', 'room-ctl', 'room-tql'],
    consumptionPerTest: 1,
    reorderQuantity: 20,
    reorderCost: 3400,
    lowStockThreshold: 5,
  },
  coolant: {
    id: 'coolant',
    name: 'Coolant',
    unit: 'liters',
    usedByRoomIds: ['room-fcpl', 'room-ctl', 'room-tql'],
    consumptionPerTest: 4,
    reorderQuantity: 100,
    reorderCost: 2100,
    lowStockThreshold: 20,
  },
  xenon_propellant: {
    id: 'xenon_propellant',
    name: 'Xenon Propellant',
    unit: 'kg',
    usedByRoomIds: ['room-ipl'],
    consumptionPerTest: 2,
    reorderQuantity: 50,
    reorderCost: 8800,
    lowStockThreshold: 10,
  },
  hydrazine_propellant: {
    id: 'hydrazine_propellant',
    name: 'Hydrazine Propellant',
    unit: 'kg',
    usedByRoomIds: ['room-ctl'],
    consumptionPerTest: 6,
    reorderQuantity: 60,
    reorderCost: 6200,
    lowStockThreshold: 15,
  },
};

// ---- Personnel ----
// One qualification domain per interactive room. Capacity = how many concurrent
// tests one qualified person can supervise — reflects how hands-on the work is,
// not an arbitrary number. Hands-on/hazardous work (chemical thrusters) caps low;
// passive monitoring (fuel cell channels) caps high.

export const QUALIFICATION_DOMAINS = {
  ion_propulsion: { id: 'ion_propulsion', name: 'Ion Propulsion', roomId: 'room-ipl', capacityPerPerson: 2 },
  fuel_cell: { id: 'fuel_cell', name: 'Fuel Cell Power Systems', roomId: 'room-fcpl', capacityPerPerson: 50 },
  chemical_thruster: { id: 'chemical_thruster', name: 'Chemical Thruster', roomId: 'room-ctl', capacityPerPerson: 4 },
  thermal_qualification: { id: 'thermal_qualification', name: 'Thermal Qualification', roomId: 'room-tql', capacityPerPerson: 10 },
};
