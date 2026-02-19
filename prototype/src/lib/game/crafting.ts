// ============================================================
// Crafting System - Equipment, Food, Potions, Enhancement
// ============================================================

import type {
  GameState,
  Equipment,
  Food,
  Potion,
  MaterialKey,
  EquipmentGrade,
} from '../types';
import {
  EQUIPMENT_RECIPES,
  FOOD_RECIPES,
  POTION_RECIPES,
  ENHANCEMENT_TABLE,
  GRADE_MULTIPLIERS,
  GACHA_COST,
  GACHA_RATES,
} from '../constants';

/** Generate a unique ID */
function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// -----------------------------------------------------------------
// Material helpers
// -----------------------------------------------------------------

function hasMaterials(
  state: GameState,
  required: Partial<Record<MaterialKey, number>>
): boolean {
  for (const [key, amount] of Object.entries(required)) {
    if ((state.inventory.materials[key as MaterialKey] ?? 0) < (amount ?? 0)) {
      return false;
    }
  }
  return true;
}

function consumeMaterials(
  state: GameState,
  required: Partial<Record<MaterialKey, number>>
): void {
  for (const [key, amount] of Object.entries(required)) {
    state.inventory.materials[key as MaterialKey] -= amount ?? 0;
  }
}

// -----------------------------------------------------------------
// Recipe availability check
// -----------------------------------------------------------------

export function isRecipeUnlocked(state: GameState, unlockLevel: number): boolean {
  return state.son.stats.level >= unlockLevel || unlockLevel === 0;
}

export function canCraftEquipment(state: GameState, recipeId: string): boolean {
  const recipe = EQUIPMENT_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  if (!isRecipeUnlocked(state, recipe.unlockLevel)) return false;
  return hasMaterials(state, recipe.materials);
}

export function canCookFood(state: GameState, recipeId: string): boolean {
  const recipe = FOOD_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  if (!isRecipeUnlocked(state, recipe.unlockLevel)) return false;
  return hasMaterials(state, recipe.materials);
}

export function canBrewPotion(state: GameState, recipeId: string): boolean {
  const recipe = POTION_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  if (!state.unlocks.systems.alchemy) return false;
  if (!isRecipeUnlocked(state, recipe.unlockLevel)) return false;
  return hasMaterials(state, recipe.materials);
}

// -----------------------------------------------------------------
// Craft Equipment
// -----------------------------------------------------------------

export function craftEquipment(state: GameState, recipeId: string): GameState {
  const recipe = EQUIPMENT_RECIPES.find(r => r.id === recipeId);
  if (!recipe || !canCraftEquipment(state, recipeId)) return state;

  const newState = structuredClone(state);
  consumeMaterials(newState, recipe.materials);

  const equipment: Equipment = {
    id: uid(),
    name: recipe.name,
    slot: recipe.slot,
    grade: 'common', // crafted equipment is always common
    baseStats: { ...recipe.baseStats },
    enhanceLevel: 0,
  };

  newState.inventory.equipment.push(equipment);
  return newState;
}

// -----------------------------------------------------------------
// Cook Food
// -----------------------------------------------------------------

export function cookFood(state: GameState, recipeId: string): GameState {
  const recipe = FOOD_RECIPES.find(r => r.id === recipeId);
  if (!recipe || !canCookFood(state, recipeId)) return state;

  const newState = structuredClone(state);
  consumeMaterials(newState, recipe.materials);

  const food: Food = {
    id: uid(),
    name: recipe.name,
    hungerRestore: recipe.hungerRestore,
    hpRestore: recipe.hpRestore,
    tempBuff: recipe.tempBuff ? { ...recipe.tempBuff } : undefined,
  };

  newState.inventory.food.push(food);
  return newState;
}

// -----------------------------------------------------------------
// Brew Potion
// -----------------------------------------------------------------

export function brewPotion(state: GameState, recipeId: string): GameState {
  const recipe = POTION_RECIPES.find(r => r.id === recipeId);
  if (!recipe || !canBrewPotion(state, recipeId)) return state;

  const newState = structuredClone(state);
  consumeMaterials(newState, recipe.materials);

  const potion: Potion = {
    id: uid(),
    name: recipe.name,
    effect: recipe.effect,
    stat: recipe.stat,
    value: recipe.value,
  };

  newState.inventory.potions.push(potion);
  return newState;
}

// -----------------------------------------------------------------
// Enhance Equipment
// -----------------------------------------------------------------

export function canEnhance(state: GameState, equipmentId: string): boolean {
  if (!state.unlocks.systems.enhancement) return false;
  const eq = findEquipment(state, equipmentId);
  if (!eq || eq.enhanceLevel >= 5) return false;
  const nextLevel = ENHANCEMENT_TABLE.find(e => e.level === eq.enhanceLevel + 1);
  if (!nextLevel) return false;
  return (
    state.inventory.materials.enhancementStones >= nextLevel.stonesRequired &&
    state.inventory.materials.gold >= nextLevel.goldCost
  );
}

export function enhanceEquipment(
  state: GameState,
  equipmentId: string
): { state: GameState; success: boolean } {
  if (!canEnhance(state, equipmentId)) return { state, success: false };

  const newState = structuredClone(state);
  const eq = findEquipment(newState, equipmentId);
  if (!eq) return { state, success: false };

  const nextLevel = ENHANCEMENT_TABLE.find(e => e.level === eq.enhanceLevel + 1)!;

  // Consume materials regardless of success
  newState.inventory.materials.enhancementStones -= nextLevel.stonesRequired;
  newState.inventory.materials.gold -= nextLevel.goldCost;

  // Roll success
  const success = Math.random() < nextLevel.successRate;
  if (success) {
    eq.enhanceLevel += 1;
  }

  return { state: newState, success };
}

// -----------------------------------------------------------------
// Calculate final equipment stats (with grade and enhancement)
// -----------------------------------------------------------------

export function calculateEquipmentStats(eq: Equipment): Record<string, number> {
  const gradeMultiplier = GRADE_MULTIPLIERS[eq.grade];
  const enhanceEntry = ENHANCEMENT_TABLE.find(e => e.level === eq.enhanceLevel);
  const enhanceBonus = enhanceEntry ? enhanceEntry.statBonus : 0;

  const result: Record<string, number> = {};
  for (const [stat, baseVal] of Object.entries(eq.baseStats)) {
    if (baseVal !== undefined) {
      result[stat] = Math.floor(baseVal * gradeMultiplier * (1 + enhanceBonus));
    }
  }
  return result;
}

// -----------------------------------------------------------------
// Gacha (random grade equipment)
// -----------------------------------------------------------------

export function canGacha(state: GameState): boolean {
  if (!state.unlocks.systems.gacha) return false;
  return hasMaterials(state, GACHA_COST as Partial<Record<MaterialKey, number>>);
}

export function performGacha(state: GameState): GameState {
  if (!canGacha(state)) return state;

  const newState = structuredClone(state);
  consumeMaterials(newState, GACHA_COST as Partial<Record<MaterialKey, number>>);

  // Determine grade
  const roll = Math.random();
  let cumulative = 0;
  let grade: EquipmentGrade = 'common';
  for (const entry of GACHA_RATES) {
    cumulative += entry.chance;
    if (roll < cumulative) {
      grade = entry.grade;
      break;
    }
  }

  // Pick a random equipment recipe as base
  const recipe = EQUIPMENT_RECIPES[Math.floor(Math.random() * EQUIPMENT_RECIPES.length)];

  const equipment: Equipment = {
    id: uid(),
    name: recipe.name,
    slot: recipe.slot,
    grade,
    baseStats: { ...recipe.baseStats },
    enhanceLevel: 0,
  };

  newState.inventory.equipment.push(equipment);
  return newState;
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function findEquipment(state: GameState, equipmentId: string): Equipment | undefined {
  // Check inventory
  let eq = state.inventory.equipment.find(e => e.id === equipmentId);
  if (eq) return eq;
  // Check equipment rack
  eq = state.home.equipmentRack.find(e => e.id === equipmentId);
  if (eq) return eq;
  // Check equipped on son
  const { weapon, armor, accessory } = state.son.equipment;
  if (weapon?.id === equipmentId) return weapon;
  if (armor?.id === equipmentId) return armor;
  if (accessory?.id === equipmentId) return accessory;
  return undefined;
}
