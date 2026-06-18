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
