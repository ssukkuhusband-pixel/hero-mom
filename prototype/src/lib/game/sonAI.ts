// ============================================================
// Son AI Behavior System
// Decision tree evaluated every 2-second tick
// ============================================================

import type {
  GameState,
  SonState,
  SonAction,
  Food,
  Potion,
  Equipment,
  EquipmentSlot,
  TempBuff,
} from '../types';
import { SonAction as Action } from '../types';
import {
  DEPARTURE_HUNGER_THRESHOLD,
  DEPARTURE_HP_THRESHOLD,
  DEPARTURE_SKIP_CHANCE,
  SLEEP_HP_PER_TICK,
  REST_HP_PER_TICK,
  TRAINING_EXP_MIN,
  TRAINING_EXP_MAX,
  ACTION_DURATIONS,
  HUNGER_DECAY_PER_TICK,
  SON_DIALOGUES,
} from '../constants';
import { evaluateDialogueTriggers } from './dialogue';
import { checkQuestDeadlines } from './quest';
import { rollRandomCrop } from './farm';
import { UNIVERSAL_GROWTH_TIME } from '../constants';

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random integer between min and max (inclusive) */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -----------------------------------------------------------------
// Core tick: process hunger decay and decide next action
// -----------------------------------------------------------------

export function processSonTick(state: GameState): GameState {
  // Only process when son is home
  if (!state.son.isHome) return state;

  let newState = structuredClone(state);
  const son = newState.son;

  // Decay hunger
  son.stats.hunger = Math.max(0, son.stats.hunger - HUNGER_DECAY_PER_TICK);

  // Starvation damage: if hunger is 0, HP decreases
  if (son.stats.hunger <= 0) {
    son.stats.hp = Math.max(1, son.stats.hp - 1); // ~-0.5/s via 2s tick
    son.dialogue = pick(SON_DIALOGUES.eatingNoFood);
  }

  // If son is currently performing an action, tick it down
  if (son.actionTimer > 0) {
    // Apply per-tick effects for continuous actions (healing per tick)
    // Level bonus: +1 HP per 5 levels to keep recovery time manageable at higher levels
    const levelBonus = Math.floor(son.stats.level / 5);
    if (son.currentAction === Action.SLEEPING) {
      son.stats.hp = Math.min(son.stats.maxHp, son.stats.hp + SLEEP_HP_PER_TICK + levelBonus);
    } else if (son.currentAction === Action.RESTING) {
      son.stats.hp = Math.min(son.stats.maxHp, son.stats.hp + REST_HP_PER_TICK + levelBonus);
    }

    son.actionTimer = Math.max(0, son.actionTimer - 2); // 2s tick
    if (son.actionTimer <= 0) {
      // DEPARTING is handled by processTick in gameState.tsx -> startAdventure
      // Do NOT reset it to IDLE here; let processTick detect it next tick
      if (son.currentAction === Action.DEPARTING) {
        return newState;
      }
      // Action completed: apply effects
      newState = applyActionEffect(newState);
      son.currentAction = Action.IDLE;
    } else {
      return newState; // still busy
    }
  }

  // Track ticks since return (for dialogue triggers)
  if (son.dialogueState) {
    son.dialogueState.ticksSinceReturn += 1;
  }

  // Check quest deadlines
  newState = checkQuestDeadlines(newState);

  // Decision tree: pick next action
  newState = decideNextAction(newState);

  // Evaluate dialogue triggers (after action decided, so we know furniture)
  newState = evaluateDialogueTriggers(newState);

  return newState;
}

// -----------------------------------------------------------------
// Decision tree
// -----------------------------------------------------------------

function decideNextAction(state: GameState): GameState {
  const son = state.son;
  const home = state.home;
  const hpPercent = son.stats.hp / son.stats.maxHp;

  // 1. HP < 30%? => potion or sleep
  if (hpPercent < 0.3) {
    const healPotion = home.potionShelf.find(p => p.effect === 'instant' && p.stat === 'hp');
    if (healPotion) {
      return startAction(state, Action.DRINKING_POTION);
    }
    return startAction(state, Action.SLEEPING);
  }

  // 2. Hunger < 20%? => eat or rest
  if (son.stats.hunger < 20) {
    if (home.table.length > 0) {
      return startAction(state, Action.EATING);
    }
    return startAction(state, Action.RESTING);
  }

  // 3. Check departure conditions
  const canDepart = son.stats.hunger >= DEPARTURE_HUNGER_THRESHOLD && hpPercent >= DEPARTURE_HP_THRESHOLD;

  if (canDepart) {
    // Even when ready to depart, son may choose to train or read first
    const skipRoll = Math.random();
    if (skipRoll < DEPARTURE_SKIP_CHANCE) {
      // Son decides to do something at home before leaving
      if (home.desk.length > 0 && Math.random() < 0.4) {
        return startAction(state, Action.READING);
      }
      if (Math.random() < 0.6) {
        return startAction(state, Action.TRAINING);
      }
      // Rest a bit before heading out
      return startAction(state, Action.RESTING);
    }
    // Son decides to leave
    return prepareDeparture(state);
  }

  // 4. HP < 80%? => sleep to recover
  if (hpPercent < 0.8) {
    return startAction(state, Action.SLEEPING);
  }

  // 5. Hunger < 80%? => eat if food available
  if (son.stats.hunger < DEPARTURE_HUNGER_THRESHOLD && home.table.length > 0) {
    return startAction(state, Action.EATING);
  }

  // 6. Book on desk? 40% chance to read
  if (home.desk.length > 0 && Math.random() < 0.4) {
    return startAction(state, Action.READING);
  }

  // 7. Farm: if seeds > 0 and empty plots exist, 20% chance
  if (state.inventory.materials.seed > 0 && state.farm.plots.some(p => p.crop === null) && Math.random() < 0.2) {
    return startAction(state, Action.FARMING);
  }

  // 8. Train at dummy
  if (Math.random() < 0.6) {
    return startAction(state, Action.TRAINING);
  }

  // 9. Default: rest
  return startAction(state, Action.RESTING);
}

// -----------------------------------------------------------------
// Start an action
// -----------------------------------------------------------------

function startAction(state: GameState, action: SonAction): GameState {
  const son = state.son;
  son.currentAction = action as SonAction;
  const durationRange = ACTION_DURATIONS[action] ?? [2, 4];
  son.actionTimer = randInt(durationRange[0], durationRange[1]);

  // Set dialogue
  switch (action) {
    case Action.SLEEPING:
      son.dialogue = pick(SON_DIALOGUES.sleeping);
      break;
    case Action.EATING:
      son.dialogue = pick(SON_DIALOGUES.eating);
      break;
    case Action.TRAINING:
      son.dialogue = pick(SON_DIALOGUES.training);
      break;
    case Action.READING:
      son.dialogue = pick(SON_DIALOGUES.reading);
      break;
    case Action.RESTING:
      son.dialogue = pick(SON_DIALOGUES.resting);
      break;
    case Action.DRINKING_POTION:
      son.dialogue = pick(SON_DIALOGUES.drinkingPotion);
      break;
    case Action.FARMING:
      son.dialogue = pick(SON_DIALOGUES.farming);
      break;
    default:
      break;
  }

  return state;
}

// -----------------------------------------------------------------
// Apply action effects when completed
// -----------------------------------------------------------------

function applyActionEffect(state: GameState): GameState {
  const son = state.son;
  const home = state.home;

  switch (son.currentAction) {
    case Action.SLEEPING:
      // HP recovery is handled per-tick, no lump sum on completion
      break;

    case Action.EATING: {
      // Eat best food from table (highest hunger restore)
      if (home.table.length > 0) {
        const sorted = [...home.table].sort((a, b) => b.hungerRestore - a.hungerRestore);
        const food = sorted[0];
        // Remove from table
        const idx = home.table.findIndex(f => f.id === food.id);
        if (idx !== -1) home.table.splice(idx, 1);
        // Apply food effects
        son.stats.hunger = Math.min(son.stats.maxHunger, son.stats.hunger + food.hungerRestore);
        if (food.hpRestore) {
          son.stats.hp = Math.min(son.stats.maxHp, son.stats.hp + food.hpRestore);
        }
        if (food.tempBuff) {
          // Replace existing buff from same source instead of stacking
          const existingIdx = son.tempBuffs.findIndex(b => b.source === food.name);
          const newBuff = { stat: food.tempBuff.stat, value: food.tempBuff.value, source: food.name };
          if (existingIdx !== -1) {
            son.tempBuffs[existingIdx] = newBuff;
          } else {
            son.tempBuffs.push(newBuff);
          }
        }
      }
      break;
    }

    case Action.TRAINING: {
      const expGain = randInt(TRAINING_EXP_MIN, TRAINING_EXP_MAX);
      son.stats.exp += expGain;
      // Check level up (handled by caller/gameState)
      break;
    }

    case Action.READING: {
      if (home.desk.length > 0) {
        const book = home.desk[0];
        // Apply stat effect permanently
        const stat = book.statEffect.stat;
        son.stats[stat] += book.statEffect.value;
        // Remove book from desk after reading
        home.desk.splice(0, 1);
        // Also remove from inventory books
        const bookIdx = state.inventory.books.findIndex(b => b.id === book.id);
        if (bookIdx !== -1) state.inventory.books.splice(bookIdx, 1);
      }
      break;
    }

    case Action.RESTING:
      // HP recovery is handled per-tick, no lump sum on completion
      break;

    case Action.DRINKING_POTION: {
      // Find and consume a health potion from shelf
      const potionIdx = home.potionShelf.findIndex(
        p => p.effect === 'instant' && p.stat === 'hp'
      );
      if (potionIdx !== -1) {
        const potion = home.potionShelf[potionIdx];
        home.potionShelf.splice(potionIdx, 1);
        if (potion.value) {
          son.stats.hp = Math.min(son.stats.maxHp, son.stats.hp + potion.value);
        }
      }
      break;
    }

    case Action.FARMING: {
      // Plant seed in first empty plot
      if (state.inventory.materials.seed > 0) {
        const emptyIdx = state.farm.plots.findIndex(p => p.crop === null);
        if (emptyIdx !== -1) {
          state.inventory.materials.seed -= 1;
          const crop = rollRandomCrop(state.farm.farmLevel);
          state.farm.plots[emptyIdx] = {
            crop,
            plantedAt: Date.now(),
            growthTime: UNIVERSAL_GROWTH_TIME,
            ready: false,
          };
        }
      }
      break;
    }

    default:
      break;
  }

  return state;
}

// -----------------------------------------------------------------
// Departure preparation
// -----------------------------------------------------------------

function prepareDeparture(state: GameState): GameState {
  const son = state.son;
  const home = state.home;

  // 1. Drink buff potions from shelf (not health potions)
  const buffPotions = home.potionShelf.filter(p => p.effect === 'buff');
  for (const potion of buffPotions) {
    if (potion.stat && potion.value) {
      son.tempBuffs.push({
        stat: potion.stat === 'hp' ? 'all' : potion.stat,
        value: potion.value,
        source: potion.name,
      });
    }
  }
  // Remove consumed buff potions from shelf
  home.potionShelf = home.potionShelf.filter(p => p.effect !== 'buff');

  // 2. Auto-equip best gear from equipment rack
  autoEquipBestGear(state);

  // 3. Set departing state
  son.currentAction = Action.DEPARTING;
  const departRange = ACTION_DURATIONS[Action.DEPARTING] ?? [3, 4];
  son.actionTimer = randInt(departRange[0], departRange[1]);
  son.dialogue = pick(SON_DIALOGUES.departing);

  return state;
}

// -----------------------------------------------------------------
// Auto-equip best gear by total stat contribution
// -----------------------------------------------------------------

function autoEquipBestGear(state: GameState): void {
  const rack = state.home.equipmentRack;
  const son = state.son;

  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];

  for (const slot of slots) {
    const candidates = rack.filter(e => e.slot === slot);
    if (candidates.length === 0) continue;

    // Pick equipment with highest total stat sum
    const best = candidates.reduce((a, b) =>
      equipmentStatTotal(b) > equipmentStatTotal(a) ? b : a
    );

    // Compare with currently equipped
    const current = son.equipment[slot];
    if (!current || equipmentStatTotal(best) > equipmentStatTotal(current)) {
      // Swap: put old gear back on rack, equip new
      if (current) {
        rack.push(current);
      }
      son.equipment[slot] = best;
      const idx = rack.findIndex(e => e.id === best.id);
      if (idx !== -1) rack.splice(idx, 1);
    }
  }
}

function equipmentStatTotal(eq: Equipment): number {
  const s = eq.baseStats;
  const raw = (s.str ?? 0) + (s.def ?? 0) + (s.agi ?? 0) + (s.int ?? 0) + (s.hp ?? 0) / 5;
  const levelBonus = (eq.level ?? 1) * 0.1;
  // Apply durability penalty
  if (eq.durability <= 0) return 0;
  if (eq.durability < 30) return (raw + levelBonus) * (eq.durability / 30);
  return raw + levelBonus;
}

// -----------------------------------------------------------------
// Check and process level up
// -----------------------------------------------------------------

export function checkLevelUp(state: GameState): GameState {
  const son = state.son;
  while (son.stats.exp >= son.stats.maxExp && son.stats.level < 20) {
    son.stats.exp -= son.stats.maxExp;
    son.stats.level += 1;

    // Import level table dynamically to avoid circular deps
    const { LEVEL_TABLE } = require('../constants');
    const entry = LEVEL_TABLE.find(
      (e: { level: number }) => e.level === son.stats.level
    );
    if (entry) {
      son.stats.maxHp += entry.hpGain;
      son.stats.hp = son.stats.maxHp; // Full heal on level up
      son.stats.str += entry.statGains.str;
      son.stats.def += entry.statGains.def;
      son.stats.agi += entry.statGains.agi;
      son.stats.int += entry.statGains.int;
      son.stats.maxExp = entry.expRequired;
    }

    // Check unlock milestones
    checkUnlocks(state);
  }
  return state;
}

function checkUnlocks(state: GameState): void {
  const level = state.son.stats.level;
  const unlocks = state.unlocks;
  const { UNLOCK_LEVELS } = require('../constants');

  if (level >= UNLOCK_LEVELS.alchemy) unlocks.systems.alchemy = true;
  if (level >= UNLOCK_LEVELS.enhancement) unlocks.systems.enhancement = true;
  if (level >= UNLOCK_LEVELS.smelting) unlocks.systems.smelting = true;
  if (level >= UNLOCK_LEVELS.farmExpansion && unlocks.farmSlots < 6) {
    unlocks.farmSlots = 6;
    // Expand farm plots
    while (state.farm.plots.length < 6) {
      state.farm.plots.push({ crop: null, plantedAt: null, growthTime: 0, ready: false });
    }
    state.farm.maxPlots = 6;
  }
  if (level >= UNLOCK_LEVELS.potionShelfExpansion) {
    unlocks.potionSlots = 5;
  }
}
