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

  // Other EPC labs — not yet installable/upgradeable in v1 (display-only on the
  // facility minimap and Laboratories module). Real Room + Bench entities, just
  // without an Operate-mode test-request workflow built on top yet.
  fuel_cell_stack: {
    id: 'fuel_cell_stack',
    name: 'Fuel Cell Stack Bench',
    description: 'Fuel cell stack efficiency, lifetime, and load cycling.',
    procedures: ['fc_efficiency', 'fc_load_cycling', 'fc_thermal'],
    baseCost: 24000,
    baseCycleTimeHours: 10,
    maxTier: 2,
    upgradeCost: { 2: 11000 },
    channelsByTier: { 1: 96, 2: 192 }, // channels grouped visually in 6s
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
  chemical_thruster_stand: {
    id: 'chemical_thruster_stand',
    name: 'Chemical Thruster Stand',
    description: 'Thrust characterization, ignition reliability, and thermal performance testing.',
    procedures: ['thrust_characterization', 'ignition_reliability', 'ct_thermal_performance'],
    baseCost: 29000,
    baseCycleTimeHours: 7,
    maxTier: 2,
    upgradeCost: { 2: 13500 },
  },
  ct_endurance_stand: {
    id: 'ct_endurance_stand',
    name: 'Thruster Endurance Stand',
    description: 'Fuel consumption and lifetime testing under sustained firing.',
    procedures: ['fuel_consumption', 'ct_lifetime'],
    baseCost: 33500,
    baseCycleTimeHours: 16,
    maxTier: 2,
    upgradeCost: { 2: 16000 },
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
  // Thermal Qualification Laboratory is the second fully-interactive room in this building set,
  // alongside Chemical Thruster Laboratory in Building B.
  thermal_chamber: {
    id: 'thermal_chamber',
    name: 'Thermal Chamber',
    description: 'Thermal cycling, extreme temperature operation, and thermal vacuum simulation.',
    procedures: ['thermal_cycling', 'extreme_temp_operation', 'thermal_vacuum'],
    baseCost: 34000,
    baseCycleTimeHours: 11,
    maxTier: 2,
    upgradeCost: { 2: 15500 },
  },
  thermal_endurance_chamber: {
    id: 'thermal_endurance_chamber',
    name: 'Thermal Endurance Chamber',
    description: 'Extended thermal endurance testing under cyclic load.',
    procedures: ['thermal_endurance'],
    baseCost: 30000,
    baseCycleTimeHours: 20,
    maxTier: 2,
    upgradeCost: { 2: 14000 },
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
export const PROCEDURES = {
  component_drive: { id: 'component_drive', name: 'Component Drive Test', metricKey: 'driveStability', passThreshold: 0.7 },
  endurance: { id: 'endurance', name: 'Endurance Test', metricKey: 'enduranceScore', passThreshold: 0.65 },
  lifetime: { id: 'lifetime', name: 'Lifetime Test', metricKey: 'lifetimeScore', passThreshold: 0.65 },
  efficiency_mapping: { id: 'efficiency_mapping', name: 'Efficiency Mapping', metricKey: 'efficiency', passThreshold: 0.6 },
  power_consumption: { id: 'power_consumption', name: 'Power Consumption Characterization', metricKey: 'powerEfficiency', passThreshold: 0.6 },

  // Fuel Cell Power System Laboratory tests (spec: efficiency, lifetime, load cycling, thermal, system integration)
  fc_efficiency: { id: 'fc_efficiency', name: 'Fuel Cell Efficiency Test', metricKey: 'efficiency', passThreshold: 0.55 },
  fc_load_cycling: { id: 'fc_load_cycling', name: 'Load Cycling Test', metricKey: 'cyclingStability', passThreshold: 0.6 },
  fc_thermal: { id: 'fc_thermal', name: 'Thermal Behavior Test', metricKey: 'thermalStability', passThreshold: 0.6 },

  // Chemical Thruster Laboratory tests (spec: thrust characterization, fuel consumption,
  // ignition reliability, thermal performance, lifetime testing)
  thrust_characterization: { id: 'thrust_characterization', name: 'Thrust Characterization', metricKey: 'thrustEfficiency', passThreshold: 0.6 },
  ignition_reliability: { id: 'ignition_reliability', name: 'Ignition Reliability Test', metricKey: 'ignitionReliability', passThreshold: 0.7 },
  ct_thermal_performance: { id: 'ct_thermal_performance', name: 'Thermal Performance Test', metricKey: 'thermalStability', passThreshold: 0.6 },
  fuel_consumption: { id: 'fuel_consumption', name: 'Fuel Consumption Test', metricKey: 'fuelEfficiency', passThreshold: 0.55 },
  ct_lifetime: { id: 'ct_lifetime', name: 'Thruster Lifetime Test', metricKey: 'lifetimeScore', passThreshold: 0.6 },

  // Thermal Qualification Laboratory tests (spec: thermal cycling, extreme temperature
  // operation, thermal endurance, thermal vacuum simulation)
  thermal_cycling: { id: 'thermal_cycling', name: 'Thermal Cycling Test', metricKey: 'thermalStability', passThreshold: 0.6 },
  extreme_temp_operation: { id: 'extreme_temp_operation', name: 'Extreme Temperature Operation Test', metricKey: 'operationalMargin', passThreshold: 0.55 },
  thermal_vacuum: { id: 'thermal_vacuum', name: 'Thermal Vacuum Simulation', metricKey: 'vacuumStability', passThreshold: 0.6 },
  thermal_endurance: { id: 'thermal_endurance', name: 'Thermal Endurance Test', metricKey: 'enduranceScore', passThreshold: 0.6 },
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

// Maintenance/calibration lifecycle (Operator role).
// Hours are accrued in real bench.hoursUsed, which already increments as tests run.
export const MAINTENANCE_DUE_HOURS = 250; // hours of use since last maintenance before it's due
export const MAINTENANCE_OVERDUE_HOURS = 400; // hours since last maintenance before bench goes out of service
export const CALIBRATION_DUE_HOURS = 500; // hours of use since last calibration before it's due
export const MAINTENANCE_DURATION_HOURS = 3; // sim-hours an Operator's maintenance action takes
export const CALIBRATION_DURATION_HOURS = 2;
export const MAINTENANCE_COST = 1200; // flat opex cost per maintenance action
export const CALIBRATION_COST = 800;
