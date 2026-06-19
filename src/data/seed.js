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
    currentRole: 'test_engineer', // 'test_engineer' | 'lab_manager'
    buildings: [
      { id: 'bldg-a', name: 'Electric Propulsion Test Center', code: 'A' },
    ],
    rooms: [
      {
        id: 'room-ipl',
        buildingId: 'bldg-a',
        name: 'Ion Propulsion Laboratory',
        tier: 1,
        maxSlots: 4,
        upkeepPerDay: 640,
      },
      {
        id: 'room-fcpl',
        buildingId: 'bldg-a',
        name: 'Fuel Cell Power System Laboratory',
        tier: 1,
        maxSlots: 3,
        upkeepPerDay: 410,
      },
      {
        id: 'room-sal',
        buildingId: 'bldg-a',
        name: 'Solar Array Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 260,
      },
      {
        id: 'room-hil',
        buildingId: 'bldg-a',
        name: 'Hardware-in-the-Loop Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 510,
      },
      {
        id: 'room-sil',
        buildingId: 'bldg-a',
        name: 'Software-in-the-Loop Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 300,
      },
      {
        id: 'room-sit',
        buildingId: 'bldg-a',
        name: 'Satellite Integration Laboratory',
        tier: 1,
        maxSlots: 2,
        upkeepPerDay: 580,
      },
    ],
    benches: [
      {
        id: 'bnc-ipl-01',
        roomId: 'room-ipl',
        benchTypeId: 'perf_mapping',
        tier: 1,
        status: 'running',
        currentExecutionId: 'exec-0229',
        purchaseDate: { day: 1 },
        purchaseCost: 26000,
        hoursUsed: 140,
      },
      {
        id: 'bnc-ipl-02',
        roomId: 'room-ipl',
        benchTypeId: 'endurance',
        tier: 2,
        status: 'running',
        currentExecutionId: 'exec-0231',
        purchaseDate: { day: 1 },
        purchaseCost: 31500,
        hoursUsed: 410,
      },
      {
        id: 'bnc-ipl-03',
        roomId: 'room-ipl',
        benchTypeId: 'component',
        tier: 1,
        status: 'idle',
        currentExecutionId: null,
        purchaseDate: { day: 3 },
        purchaseCost: 18000,
        hoursUsed: 22,
      },

      // Fuel Cell Power System Laboratory (2/3 slots used)
      { id: 'bnc-fcpl-01', roomId: 'room-fcpl', benchTypeId: 'fuel_cell_stack', tier: 1, status: 'running', currentExecutionId: 'exec-0301', purchaseDate: { day: 2 }, purchaseCost: 24000, hoursUsed: 96 },
      { id: 'bnc-fcpl-02', roomId: 'room-fcpl', benchTypeId: 'fuel_cell_stack', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 5 }, purchaseCost: 24000, hoursUsed: 40 },

      // Solar Array Laboratory (1/2 slots used)
      { id: 'bnc-sal-01', roomId: 'room-sal', benchTypeId: 'solar_panel', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 4 }, purchaseCost: 21000, hoursUsed: 18 },

      // Hardware-in-the-Loop Laboratory (2/2 slots used, both running)
      { id: 'bnc-hil-01', roomId: 'room-hil', benchTypeId: 'hil_rig', tier: 2, status: 'running', currentExecutionId: null, purchaseDate: { day: 1 }, purchaseCost: 38000, hoursUsed: 210 },
      { id: 'bnc-hil-02', roomId: 'room-hil', benchTypeId: 'hil_rig', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 6 }, purchaseCost: 38000, hoursUsed: 55 },

      // Software-in-the-Loop Laboratory (1/2 slots used)
      { id: 'bnc-sil-01', roomId: 'room-sil', benchTypeId: 'sil_workstation', tier: 1, status: 'idle', currentExecutionId: null, purchaseDate: { day: 7 }, purchaseCost: 16000, hoursUsed: 30 },

      // Satellite Integration Laboratory (2/2 slots used, both running)
      { id: 'bnc-sit-01', roomId: 'room-sit', benchTypeId: 'integration_stand', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 2 }, purchaseCost: 42000, hoursUsed: 88 },
      { id: 'bnc-sit-02', roomId: 'room-sit', benchTypeId: 'integration_stand', tier: 1, status: 'running', currentExecutionId: null, purchaseDate: { day: 8 }, purchaseCost: 42000, hoursUsed: 33 },
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
      },
    ],
    executions: [
      {
        id: 'exec-0231',
        testRequestId: 'tr-0231',
        benchId: 'bnc-ipl-02',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(13, 22, 0),
        phaseDurationHours: 18,
        result: null,
      },
      {
        id: 'exec-0229',
        testRequestId: 'tr-0229',
        benchId: 'bnc-ipl-01',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(14, 8, 54),
        phaseDurationHours: 4,
        result: null,
      },
      {
        id: 'exec-0301',
        testRequestId: 'tr-0301',
        benchId: 'bnc-fcpl-01',
        phase: 'running',
        phaseStartedAtSimMinutes: dayHourMinuteToTotalMinutes(14, 6, 10),
        phaseDurationHours: 10,
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
