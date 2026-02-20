// ============================================================
// Crafting System - Equipment, Food, Potions, Enhancement,
//                   Promotion, Maintenance, Smelting
// ============================================================

import type {
  GameState,
  Equipment,
  Food,
  Potion,
  MaterialKey,
} from '../types';
import {
  EQUIPMENT_RECIPES,
  FOOD_RECIPES,
  POTION_RECIPES,
  ENHANCEMENT_TABLE,
  GRADE_MULTIPLIERS,
  PROMOTION_CHAINS,
  EQUIPMENT_TIER_DATA,
  MAINTENANCE_RECIPES,
  SMELTING_OUTPUT,
  DURABILITY_MAX,
  DURABILITY_PENALTY_THRESHOLD,
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

function addMaterials(
  state: GameState,
  mats: Partial<Record<MaterialKey, number>>
): void {
  for (const [key, amount] of Object.entries(mats)) {
    state.inventory.materials[key as MaterialKey] += amount ?? 0;
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
  if (!hasMaterials(state, recipe.materials)) return false;

  // Prevent duplicate crafting: check if this slot already has equipment anywhere
  const slotHasEquipment =
    state.inventory.equipment.some(e => e.slot === recipe.slot) ||
    state.home.equipmentRack.some(e => e.slot === recipe.slot) ||
    state.son.equipment[recipe.slot] !== null;

  if (slotHasEquipment) return false;

  return true;
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
    grade: 'common',
    baseStats: { ...recipe.baseStats },
    enhanceLevel: 0,
    durability: DURABILITY_MAX,
    maxDurability: DURABILITY_MAX,
    tier: 0,
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
// Calculate final equipment stats (with grade, enhancement, durability)
// -----------------------------------------------------------------

export function calculateEquipmentStats(eq: Equipment): Record<string, number> {
  const gradeMultiplier = GRADE_MULTIPLIERS[eq.grade];
  const enhanceEntry = ENHANCEMENT_TABLE.find(e => e.level === eq.enhanceLevel);
  const enhanceBonus = enhanceEntry ? enhanceEntry.statBonus : 0;

  const result: Record<string, number> = {};
  for (const [stat, baseVal] of Object.entries(eq.baseStats)) {
    if (baseVal !== undefined) {
      let val = Math.floor(baseVal * gradeMultiplier * (1 + enhanceBonus));

      // Durability scaling: 0 → no stats, <30 → proportional reduction
      const dur = eq.durability ?? DURABILITY_MAX;
      if (dur <= 0) {
        val = 0;
      } else if (dur < DURABILITY_PENALTY_THRESHOLD) {
        val = Math.floor(val * (dur / DURABILITY_PENALTY_THRESHOLD));
      }

      result[stat] = val;
    }
  }
  return result;
}

// -----------------------------------------------------------------
// Promote Equipment (승급: e.g., 나무검 → 철검 → 미스릴검)
// -----------------------------------------------------------------

export function canPromoteEquipment(state: GameState, equipmentId: string): boolean {
  const eq = findEquipment(state, equipmentId);
  if (!eq) return false;

  // Match by current equipment's base recipe id (derived from name/tier)
  const currentBaseId = getEquipmentBaseId(eq);
  if (!currentBaseId) return false;

  const promo = PROMOTION_CHAINS.find(c => c.from === currentBaseId);
  if (!promo) return false;

  // Check level requirement
  if (state.son.stats.level < promo.reqLevel) return false;

  // Check materials
  return hasMaterials(state, promo.materials as Partial<Record<MaterialKey, number>>);
}

export function promoteEquipment(state: GameState, equipmentId: string): GameState {
  if (!canPromoteEquipment(state, equipmentId)) return state;

  const newState = structuredClone(state);
  const eq = findEquipment(newState, equipmentId);
  if (!eq) return state;

  const currentBaseId = getEquipmentBaseId(eq);
  if (!currentBaseId) return state;

  const promo = PROMOTION_CHAINS.find(c => c.from === currentBaseId);
  if (!promo) return state;

  const tierData = EQUIPMENT_TIER_DATA[promo.to];
  if (!tierData) return state;

  // Consume materials
  consumeMaterials(newState, promo.materials as Partial<Record<MaterialKey, number>>);

  // In-place transform: preserve enhanceLevel, reset durability
  eq.name = tierData.name;
  eq.baseStats = { ...tierData.baseStats };
  eq.tier = promo.tier;
  eq.durability = DURABILITY_MAX;
  eq.maxDurability = DURABILITY_MAX;

  // Upgrade grade based on tier
  if (promo.tier === 1) eq.grade = 'uncommon';
  if (promo.tier === 2) eq.grade = 'rare';

  return newState;
}

// -----------------------------------------------------------------
// Maintain Equipment (정비: durability recovery)
// -----------------------------------------------------------------

export function canMaintainEquipment(state: GameState, equipmentId: string): boolean {
  const eq = findEquipment(state, equipmentId);
  if (!eq) return false;

  // No need to maintain if already at max
  if (eq.durability >= (eq.maxDurability ?? DURABILITY_MAX)) return false;

  const recipe = MAINTENANCE_RECIPES[eq.slot];
  if (!recipe) return false;

  return hasMaterials(state, recipe.materials);
}

export function maintainEquipment(state: GameState, equipmentId: string): GameState {
  if (!canMaintainEquipment(state, equipmentId)) return state;

  const newState = structuredClone(state);
  const eq = findEquipment(newState, equipmentId);
  if (!eq) return state;

  const recipe = MAINTENANCE_RECIPES[eq.slot];

  // Consume materials
  consumeMaterials(newState, recipe.materials);

  // Restore durability (cap at max)
  const maxDur = eq.maxDurability ?? DURABILITY_MAX;
  eq.durability = Math.min(maxDur, eq.durability + recipe.restore);

  return newState;
}

// -----------------------------------------------------------------
// Smelt Equipment (용해: break down equipment into materials)
// -----------------------------------------------------------------

export function canSmeltEquipment(state: GameState, equipmentId: string): boolean {
  if (!state.unlocks.systems.smelting) return false;

  // Equipment must be in inventory (not equipped or on rack)
  const eq = state.inventory.equipment.find(e => e.id === equipmentId);
  if (!eq) return false;

  return true;
}

export function smeltEquipment(state: GameState, equipmentId: string): GameState {
  if (!canSmeltEquipment(state, equipmentId)) return state;

  const newState = structuredClone(state);
  const eqIndex = newState.inventory.equipment.findIndex(e => e.id === equipmentId);
  if (eqIndex === -1) return state;

  const eq = newState.inventory.equipment[eqIndex];

  // Get base materials from grade
  const baseMats = SMELTING_OUTPUT[eq.grade];
  if (baseMats) {
    addMaterials(newState, baseMats);
  }

  // Return half of enhancement stones used
  if (eq.enhanceLevel > 0) {
    const stonesBack = Math.floor(eq.enhanceLevel / 2);
    if (stonesBack > 0) {
      newState.inventory.materials.enhancementStones += stonesBack;
    }
  }

  // Remove equipment from inventory
  newState.inventory.equipment.splice(eqIndex, 1);

  return newState;
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/** Find equipment anywhere: inventory, equipment rack, or equipped on son */
export function findEquipment(state: GameState, equipmentId: string): Equipment | undefined {
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

/** Get all equipment from everywhere */
export function getAllEquipment(state: GameState): Equipment[] {
  const all: Equipment[] = [...state.inventory.equipment, ...state.home.equipmentRack];
  const { weapon, armor, accessory } = state.son.equipment;
  if (weapon) all.push(weapon);
  if (armor) all.push(armor);
  if (accessory) all.push(accessory);
  return all;
}

/**
 * Derive the base recipe ID from an equipment's current state.
 * Maps equipment name/tier back to the EQUIPMENT_TIER_DATA key.
 */
function getEquipmentBaseId(eq: Equipment): string | null {
  // Search EQUIPMENT_TIER_DATA for a matching name
  for (const [id, data] of Object.entries(EQUIPMENT_TIER_DATA)) {
    if (data.name === eq.name) return id;
  }
  // Fallback: check EQUIPMENT_RECIPES for base tier items
  for (const recipe of EQUIPMENT_RECIPES) {
    if (recipe.name === eq.name) return recipe.id;
  }
  return null;
}

/** Get the promotion chain entry for an equipment, if any */
export function getPromotionForEquipment(eq: Equipment): typeof PROMOTION_CHAINS[number] | null {
  const baseId = getEquipmentBaseId(eq);
  if (!baseId) return null;
  return PROMOTION_CHAINS.find(c => c.from === baseId) ?? null;
}
