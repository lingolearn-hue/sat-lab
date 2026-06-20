import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatCalendarWeek,
  getMaintenanceState,
  getCalibrationState,
  getBenchNeedsAttention,
  getChannelCount,
  getChannelStatuses,
  groupChannels,
  getPersonnelLoad,
  findAvailablePersonnel,
  getQualificationForRoom,
  CHANNEL_GROUP_SIZE,
} from './selectors.js';
import { createInitialState } from './seed.js';
import { BENCH_TYPES } from './catalog.js';

describe('formatMoney', () => {
  it('formats positive amounts with a dollar sign and thousands separators', () => {
    expect(formatMoney(482300)).toBe('$482,300');
  });

  it('formats negative amounts with a leading minus before the dollar sign', () => {
    expect(formatMoney(-3400)).toBe('-$3,400');
  });

  it('rounds fractional amounts to the nearest whole dollar', () => {
    expect(formatMoney(1234.6)).toBe('$1,235');
    expect(formatMoney(1234.4)).toBe('$1,234');
  });

  it('formats zero without a sign', () => {
    expect(formatMoney(0)).toBe('$0');
  });
});

describe('getMaintenanceState / getCalibrationState', () => {
  it('reports ok when hours are below the due threshold', () => {
    expect(getMaintenanceState({ hoursSinceLastMaintenance: 100 })).toBe('ok');
    expect(getCalibrationState({ hoursSinceLastCalibration: 100 })).toBe('ok');
  });

  it('reports due once past the due threshold but under overdue', () => {
    expect(getMaintenanceState({ hoursSinceLastMaintenance: 260 })).toBe('due');
  });

  it('reports overdue once past the overdue threshold', () => {
    expect(getMaintenanceState({ hoursSinceLastMaintenance: 410 })).toBe('overdue');
  });

  it('treats a missing hours field as zero (fully serviced), not undefined/NaN', () => {
    expect(getMaintenanceState({})).toBe('ok');
    expect(getCalibrationState({})).toBe('ok');
  });

  it('getBenchNeedsAttention is true for out_of_service even if hours look fine', () => {
    const bench = { status: 'out_of_service', hoursSinceLastMaintenance: 0, hoursSinceLastCalibration: 0 };
    expect(getBenchNeedsAttention(bench)).toBe(true);
  });

  it('getBenchNeedsAttention is false for a healthy, in-service bench', () => {
    const bench = { status: 'running', hoursSinceLastMaintenance: 10, hoursSinceLastCalibration: 10 };
    expect(getBenchNeedsAttention(bench)).toBe(false);
  });
});

describe('channel map (fuel cell visualization)', () => {
  const fuelCellType = BENCH_TYPES.fuel_cell_stack;

  it('getChannelCount returns 96 at tier 1 and 192 at tier 2, per the catalog', () => {
    expect(getChannelCount({ tier: 1 }, fuelCellType)).toBe(96);
    expect(getChannelCount({ tier: 2 }, fuelCellType)).toBe(192);
  });

  it('getChannelCount returns 0 for a bench type with no channelsByTier (propulsion benches)', () => {
    expect(getChannelCount({ tier: 1 }, BENCH_TYPES.component)).toBe(0);
  });

  it('a running, healthy bench is all active channels', () => {
    const bench = { tier: 1, status: 'running', hoursSinceLastMaintenance: 10 };
    const statuses = getChannelStatuses(bench, fuelCellType);
    expect(statuses.length).toBe(96);
    expect(statuses.every((s) => s === 'active')).toBe(true);
  });

  it('an out_of_service bench is all fault channels', () => {
    const bench = { tier: 1, status: 'out_of_service', hoursSinceLastMaintenance: 500 };
    const statuses = getChannelStatuses(bench, fuelCellType);
    expect(statuses.every((s) => s === 'fault')).toBe(true);
  });

  it('an idle bench is mostly offline with a sparse scattering of standby', () => {
    const bench = { tier: 1, status: 'idle', hoursSinceLastMaintenance: 10 };
    const statuses = getChannelStatuses(bench, fuelCellType);
    expect(statuses.some((s) => s === 'standby')).toBe(true);
    expect(statuses.some((s) => s === 'offline')).toBe(true);
    expect(statuses.every((s) => s === 'standby' || s === 'offline')).toBe(true);
  });

  it('a running bench with maintenance due shows a real degraded pocket, not all-active', () => {
    const bench = { tier: 1, status: 'running', hoursSinceLastMaintenance: 260 };
    const statuses = getChannelStatuses(bench, fuelCellType);
    expect(statuses.some((s) => s === 'fault' || s === 'standby')).toBe(true);
    expect(statuses.some((s) => s === 'active')).toBe(true);
  });

  it('the same bench state always produces the same channel array (deterministic, not random)', () => {
    const bench = { tier: 1, status: 'running', hoursSinceLastMaintenance: 260 };
    const a = getChannelStatuses(bench, fuelCellType);
    const b = getChannelStatuses(bench, fuelCellType);
    expect(a).toEqual(b);
  });

  it('groupChannels splits into groups of exactly CHANNEL_GROUP_SIZE, last group may be shorter', () => {
    const statuses = Array.from({ length: 14 }, () => 'active');
    const groups = groupChannels(statuses);
    expect(groups.length).toBe(Math.ceil(14 / CHANNEL_GROUP_SIZE));
    expect(groups[0].length).toBe(CHANNEL_GROUP_SIZE);
    expect(groups[groups.length - 1].length).toBe(14 % CHANNEL_GROUP_SIZE || CHANNEL_GROUP_SIZE);
  });
});

describe('personnel capacity', () => {
  it('getPersonnelLoad counts only non-completed executions assigned to that person', () => {
    const state = createInitialState();
    state.executions.push(
      { id: 'x1', testRequestId: 't1', benchId: 'b1', assignedPersonnelId: 'per-001', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 1, result: null },
      { id: 'x2', testRequestId: 't2', benchId: 'b2', assignedPersonnelId: 'per-001', phase: 'completed', phaseStartedAtSimMinutes: 0, phaseDurationHours: 1, result: null }
    );
    expect(getPersonnelLoad(state, 'per-001')).toBe(3);
  });

  it('findAvailablePersonnel returns null when every qualified person is at capacity', () => {
    const state = createInitialState();
    state.executions.push(
      { id: 'x1', testRequestId: 't1', benchId: 'b1', assignedPersonnelId: 'per-002', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 1, result: null },
      { id: 'x2', testRequestId: 't2', benchId: 'b2', assignedPersonnelId: 'per-002', phase: 'running', phaseStartedAtSimMinutes: 0, phaseDurationHours: 1, result: null }
    );
    expect(findAvailablePersonnel(state, 'ion_propulsion')).toBeNull();
  });

  it('findAvailablePersonnel returns a person who still has spare capacity', () => {
    const state = createInitialState();
    const person = findAvailablePersonnel(state, 'ion_propulsion');
    expect(person).not.toBeNull();
    expect(person.id).toBe('per-002');
  });

  it('getQualificationForRoom returns null for a room with no qualification domain (view-only rooms)', () => {
    expect(getQualificationForRoom('room-sal')).toBeNull();
  });

  it('getQualificationForRoom returns the correct domain for an interactive room', () => {
    const domain = getQualificationForRoom('room-ctl');
    expect(domain).not.toBeNull();
    expect(domain.id).toBe('chemical_thruster');
    expect(domain.capacityPerPerson).toBe(4);
  });
});

describe('formatCalendarWeek', () => {
  it('day 1 is CW1.1 (week and day both start at 1, not 0)', () => {
    expect(formatCalendarWeek(1)).toBe('CW1.1');
  });

  it('day 23 is CW4.2, matching the example given when this format was specified', () => {
    expect(formatCalendarWeek(23)).toBe('CW4.2');
  });

  it('day 7 is the last day of week 1, day 8 rolls over to week 2 day 1', () => {
    expect(formatCalendarWeek(7)).toBe('CW1.7');
    expect(formatCalendarWeek(8)).toBe('CW2.1');
  });

  it('day-of-week never exceeds 7 or drops to 0', () => {
    for (let day = 1; day <= 70; day++) {
      const [, dayOfWeek] = formatCalendarWeek(day).split('.');
      expect(Number(dayOfWeek)).toBeGreaterThanOrEqual(1);
      expect(Number(dayOfWeek)).toBeLessThanOrEqual(7);
    }
  });

  it('clamps below day 1 rather than producing a negative or zero week', () => {
    expect(formatCalendarWeek(0)).toBe('CW1.1');
    expect(formatCalendarWeek(-5)).toBe('CW1.1');
  });
});
