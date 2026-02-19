// ============================================================
// Farm System - Planting, Growth, Harvesting
// ============================================================

import type { GameState, CropType, MaterialKey } from '../types';
import { CROP_DATA } from '../constants';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -----------------------------------------------------------------
// Plant a crop
// -----------------------------------------------------------------

export function canPlantCrop(state: GameState, plotIndex: number, crop: CropType): boolean {
  const farm = state.farm;
  if (plotIndex < 0 || plotIndex >= farm.maxPlots) return false;
  if (plotIndex >= farm.plots.length) return false;

  const plot = farm.plots[plotIndex];
  if (plot.crop !== null) return false; // plot occupied

  const cropInfo = CROP_DATA[crop];
  if (!cropInfo) return false;

  // Check if player has seeds
  const seedKey = cropInfo.seedKey;
  return (state.inventory.materials[seedKey] ?? 0) >= 1;
}

export function plantCrop(state: GameState, plotIndex: number, crop: CropType): GameState {
  if (!canPlantCrop(state, plotIndex, crop)) return state;

  const newState = structuredClone(state);
  const cropInfo = CROP_DATA[crop];

  // Consume seed
  newState.inventory.materials[cropInfo.seedKey] -= 1;

  // Plant
  newState.farm.plots[plotIndex] = {
    crop,
    plantedAt: Date.now(),
    growthTime: cropInfo.growthTimeSeconds,
    ready: false,
  };

  return newState;
}

// -----------------------------------------------------------------
// Check farm growth (called during tick)
// -----------------------------------------------------------------

export function processFarmTick(state: GameState): GameState {
  let changed = false;
  const now = Date.now();

  for (const plot of state.farm.plots) {
    if (plot.crop && plot.plantedAt && !plot.ready) {
      const elapsed = (now - plot.plantedAt) / 1000; // seconds
      if (elapsed >= plot.growthTime) {
        plot.ready = true;
        changed = true;
      }
    }
  }

  return state; // mutated in place (called on already-cloned state)
}

// -----------------------------------------------------------------
// Harvest a crop
// -----------------------------------------------------------------

export function canHarvestCrop(state: GameState, plotIndex: number): boolean {
  const farm = state.farm;
  if (plotIndex < 0 || plotIndex >= farm.plots.length) return false;
  const plot = farm.plots[plotIndex];
  return plot.crop !== null && plot.ready;
}

export function harvestCrop(state: GameState, plotIndex: number): GameState {
  if (!canHarvestCrop(state, plotIndex)) return state;

  const newState = structuredClone(state);
  const plot = newState.farm.plots[plotIndex];
  const crop = plot.crop!;
  const cropInfo = CROP_DATA[crop];

  // Yield produce
  const yield_ = randInt(cropInfo.yieldMin, cropInfo.yieldMax);
  newState.inventory.materials[cropInfo.produceKey] =
    (newState.inventory.materials[cropInfo.produceKey] ?? 0) + yield_;

  // 50% chance to get a bonus seed back
  if (Math.random() < 0.5) {
    newState.inventory.materials[cropInfo.seedKey] =
      (newState.inventory.materials[cropInfo.seedKey] ?? 0) + 1;
  }

  // Clear the plot
  newState.farm.plots[plotIndex] = {
    crop: null,
    plantedAt: null,
    growthTime: 0,
    ready: false,
  };

  return newState;
}

// -----------------------------------------------------------------
// Get crop growth progress (0-100%)
// -----------------------------------------------------------------

export function getCropProgress(plot: { crop: CropType | null; plantedAt: number | null; growthTime: number; ready: boolean }): number {
  if (!plot.crop || !plot.plantedAt) return 0;
  if (plot.ready) return 100;
  const elapsed = (Date.now() - plot.plantedAt) / 1000;
  return Math.min(100, Math.floor((elapsed / plot.growthTime) * 100));
}
