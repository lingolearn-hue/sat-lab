import { describe, it, expect } from 'vitest';
import { getSchedulingAction } from './SchedulingPage.jsx';
import { createInitialState } from '../../data/seed.js';
import { MIN_TIER_FOR_ENDURANCE } from '../../data/catalog.js';

// getSchedulingAction is the single source of truth both the desktop table and the
// mobile card view use to decide what action (if any) to offer for a test request.
// It's a pure function — no DOM needed — so it's tested directly here rather than
// only indirectly through E2E clicks. This exists because a real bug shipped once:
// the reducer's endurance tier-gating was added without updating this function to
// match, so the UI kept offering a "Schedule" button the reducer would silently
// refuse. These tests lock in that the two stay in sync.

function freshState() {
  return createInitialState();
}

describe('getSchedulingAction', () => {
  it('returns "approve" for a submitted request', () => {
    const state = freshState();
    const tr = state.testRequests.find((t) => t.status === 'submitted');
    const action = getSchedulingAction(state, tr, null, null, []);
    expect(action.kind).toBe('approve');
  });

  it('returns "blocked: No bench free" when nothing is idle', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'approved', procedure: 'efficiency_mapping' };
    const busyBenches = [{ id: 'b1', status: 'running', tier: 1 }];
    const action = getSchedulingAction(state, tr, null, null, busyBenches);
    expect(action).toEqual({ kind: 'blocked', reason: 'No bench free' });
  });

  it('returns "schedule" for a performance-category procedure on an idle tier-1 bench', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'approved', procedure: 'efficiency_mapping' };
    const benches = [{ id: 'bnc-ipl-03', status: 'idle', tier: 1, roomId: 'room-ipl' }];
    const action = getSchedulingAction(state, tr, null, null, benches);
    expect(action.kind).toBe('schedule');
    expect(action.benchId).toBe('bnc-ipl-03');
  });

  it('returns a distinct "Needs Tier N+ bench" message for an endurance procedure on an idle but under-tier bench (regression: this used to say "schedule" or the wrong message)', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'approved', procedure: 'lifetime' };
    const benches = [{ id: 'bnc-ipl-03', status: 'idle', tier: 1, roomId: 'room-ipl' }];
    const action = getSchedulingAction(state, tr, null, null, benches);
    expect(action.kind).toBe('blocked');
    expect(action.reason).toBe(`Needs Tier ${MIN_TIER_FOR_ENDURANCE}+ bench`);
  });

  it('returns "schedule" for an endurance procedure once the bench meets MIN_TIER_FOR_ENDURANCE', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'approved', procedure: 'lifetime' };
    const benches = [{ id: 'bnc-ipl-03', status: 'idle', tier: MIN_TIER_FOR_ENDURANCE, roomId: 'room-ipl' }];
    const action = getSchedulingAction(state, tr, null, null, benches);
    expect(action.kind).toBe('schedule');
  });

  it('prefers a tier-1 "No bench free" message over the tier-gating message when literally nothing is idle', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'approved', procedure: 'lifetime' };
    const benches = [{ id: 'bnc-ipl-03', status: 'running', tier: 1, roomId: 'room-ipl' }];
    const action = getSchedulingAction(state, tr, null, null, benches);
    expect(action).toEqual({ kind: 'blocked', reason: 'No bench free' });
  });

  it('returns "advance" with the correct label for each due phase', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'scheduled' };
    const scheduledExec = { id: 'e1', phase: 'scheduled' };
    expect(getSchedulingAction(state, tr, scheduledExec, { isDue: true }, []).label).toBe('Start Test');

    const runningExec = { id: 'e2', phase: 'running' };
    expect(getSchedulingAction(state, { ...tr, status: 'running' }, runningExec, { isDue: true }, []).label).toBe('Move to Review');

    const reviewExec = { id: 'e3', phase: 'review' };
    expect(getSchedulingAction(state, { ...tr, status: 'review' }, reviewExec, { isDue: true }, []).label).toBe('Complete');
  });

  it('returns "waiting" while a phase is in progress (not yet due)', () => {
    const state = freshState();
    const tr = { ...state.testRequests[0], status: 'running' };
    const exec = { id: 'e1', phase: 'running' };
    const action = getSchedulingAction(state, tr, exec, { isDue: false }, []);
    expect(action.kind).toBe('waiting');
  });
});
