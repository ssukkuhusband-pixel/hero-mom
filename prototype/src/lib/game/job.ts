// ============================================================
// Mom's Part-time Job System
// ============================================================

import type { GameState } from '../types';
import { getJobLevelData } from '../constants';

export function canDoJob(state: GameState): boolean {
  const now = Date.now();
  const jobData = getJobLevelData(state.mom.jobLevel);
  const cooldownMs = jobData.cooldownSeconds * 1000;
  return now >= state.mom.lastJobAt + cooldownMs;
}

export function getJobCooldownRemaining(state: GameState): number {
  const now = Date.now();
  const jobData = getJobLevelData(state.mom.jobLevel);
  const cooldownMs = jobData.cooldownSeconds * 1000;
  const readyAt = state.mom.lastJobAt + cooldownMs;
  return Math.max(0, readyAt - now);
}

export function doJob(state: GameState): GameState {
  if (!canDoJob(state)) return state;

  const newState = structuredClone(state);
  const mom = newState.mom;
  const jobData = getJobLevelData(mom.jobLevel);

  newState.inventory.materials.gold += jobData.goldReward;
  mom.lastJobAt = Date.now();
  mom.jobExp += 1;

  while (mom.jobExp >= mom.jobMaxExp && mom.jobLevel < 15) {
    mom.jobExp -= mom.jobMaxExp;
    mom.jobLevel += 1;
    const nextData = getJobLevelData(mom.jobLevel);
    mom.jobMaxExp = nextData.expRequired;
  }

  return newState;
}

export function getJobReward(state: GameState): number {
  return getJobLevelData(state.mom.jobLevel).goldReward;
}

export function getJobCooldownDuration(state: GameState): number {
  return getJobLevelData(state.mom.jobLevel).cooldownSeconds;
}
