// ============================================================
// Farm System - Universal Seed, Random Output, Farm Level
// ============================================================

import type { GameState, CropType } from '../types';
import { CROP_DATA, UNIVERSAL_GROWTH_TIME, FARM_LEVEL_TABLE, getFarmLevelData } from '../constants';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollRandomCrop(farmLevel: number): CropType {
  const levelData = getFarmLevelData(farmLevel);
  const rates = levelData.cropRates;
  const roll = Math.random();
  let cumulative = 0;
  for (const [crop, rate] of Object.entries(rates) as [CropType, number][]) {
    cumulative += rate;
    if (roll < cumulative) return crop;
  }
  return 'wheat';
}

export function canPlantCrop(state: GameState, plotIndex: number): boolean {
  const farm = state.farm;
  if (plotIndex < 0 || plotIndex >= farm.maxPlots) return false;
  if (plotIndex >= farm.plots.length) return false;
  const plot = farm.plots[plotIndex];
  if (plot.crop !== null) return false;
  return (state.inventory.materials.seed ?? 0) >= 1;
}

export function plantCrop(state: GameState, plotIndex: number): GameState {
  if (!canPlantCrop(state, plotIndex)) return state;
  const newState = structuredClone(state);
  newState.inventory.materials.seed -= 1;
  const crop = rollRandomCrop(newState.farm.farmLevel);
  newState.farm.plots[plotIndex] = {
    crop,
    plantedAt: Date.now(),
    growthTime: UNIVERSAL_GROWTH_TIME,
    ready: false,
  };
  return newState;
}

export function processFarmTick(state: GameState): void {
  const now = Date.now();
  for (const plot of state.farm.plots) {
    if (plot.crop && plot.plantedAt && !plot.ready) {
      const elapsed = (now - plot.plantedAt) / 1000;
      if (elapsed >= plot.growthTime) {
        plot.ready = true;
      }
    }
  }
}

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

  const yield_ = randInt(cropInfo.yieldMin, cropInfo.yieldMax);
  newState.inventory.materials[cropInfo.produceKey] =
    (newState.inventory.materials[cropInfo.produceKey] ?? 0) + yield_;

  // 30% chance bonus seed
  if (Math.random() < 0.3) {
    newState.inventory.materials.seed = (newState.inventory.materials.seed ?? 0) + 1;
  }

  // Farm exp
  const farm = newState.farm;
  farm.farmExp += 1;
  while (farm.farmExp >= farm.farmMaxExp && farm.farmLevel < 10) {
    farm.farmExp -= farm.farmMaxExp;
    farm.farmLevel += 1;
    const nextData = FARM_LEVEL_TABLE.find(f => f.level === farm.farmLevel);
    if (nextData) farm.farmMaxExp = nextData.expRequired;
  }

  // Clear plot
  newState.farm.plots[plotIndex] = { crop: null, plantedAt: null, growthTime: 0, ready: false };
  return newState;
}

export function getCropProgress(plot: { crop: CropType | null; plantedAt: number | null; growthTime: number; ready: boolean }): number {
  if (!plot.crop || !plot.plantedAt) return 0;
  if (plot.ready) return 100;
  const elapsed = (Date.now() - plot.plantedAt) / 1000;
  return Math.min(100, Math.floor((elapsed / plot.growthTime) * 100));
}
