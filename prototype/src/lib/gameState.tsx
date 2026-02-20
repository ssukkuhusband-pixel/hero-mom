'use client';

// ============================================================
// Game State Management - React Context + useReducer
// Auto-saves to localStorage, 2-second game tick
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type {
  GameState,
  GameAction,
  CropType,
} from './types';
import { SonAction } from './types';
import { INITIAL_GAME_STATE, SON_TICK_INTERVAL, MAX_TABLE_FOOD, SHOP_INVENTORY, SELL_PRICES, DURABILITY_MAX } from './constants';
import { processSonTick, checkLevelUp } from './game/sonAI';
import {
  craftEquipment,
  cookFood,
  brewPotion,
  enhanceEquipment,
  promoteEquipment,
  maintainEquipment,
  smeltEquipment,
} from './game/crafting';
import { startAdventure, processAdventureTick } from './game/adventure';
import { plantCrop, harvestCrop, processFarmTick } from './game/farm';
import { processDialogueResponse, dismissDialogue } from './game/dialogue';
import { createQuestFromTemplate, checkQuestProgress } from './game/quest';

// -----------------------------------------------------------------
// localStorage helpers
// -----------------------------------------------------------------

const STORAGE_KEY = 'hero-mom-save';

function saveToLocalStorage(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently fail if storage is full
  }
}

function loadFromLocalStorage(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const state = JSON.parse(saved) as GameState;
    // Migrate old saves: add dialogue & quest state if missing
    if (!state.son.dialogueState) {
      state.son.dialogueState = {
        activeDialogue: null,
        cooldowns: { emotion: 0, bedtime: 0, daily: 0, request: 0 },
        counts: { emotion: 0, bedtime: 0, daily: 0, request: 0 },
        mood: 70,
        ticksSinceReturn: 999,
      };
    }
    if (!state.son.questState) {
      state.son.questState = {
        activeQuests: [],
        completedQuests: [],
        lastQuestOfferedAt: 0,
      };
    }

    // Migrate: equipment durability/tier fields
    const migrateEquipment = (eq: { durability?: number; maxDurability?: number; tier?: number }) => {
      if (eq.durability === undefined) eq.durability = DURABILITY_MAX;
      if (eq.maxDurability === undefined) eq.maxDurability = DURABILITY_MAX;
      if (eq.tier === undefined) eq.tier = 0;
    };
    state.inventory.equipment.forEach(migrateEquipment);
    state.home.equipmentRack.forEach(migrateEquipment);
    if (state.son.equipment.weapon) migrateEquipment(state.son.equipment.weapon);
    if (state.son.equipment.armor) migrateEquipment(state.son.equipment.armor);
    if (state.son.equipment.accessory) migrateEquipment(state.son.equipment.accessory);

    // Migrate: gacha → smelting unlock
    const systems = state.unlocks.systems as Record<string, boolean>;
    if ('gacha' in systems) {
      systems.smelting = systems.gacha;
      delete systems.gacha;
    }
    if (systems.smelting === undefined) {
      systems.smelting = false;
    }

    return state;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------
// Reducer
// -----------------------------------------------------------------

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      return processTick(state, action.now);

    case 'CRAFT_EQUIPMENT':
      return checkQuestProgress(craftEquipment(state, action.recipeId));

    case 'COOK_FOOD':
      return checkQuestProgress(cookFood(state, action.recipeId));

    case 'BREW_POTION':
      return checkQuestProgress(brewPotion(state, action.recipeId));

    case 'PLANT_CROP':
      return plantCrop(state, action.plotIndex, action.crop);

    case 'HARVEST_CROP':
      return harvestCrop(state, action.plotIndex);

    case 'ENHANCE_EQUIPMENT': {
      const result = enhanceEquipment(state, action.equipmentId);
      return result.state;
    }

    case 'PROMOTE_EQUIPMENT':
      return promoteEquipment(state, action.equipmentId);

    case 'MAINTAIN_EQUIPMENT':
      return maintainEquipment(state, action.equipmentId);

    case 'SMELT_EQUIPMENT':
      return smeltEquipment(state, action.equipmentId);

    case 'PLACE_FOOD':
      return checkQuestProgress(placeFood(state, action.foodIndex));

    case 'PLACE_POTION':
      return checkQuestProgress(placePotion(state, action.potionIndex));

    case 'PLACE_EQUIPMENT':
      return checkQuestProgress(placeEquipmentOnRack(state, action.equipmentId));

    case 'PLACE_BOOK':
      return checkQuestProgress(placeBook(state, action.bookIndex));

    case 'REMOVE_FOOD':
      return removeFood(state, action.placedIndex);

    case 'REMOVE_POTION':
      return removePotion(state, action.placedIndex);

    case 'REMOVE_EQUIPMENT':
      return removeEquipmentFromRack(state, action.equipmentId);

    case 'REMOVE_BOOK':
      return removeBook(state, action.placedIndex);

    case 'BUY_ITEM':
      return buyItem(state, action.shopItemId);

    case 'SELL_FOOD':
      return sellFood(state, action.foodIndex);

    case 'SELL_POTION':
      return sellPotion(state, action.potionIndex);

    case 'SELL_EQUIPMENT':
      return sellEquipment(state, action.equipmentId);

    case 'RESPOND_DIALOGUE': {
      const { state: newState, acceptedTemplate } = processDialogueResponse(state, action.choiceId);
      if (acceptedTemplate) {
        return createQuestFromTemplate(newState, acceptedTemplate);
      }
      return newState;
    }

    case 'DISMISS_DIALOGUE':
      return dismissDialogue(state);

    case 'ACCEPT_QUEST':
      // Quest acceptance is handled through RESPOND_DIALOGUE
      return state;

    case 'DECLINE_QUEST':
      return dismissDialogue(state);

    case 'LOAD_STATE':
      return action.state;

    case 'RESET_GAME':
      return structuredClone(INITIAL_GAME_STATE);

    default:
      return state;
  }
}

// -----------------------------------------------------------------
// Game tick processing
// -----------------------------------------------------------------

function processTick(state: GameState, now: number): GameState {
  let newState = structuredClone(state);
  newState.lastTickAt = now;
  newState.gameTime += 2; // 2-second ticks

  // 1. Process farm growth
  processFarmTick(newState);

  // 2. Process son AI (only when home)
  if (newState.son.isHome) {
    // Check if son just finished departing action
    if (newState.son.currentAction === SonAction.DEPARTING && newState.son.actionTimer <= 0) {
      newState = startAdventure(newState);
    } else {
      newState = processSonTick(newState);
    }
  }

  // 3. Process adventure (only when active)
  if (newState.adventure?.active) {
    newState = processAdventureTick(newState);
  }

  // 4. Check level ups
  newState = checkLevelUp(newState);

  return newState;
}

// -----------------------------------------------------------------
// Placement actions
// -----------------------------------------------------------------

function placeFood(state: GameState, foodIndex: number): GameState {
  if (foodIndex < 0 || foodIndex >= state.inventory.food.length) return state;
  if (state.home.table.length >= MAX_TABLE_FOOD) return state;

  const newState = structuredClone(state);
  const food = newState.inventory.food.splice(foodIndex, 1)[0];
  newState.home.table.push(food);
  return newState;
}

function placePotion(state: GameState, potionIndex: number): GameState {
  if (potionIndex < 0 || potionIndex >= state.inventory.potions.length) return state;
  if (state.home.potionShelf.length >= state.unlocks.potionSlots) return state;

  const newState = structuredClone(state);
  const potion = newState.inventory.potions.splice(potionIndex, 1)[0];
  newState.home.potionShelf.push(potion);
  return newState;
}

function placeEquipmentOnRack(state: GameState, equipmentId: string): GameState {
  const eqIndex = state.inventory.equipment.findIndex(e => e.id === equipmentId);
  if (eqIndex === -1) return state;

  const newState = structuredClone(state);
  const eq = newState.inventory.equipment.splice(eqIndex, 1)[0];
  newState.home.equipmentRack.push(eq);
  return newState;
}

function placeBook(state: GameState, bookIndex: number): GameState {
  if (bookIndex < 0 || bookIndex >= state.inventory.books.length) return state;

  const newState = structuredClone(state);
  const book = newState.inventory.books.splice(bookIndex, 1)[0];
  newState.home.desk.push(book);
  return newState;
}

// -----------------------------------------------------------------
// Removal actions
// -----------------------------------------------------------------

function removeFood(state: GameState, placedIndex: number): GameState {
  if (placedIndex < 0 || placedIndex >= state.home.table.length) return state;
  const newState = structuredClone(state);
  const food = newState.home.table.splice(placedIndex, 1)[0];
  newState.inventory.food.push(food);
  return newState;
}

function removePotion(state: GameState, placedIndex: number): GameState {
  if (placedIndex < 0 || placedIndex >= state.home.potionShelf.length) return state;
  const newState = structuredClone(state);
  const potion = newState.home.potionShelf.splice(placedIndex, 1)[0];
  newState.inventory.potions.push(potion);
  return newState;
}

function removeEquipmentFromRack(state: GameState, equipmentId: string): GameState {
  const eqIndex = state.home.equipmentRack.findIndex(e => e.id === equipmentId);
  if (eqIndex === -1) return state;
  const newState = structuredClone(state);
  const eq = newState.home.equipmentRack.splice(eqIndex, 1)[0];
  newState.inventory.equipment.push(eq);
  return newState;
}

function removeBook(state: GameState, placedIndex: number): GameState {
  if (placedIndex < 0 || placedIndex >= state.home.desk.length) return state;
  const newState = structuredClone(state);
  const book = newState.home.desk.splice(placedIndex, 1)[0];
  newState.inventory.books.push(book);
  return newState;
}

// -----------------------------------------------------------------
// Shop actions
// -----------------------------------------------------------------

function buyItem(state: GameState, shopItemId: string): GameState {
  const shopItem = SHOP_INVENTORY.find(s => s.id === shopItemId);
  if (!shopItem) return state;
  if (state.inventory.materials.gold < shopItem.goldCost) return state;

  const newState = structuredClone(state);
  newState.inventory.materials.gold -= shopItem.goldCost;

  if (shopItem.book) {
    newState.inventory.books.push({
      id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: shopItem.book.name,
      statEffect: { stat: shopItem.book.stat, value: shopItem.book.value },
    });
  } else if (shopItem.material) {
    newState.inventory.materials[shopItem.material.key] =
      (newState.inventory.materials[shopItem.material.key] ?? 0) + shopItem.material.amount;
  }

  return newState;
}

function sellFood(state: GameState, foodIndex: number): GameState {
  if (foodIndex < 0 || foodIndex >= state.inventory.food.length) return state;
  const newState = structuredClone(state);
  newState.inventory.food.splice(foodIndex, 1);
  newState.inventory.materials.gold += SELL_PRICES.food;
  return newState;
}

function sellPotion(state: GameState, potionIndex: number): GameState {
  if (potionIndex < 0 || potionIndex >= state.inventory.potions.length) return state;
  const newState = structuredClone(state);
  newState.inventory.potions.splice(potionIndex, 1);
  newState.inventory.materials.gold += SELL_PRICES.potion;
  return newState;
}

function sellEquipment(state: GameState, equipmentId: string): GameState {
  const eqIndex = state.inventory.equipment.findIndex(e => e.id === equipmentId);
  if (eqIndex === -1) return state;
  const newState = structuredClone(state);
  const eq = newState.inventory.equipment[eqIndex];
  newState.inventory.equipment.splice(eqIndex, 1);
  newState.inventory.materials.gold += SELL_PRICES.equipment[eq.grade];
  return newState;
}

// -----------------------------------------------------------------
// Context
// -----------------------------------------------------------------

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

// -----------------------------------------------------------------
// Provider
// -----------------------------------------------------------------

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    INITIAL_GAME_STATE,
    () => {
      // Try to load saved state on init (client-side only)
      if (typeof window !== 'undefined') {
        const saved = loadFromLocalStorage();
        if (saved) return saved;
      }
      return structuredClone(INITIAL_GAME_STATE);
    }
  );

  // Auto-save to localStorage on every state change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveToLocalStorage(state);
  }, [state]);

  // Game tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, SON_TICK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// -----------------------------------------------------------------
// Hook
// -----------------------------------------------------------------

export function useGameState(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return ctx;
}

// Convenience hooks for common dispatches
export function useGameActions() {
  const { dispatch } = useGameState();

  return {
    craftEquipment: useCallback(
      (recipeId: string) => dispatch({ type: 'CRAFT_EQUIPMENT', recipeId }),
      [dispatch]
    ),
    cookFood: useCallback(
      (recipeId: string) => dispatch({ type: 'COOK_FOOD', recipeId }),
      [dispatch]
    ),
    brewPotion: useCallback(
      (recipeId: string) => dispatch({ type: 'BREW_POTION', recipeId }),
      [dispatch]
    ),
    plantCrop: useCallback(
      (plotIndex: number, crop: CropType) => dispatch({ type: 'PLANT_CROP', plotIndex, crop }),
      [dispatch]
    ),
    harvestCrop: useCallback(
      (plotIndex: number) => dispatch({ type: 'HARVEST_CROP', plotIndex }),
      [dispatch]
    ),
    enhanceEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'ENHANCE_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    promoteEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'PROMOTE_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    maintainEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'MAINTAIN_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    smeltEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'SMELT_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    placeFood: useCallback(
      (foodIndex: number) => dispatch({ type: 'PLACE_FOOD', foodIndex }),
      [dispatch]
    ),
    placePotion: useCallback(
      (potionIndex: number) => dispatch({ type: 'PLACE_POTION', potionIndex }),
      [dispatch]
    ),
    placeEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'PLACE_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    placeBook: useCallback(
      (bookIndex: number) => dispatch({ type: 'PLACE_BOOK', bookIndex }),
      [dispatch]
    ),
    removeFood: useCallback(
      (placedIndex: number) => dispatch({ type: 'REMOVE_FOOD', placedIndex }),
      [dispatch]
    ),
    removePotion: useCallback(
      (placedIndex: number) => dispatch({ type: 'REMOVE_POTION', placedIndex }),
      [dispatch]
    ),
    removeEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'REMOVE_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    removeBook: useCallback(
      (placedIndex: number) => dispatch({ type: 'REMOVE_BOOK', placedIndex }),
      [dispatch]
    ),
    buyItem: useCallback(
      (shopItemId: string) => dispatch({ type: 'BUY_ITEM', shopItemId }),
      [dispatch]
    ),
    sellFood: useCallback(
      (foodIndex: number) => dispatch({ type: 'SELL_FOOD', foodIndex }),
      [dispatch]
    ),
    sellPotion: useCallback(
      (potionIndex: number) => dispatch({ type: 'SELL_POTION', potionIndex }),
      [dispatch]
    ),
    sellEquipment: useCallback(
      (equipmentId: string) => dispatch({ type: 'SELL_EQUIPMENT', equipmentId }),
      [dispatch]
    ),
    respondDialogue: useCallback(
      (choiceId: string) => dispatch({ type: 'RESPOND_DIALOGUE', choiceId }),
      [dispatch]
    ),
    dismissDialogue: useCallback(
      () => dispatch({ type: 'DISMISS_DIALOGUE' }),
      [dispatch]
    ),
    declineQuest: useCallback(
      () => dispatch({ type: 'DECLINE_QUEST' }),
      [dispatch]
    ),
    resetGame: useCallback(
      () => dispatch({ type: 'RESET_GAME' }),
      [dispatch]
    ),
  };
}
