// Initial application state — the v1 vertical slice:
// Satellite Powertrain Test Department > Electric Propulsion Test Center (Building A) > Ion Propulsion Laboratory

export function createInitialState() {
  return {
    facility: {
      name: 'Satellite Powertrain Test Department',
      budget: 482300,
    },
    simClock: {
      day: 14,
      hour: 9,
      minute: 41,
      speedMultiplier: 24, // 1 real second = 24 sim minutes by default (adjustable)
      running: true,
    },
    currentRole: 'test_engineer', // 'operator' | 'test_engineer' | 'lab_manager'
    dailySnapshots: [], // populated once per sim-day rollover; see appReducer.recordDailySnapshot
    auditLog: [], // immutable, append-only; see appReducer.appendAuditEntry. Capped at AUDIT_LOG_MAX_ENTRIES.
    consumables: [
      { id: 'calibration_gas', stock: 18 },
      { id: 'coolant', stock: 65 },
      { id: 'xenon_propellant', stock: 22 },
      { id: 'hydrazine_propellant', stock: 8 }, // intentionally low, near the reorder threshold (15)
    ],
    personnel: [
      { id: 'per-001', name: 'Mara Whitfield', qualification: 'ion_propulsion', availability: 'available' },
      { id: 'per-002', name: 'Devon Okafor', qualification: 'ion_propulsion', availability: 'available' },
      { id: 'per-003', name: 'Priya Lindqvist', qualification: 'fuel_cell', availability: 'available' },
      { id: 'per-004', name: 'Theo Castellan', qualification: 'chemical_thruster', availability: 'available' },
      { id: 'per-005', name: 'Yuki Brennan', qualification: 'thermal_qualification', availability: 'available' },
      // Only one chemical_thruster-qualified person on staff at cap 4 — deliberately
      // tight, so the Chemical Thruster Lab can plausibly hit a personnel bottleneck
      // even when a bench is free, same way bnc-ipl-02 demonstrates maintenance friction.
    ],
    buildings: [
      { id: 'bldg-a1', name: 'Floor A1', code: 'A1', parentLabel: 'Building A — Electric Propulsion Test Center' },
      { id: 'bldg-a2', name: 'Floor A2', code: 'A2', parentLabel: 'Building A — Electric Propulsion Test Center' },
      { id: 'bldg-a3', name: 'Floor A3', code: 'A3', parentLabel: 'Building A — Electric Propulsion Test Center' },
      { id: 'bldg-b', name: 'Chemical Propulsion Center', code: 'B', parentLabel: null },
      { id: 'bldg-c', name: 'Safety and Qualification Center', code: 'C', parentLabel: null },
    ],
    rooms: [
      // Floor A1 — Ion Propulsion, Solar Array, Satellite Integration
      {
        id: 'room-ipl',
        buildingId: 'bldg-a1',
        name: 'Ion Propulsion Laboratory',
        tier: 1,
        maxSlots: 4,
        upkeepPerDay: 640,
      },
      {
        id: 'room-sal',
        buildingId: 'bldg-a1',
        name: 'Solar Array Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 260,
      },
      {
        id: 'room-sit',
        buildingId: 'bldg-a1',
        name: 'Satellite Integration Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 580,
      },

      // Floor A2 — Fuel Cell Power System, Thermal Qualification (moved from Building C)
      {
        id: 'room-fcpl',
        buildingId: 'bldg-a2',
        name: 'Fuel Cell Power System Laboratory',
        tier: 1,
        maxSlots: 3,
        upkeepPerDay: 410,
      },
      {
        id: 'room-tql',
        buildingId: 'bldg-a2',
        name: 'Thermal Qualification Laboratory',
        tier: 1,
        maxSlots: 3,
        upkeepPerDay: 560,
      },

      // Floor A3 — Hardware-in-the-Loop, Software-in-the-Loop, Office
      {
        id: 'room-hil',
        buildingId: 'bldg-a3',
        name: 'Hardware-in-the-Loop Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 510,
      },
      {
        id: 'room-sil',
        buildingId: 'bldg-a3',
        name: 'Software-in-the-Loop Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 300,
      },
      {
        id: 'room-office',
        buildingId: 'bldg-a3',
        name: 'Office',
        tier: 1,
        maxSlots: 0, // administrative space — no benches
        upkeepPerDay: 120,
      },

      // Building B — Chemical Propulsion Center
      {
        id: 'room-ctl',
        buildingId: 'bldg-b',
        name: 'Chemical Thruster Laboratory',
        tier: 1,
        maxSlots: 3,
        upkeepPerDay: 520,
      },
      {
        id: 'room-psl',
        buildingId: 'bldg-b',
        name: 'Propellant System Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 340,
      },
      {
        id: 'room-psil',
        buildingId: 'bldg-b',
        name: 'Propulsion System Integration Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 470,
      },

      // Building C — Safety and Qualification Center (Thermal Qualification moved out to A2)
      {
        id: 'room-pcl',
        buildingId: 'bldg-c',
        name: 'Preconditioning Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 290,
      },
      {
        id: 'room-efl',
        buildingId: 'bldg-c',
        name: 'Electrical Fault Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 330,
      },
      {
        id: 'room-emc',
        buildingId: 'bldg-c',
        name: 'EMC Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 380,
      },
      {
        id: 'room-sil2',
        buildingId: 'bldg-c',
        name: 'Shock and Impact Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 410,
      },
      {
        id: 'room-fhl',
        buildingId: 'bldg-c',
        name: 'Fire and Hazard Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 450,
      },
    ],
    benches: [
      {
        id: 'bnc-ipl-01',
        roomId: 'room-ipl',
        benchTypeId: 'ion_propulsion_bench',
        tier: 1,
        status: 'running',
        currentExecutionId: 'exec-0229',
        purchaseDate: { day: 1 },
        purchaseCost: 26000,
        hoursUsed: 140,
        hoursSinceLastMaintenance: 140,
        hoursSinceLastCalibration: 140,
      },
      {
        id: 'bnc-ipl-02',
        roomId: 'room-ipl',
        benchTypeId: 'ion_propulsion_bench',
        tier: 2,
        status: 'running',
        currentExecutionId: 'exec-0231',
        purchaseDate: { day: 1 },
        purchaseCost: 31500,
        hoursUsed: 410,
        hoursSinceLastMaintenance: 270, // past MAINTENANCE_DUE_HOURS (250) on purpose, for the Operator to act on immediately
        hoursSinceLastCalibration: 410,
      },
      {
        id: 'bnc-ipl-03',
        roomId: 'room-ipl',
        benchTypeId: 'ion_propulsion_bench',
        tier: 1,
        status: 'idle',
        currentExecutionId: null,
        purchaseDate: { day: 3 },
        purchaseCost: 18000,
        hoursUsed: 22,
        hoursSinceLastMaintenance: 22,
        hoursSinceLastCalibration: 22,
      },

      // Fuel Cell Power System Laboratory (2/3 slots used)
      { id: 'bnc-fcpl-01', roomId: 'room-fcpl', benchTypeId: 'fuel_cell_stack', tier: 1, status: 'running', currentExecutionId: 'exec-0301', purchaseDate: { day: 2 }, purchaseCost: 24000, hoursUsed: 96, hoursSinceLastMaintenance: 96, hoursSinceLastCalibration: 96 },
      { id: 'bnc-fcpl-02', roomId: 'room-fcpl', benchTypeId: 'fuel_cell_stack', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 5 }, purchaseCost: 24000, hoursUsed: 40, hoursSinceLastMaintenance: 40, hoursSinceLastCalibration: 40 },

      // Solar Array Laboratory (1/2 slots used)
      { id: 'bnc-sal-01', roomId: 'room-sal', benchTypeId: 'solar_panel', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 4 }, purchaseCost: 21000, hoursUsed: 18, hoursSinceLastMaintenance: 18, hoursSinceLastCalibration: 18 },

      // Hardware-in-the-Loop Laboratory (2/2 slots used, both running)
      { id: 'bnc-hil-01', roomId: 'room-hil', benchTypeId: 'hil_rig', tier: 2, status: 'running', currentExecutionId: null, purchaseDate: { day: 1 }, purchaseCost: 38000, hoursUsed: 210, hoursSinceLastMaintenance: 210, hoursSinceLastCalibration: 210 },
      { id: 'bnc-hil-02', roomId: 'room-hil', benchTypeId: 'hil_rig', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 6 }, purchaseCost: 38000, hoursUsed: 55, hoursSinceLastMaintenance: 55, hoursSinceLastCalibration: 55 },

      // Software-in-the-Loop Laboratory (1/2 slots used)
      { id: 'bnc-sil-01', roomId: 'room-sil', benchTypeId: 'sil_workstation', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 7 }, purchaseCost: 16000, hoursUsed: 30, hoursSinceLastMaintenance: 30, hoursSinceLastCalibration: 30 },

      // Satellite Integration Laboratory (2/2 slots used, both running)
      { id: 'bnc-sit-01', roomId: 'room-sit', benchTypeId: 'integration_stand', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 2 }, purchaseCost: 42000, hoursUsed: 88, hoursSinceLastMaintenance: 88, hoursSinceLastCalibration: 88 },
      { id: 'bnc-sit-02', roomId: 'room-sit', benchTypeId: 'integration_stand', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 8 }, purchaseCost: 42000, hoursUsed: 33, hoursSinceLastMaintenance: 33, hoursSinceLastCalibration: 33 },

      // Building B — Chemical Thruster Laboratory (interactive, 2/3 slots used)
      { id: 'bnc-ctl-01', roomId: 'room-ctl', benchTypeId: 'chemical_thruster_bench', tier: 1, status: 'running', currentExecutionId: 'exec-0401', purchaseDate: { day: 3 }, purchaseCost: 29000, hoursUsed: 64, hoursSinceLastMaintenance: 64, hoursSinceLastCalibration: 64 },
      { id: 'bnc-ctl-02', roomId: 'room-ctl', benchTypeId: 'chemical_thruster_bench', tier: 2, status: 'idle', currentExecutionId: null, purchaseDate: { day: 5 }, purchaseCost: 33500, hoursUsed: 28, hoursSinceLastMaintenance: 28, hoursSinceLastCalibration: 28 },

      // Building B — view-only rooms
      { id: 'bnc-psl-01', roomId: 'room-psl', benchTypeId: 'propellant_test_rig', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 4 }, purchaseCost: 27000, hoursUsed: 70, hoursSinceLastMaintenance: 70, hoursSinceLastCalibration: 70 },
      { id: 'bnc-psl-02', roomId: 'room-psl', benchTypeId: 'propellant_test_rig', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 9 }, purchaseCost: 27000, hoursUsed: 15, hoursSinceLastMaintenance: 15, hoursSinceLastCalibration: 15 },
      { id: 'bnc-psil-01', roomId: 'room-psil', benchTypeId: 'propulsion_integration_stand', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 6 }, purchaseCost: 36000, hoursUsed: 50, hoursSinceLastMaintenance: 50, hoursSinceLastCalibration: 50 },

      // Building C — Thermal Qualification Laboratory (interactive, 2/3 slots used)
      { id: 'bnc-tql-01', roomId: 'room-tql', benchTypeId: 'thermal_chamber_bench', tier: 1, status: 'running', currentExecutionId: 'exec-0501', purchaseDate: { day: 4 }, purchaseCost: 34000, hoursUsed: 80, hoursSinceLastMaintenance: 80, hoursSinceLastCalibration: 80 },
      { id: 'bnc-tql-02', roomId: 'room-tql', benchTypeId: 'thermal_chamber_bench', tier: 2, status: 'idle', currentExecutionId: null, purchaseDate: { day: 7 }, purchaseCost: 30000, hoursUsed: 20, hoursSinceLastMaintenance: 20, hoursSinceLastCalibration: 20 },

      // Building C — view-only rooms
      { id: 'bnc-pcl-01', roomId: 'room-pcl', benchTypeId: 'preconditioning_unit', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 5 }, purchaseCost: 19000, hoursUsed: 12, hoursSinceLastMaintenance: 12, hoursSinceLastCalibration: 12 },
      { id: 'bnc-efl-01', roomId: 'room-efl', benchTypeId: 'electrical_fault_rig', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 6 }, purchaseCost: 23000, hoursUsed: 45, hoursSinceLastMaintenance: 45, hoursSinceLastCalibration: 45 },
      { id: 'bnc-emc-01', roomId: 'room-emc', benchTypeId: 'emc_chamber', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 8 }, purchaseCost: 41000, hoursUsed: 18, hoursSinceLastMaintenance: 18, hoursSinceLastCalibration: 18 },
      { id: 'bnc-sil2-01', roomId: 'room-sil2', benchTypeId: 'shock_rig', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 9 }, purchaseCost: 26000, hoursUsed: 38, hoursSinceLastMaintenance: 38, hoursSinceLastCalibration: 38 },
      { id: 'bnc-fhl-01', roomId: 'room-fhl', benchTypeId: 'fire_hazard_chamber', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 10 }, purchaseCost: 32000, hoursUsed: 9, hoursSinceLastMaintenance: 9, hoursSinceLastCalibration: 9 },
    ],
    projects: [
      {
        id: 'proj-sat004',
        name: 'SAT-004 Ion Drive Qualification',
        customer: 'Helion Orbital Systems',
        startDate: { day: 1 },
        dueDate: { day: 40 },
        status: 'active',
        budget: 250000,
      },
      {
        id: 'proj-sat005',
        name: 'SAT-005 Fuel Cell Power Qualification',
        customer: 'Meridian Spaceworks',
        startDate: { day: 2 },
        dueDate: { day: 35 },
        status: 'active',
        budget: 180000,
      },
      {
        id: 'proj-sat006',
        name: 'SAT-006 Chemical Thruster Qualification',
        customer: 'Aurelia Launch Systems',
        startDate: { day: 3 },
        dueDate: { day: 38 },
        status: 'active',
        budget: 210000,
      },
      {
        id: 'proj-sat007',
        name: 'SAT-007 Thermal Qualification Program',
        customer: 'Orbital Dynamics Corp',
        startDate: { day: 4 },
        dueDate: { day: 42 },
        status: 'active',
        budget: 165000,
      },
    ],
    duts: [
      {
        id: 'dut-xr3',
        projectId: 'proj-sat004',
        name: 'XR-3 Ion Thruster',
        specs: { thrustMN: 85, powerW: 4200, ratedEfficiency: 0.72 },
      },
      {
        id: 'dut-xr4',
        projectId: 'proj-sat004',
        name: 'XR-4 Ion Thruster',
        specs: { thrustMN: 110, powerW: 5100, ratedEfficiency: 0.76 },
      },
      {
        id: 'dut-xr5',
        projectId: 'proj-sat004',
        name: 'XR-5 Ion Thruster',
        specs: { thrustMN: 130, powerW: 5800, ratedEfficiency: 0.79 },
      },
      {
        id: 'dut-fcp1',
        projectId: 'proj-sat005',
        name: 'FCP-1 Fuel Cell Power System',
        specs: { cellCount: 48, outputW: 3200, inputW: 4400, ratedEfficiency: 0.68 },
      },
      {
        id: 'dut-fcp2',
        projectId: 'proj-sat005',
        name: 'FCP-2 Fuel Cell Power System',
        specs: { cellCount: 64, outputW: 4100, inputW: 5500, ratedEfficiency: 0.71 },
      },
      {
        id: 'dut-ct1',
        projectId: 'proj-sat006',
        name: 'CT-1 Chemical Thruster',
        specs: { thrustN: 420, combustionTempK: 2750, ignitionMargin: 0.78, specificFuelConsumption: 0.42, ratedThrustEfficiency: 0.74 },
      },
      {
        id: 'dut-ct2',
        projectId: 'proj-sat006',
        name: 'CT-2 Chemical Thruster',
        specs: { thrustN: 580, combustionTempK: 2900, ignitionMargin: 0.81, specificFuelConsumption: 0.38, ratedThrustEfficiency: 0.77 },
      },
      {
        id: 'dut-tq1',
        projectId: 'proj-sat007',
        name: 'SAT-007 Avionics Module',
        specs: { thermalMarginK: 42, operatingRangeK: 220, outgassingRate: 0.05 },
      },
      {
        id: 'dut-tq2',
        projectId: 'proj-sat007',
        name: 'SAT-007 Structural Panel Assembly',
        specs: { thermalMarginK: 55, operatingRangeK: 260, outgassingRate: 0.03 },
      },
    ],
    testRequests: [
      {
        id: 'tr-0231',
        projectId: 'proj-sat004',
        dutId: 'dut-xr4',
        procedure: 'endurance',
        priority: 'high',
        requestedCompletionDay: 19,
        status: 'running',
        assignedBenchId: 'bnc-ipl-02',
      },
      {
        id: 'tr-0229',
        projectId: 'proj-sat004',
        dutId: 'dut-xr3',
        procedure: 'efficiency_mapping',
        priority: 'normal',
        requestedCompletionDay: 15,
        status: 'running',
        assignedBenchId: 'bnc-ipl-01',
      },
      {
        id: 'tr-0227',
        projectId: 'proj-sat004',
        dutId: 'dut-xr3',
        procedure: 'power_consumption',
        priority: 'normal',
        requestedCompletionDay: 14,
        status: 'review',
        assignedBenchId: null,
      },
      {
        id: 'tr-0233',
        projectId: 'proj-sat004',
        dutId: 'dut-xr5',
        procedure: 'lifetime',
        priority: 'low',
        requestedCompletionDay: 28,
        status: 'scheduled',
        assignedBenchId: null,
      },
      {
        id: 'tr-0301',
        projectId: 'proj-sat005',
        dutId: 'dut-fcp1',
        procedure: 'fc_load_cycling',
        priority: 'normal',
        requestedCompletionDay: 18,
        status: 'running',
        assignedBenchId: 'bnc-fcpl-01',
      },
      {
        id: 'tr-0303',
        projectId: 'proj-sat005',
        dutId: 'dut-fcp2',
        procedure: 'fc_efficiency',
        priority: 'normal',
        requestedCompletionDay: 22,
        status: 'approved',
        assignedBenchId: null,
        submittedOnDay: 13,
      },
      {
        id: 'tr-0401',
        projectId: 'proj-sat006',
        dutId: 'dut-ct1',
        procedure: 'thrust_characterization',
        priority: 'high',
        requestedCompletionDay: 20,
        status: 'running',
        assignedBenchId: 'bnc-ctl-01',
      },
      {
        id: 'tr-0403',
        projectId: 'proj-sat006',
        dutId: 'dut-ct2',
        procedure: 'ignition_reliability',
        priority: 'normal',
        requestedCompletionDay: 25,
        status: 'submitted',
        assignedBenchId: null,
        submittedOnDay: 13, // recent — submitted the day before "now" (day 14), well within the 4-day expiry window
      },
      {
        id: 'tr-0501',
        projectId: 'proj-sat007',
        dutId: 'dut-tq1',
        procedure: 'thermal_vacuum',
        priority: 'normal',
        requestedCompletionDay: 24,
        status: 'running',
        assignedBenchId: 'bnc-tql-01',
      },
      {
        id: 'tr-0503',
        projectId: 'proj-sat007',
        dutId: 'dut-tq2',
        procedure: 'thermal_cycling',
        priority: 'low',
        requestedCompletionDay: 30,
        status: 'approved',
        assignedBenchId: null,
        submittedOnDay: 12,
      },
    ],
    executions: [
      {
        id: 'exec-0231',
        testRequestId: 'tr-0231',
        benchId: 'bnc-ipl-02',
        assignedPersonnelId: 'per-001',
        phase: 'running',
        // Endurance test (800h ~ 33 sim-days) — started on day 1 so it's genuinely
        // mid-run by day 14, not nearly finished on the old 18-hour scale.
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(1, 8, 0),
        phaseDurationHours: 800,
        runningPhaseDurationHours: 800,
        result: null,
      },
      {
        id: 'exec-0229',
        testRequestId: 'tr-0229',
        benchId: 'bnc-ipl-01',
        assignedPersonnelId: 'per-001',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(13, 8, 0),
        phaseDurationHours: 103,
        runningPhaseDurationHours: 103,
        result: null,
      },
      {
        id: 'exec-0301',
        testRequestId: 'tr-0301',
        benchId: 'bnc-fcpl-01',
        assignedPersonnelId: 'per-003',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(12, 18, 0),
        phaseDurationHours: 116,
        runningPhaseDurationHours: 116,
        result: null,
      },
      {
        id: 'exec-0401',
        testRequestId: 'tr-0401',
        benchId: 'bnc-ctl-01',
        assignedPersonnelId: 'per-004',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(13, 4, 0),
        phaseDurationHours: 81,
        runningPhaseDurationHours: 81,
        result: null,
      },
      {
        id: 'exec-0501',
        testRequestId: 'tr-0501',
        benchId: 'bnc-tql-01',
        assignedPersonnelId: 'per-005',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(12, 23, 0),
        phaseDurationHours: 114,
        runningPhaseDurationHours: 114,
        result: null,
      },
    ],
    transactions: [
      { id: 'txn-1', simDay: 1, type: 'capex', category: 'bench_purchase', amount: -26000, description: 'Installed BNC-IPL-01 (Perf. Mapping Bench)' },
      { id: 'txn-2', simDay: 1, type: 'capex', category: 'bench_purchase', amount: -31500, description: 'Installed BNC-IPL-02 (Endurance Bench)' },
      { id: 'txn-3', simDay: 3, type: 'capex', category: 'bench_purchase', amount: -18000, description: 'Installed BNC-IPL-03 (Component Bench)' },
    ],
    eventFeed: [
      { id: 'evt-1', simDay: 14, simHour: 9, simMinute: 14, message: 'BNC-IPL-02 phase advanced to Running', relatedEntityId: 'bnc-ipl-02', severity: 'info' },
      { id: 'evt-2', simDay: 14, simHour: 9, simMinute: 27, message: 'BNC-IPL-01 maintenance due in 2 days', relatedEntityId: 'bnc-ipl-01', severity: 'warning' },
      { id: 'evt-3', simDay: 14, simHour: 8, simMinute: 51, message: 'Test request TR-0231 approved', relatedEntityId: 'tr-0231', severity: 'info' },
      { id: 'evt-4', simDay: 14, simHour: 8, simMinute: 30, message: 'BNC-IPL-03 entered idle state', relatedEntityId: 'bnc-ipl-03', severity: 'info' },
    ],
  };
}

function dayHourMinuteToTotalMinutes(day, hour, minute) {
  return day * 1440 + hour * 60 + minute;
}
