// ============================================================
// Crafting System - Equipment, Food, Potions, Enhancement,
//                   Refining, Maintenance, Smelting
// ============================================================

import type {
  GameState,
  Equipment,
  Food,
  Potion,
  MaterialKey,
} from '../types';
import type { EquipmentSlot, EquipmentGrade } from '../types';
import {
  EQUIPMENT_RECIPES,
  FOOD_RECIPES,
  POTION_RECIPES,
  ENHANCEMENT_TABLE,
  GRADE_MULTIPLIERS,
  MAINTENANCE_RECIPES,
  DURABILITY_MAX,
  DURABILITY_PENALTY_THRESHOLD,
  REFINING_COST,
  REFINING_GRADE_RATES,
  REFINING_SLOT_MULTIPLIERS,
  EQUIPMENT_NAMES,
  GRADE_PREFIX,
  REFINING_LEVEL_TABLE,
  getSmeltingStones,
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
    level: 1,
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
// Smelt Equipment (용해: break down equipment into refining stones)
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

  // Get refining stones based on grade + level
  const stones = getSmeltingStones(eq.grade, eq.level ?? 1);
  newState.inventory.materials.refiningStone += stones;

  // Return half of enhancement stones used
  if (eq.enhanceLevel > 0) {
    const stonesBack = Math.floor(eq.enhanceLevel / 2);
    if (stonesBack > 0) {
      newState.inventory.materials.enhancementStones += stonesBack;
    }
  }

  // Remove equipment
  newState.inventory.equipment.splice(eqIndex, 1);
  return newState;
}

// -----------------------------------------------------------------
// Refine Equipment (제련: random equipment generation)
// -----------------------------------------------------------------

export function canRefineEquipment(state: GameState): boolean {
  return state.inventory.materials.refiningStone >= REFINING_COST;
}

export function refineEquipment(state: GameState): { state: GameState; equipment: Equipment } | null {
  if (!canRefineEquipment(state)) return null;

  const newState = structuredClone(state);
  const mom = newState.mom;

  // Consume refining stones
  newState.inventory.materials.refiningStone -= REFINING_COST;

  // Equipment level range
  const minLevel = mom.refiningLevel;
  const maxLevel = Math.min(30, mom.refiningLevel + 5);
  const equipLevel = randInt(minLevel, maxLevel);

  // Grade
  const grade = rollGrade(mom.refiningLevel);

  // Slot
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];
  const slot = slots[Math.floor(Math.random() * slots.length)];

  // Stats
  const baseStats = generateBaseStats(equipLevel, slot, grade);

  // Name
  const name = generateEquipmentName(equipLevel, slot, grade);

  const equipment: Equipment = {
    id: uid(),
    name,
    slot,
    grade,
    baseStats,
    enhanceLevel: 0,
    durability: DURABILITY_MAX,
    maxDurability: DURABILITY_MAX,
    tier: 0,
    level: equipLevel,
  };

  newState.inventory.equipment.push(equipment);

  // Refining exp
  mom.refiningExp += 1;
  while (mom.refiningExp >= mom.refiningMaxExp && mom.refiningLevel < 20) {
    mom.refiningExp -= mom.refiningMaxExp;
    mom.refiningLevel += 1;
    const nextData = REFINING_LEVEL_TABLE.find(r => r.level === mom.refiningLevel);
    if (nextData) mom.refiningMaxExp = nextData.expRequired;
  }

  return { state: newState, equipment };
}

function rollGrade(refiningLevel: number): EquipmentGrade {
  const entry = REFINING_GRADE_RATES.find(
    r => refiningLevel >= r.minLevel && refiningLevel <= r.maxLevel
  ) ?? REFINING_GRADE_RATES[REFINING_GRADE_RATES.length - 1];

  const roll = Math.random();
  let cumulative = 0;
  for (const [grade, rate] of Object.entries(entry.rates) as [EquipmentGrade, number][]) {
    cumulative += rate;
    if (roll < cumulative) return grade;
  }
  return 'common';
}

function generateBaseStats(
  level: number,
  slot: EquipmentSlot,
  grade: EquipmentGrade
): Record<string, number> {
  const slotMult = REFINING_SLOT_MULTIPLIERS[slot];
  const gradeMult = GRADE_MULTIPLIERS[grade];
  const stats: Record<string, number> = {};
  for (const [stat, mult] of Object.entries(slotMult)) {
    if (mult !== undefined) {
      stats[stat] = Math.max(1, Math.floor(level * mult * gradeMult));
    }
  }
  return stats;
}

function generateEquipmentName(
  level: number,
  slot: EquipmentSlot,
  grade: EquipmentGrade
): string {
  const nameList = EQUIPMENT_NAMES[slot];
  const baseName = nameList.find(n => level <= n.maxLevel)?.name ?? nameList[nameList.length - 1].name;
  const prefix = GRADE_PREFIX[grade];
  return `${prefix}${baseName}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
