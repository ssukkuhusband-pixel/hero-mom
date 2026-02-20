import type { GameState, Quest, QuestObjective, DialogueTemplate, QuestReward, QuestPenalty, MaterialKey } from '../types';
import { RESPONSE_LINES } from './dialogueData';

// --- Helpers ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getQuestObjectiveDescription(obj: QuestObjective): string {
  const descs: Record<QuestObjective['type'], string> = {
    craft_food: '음식 만들기',
    place_food: '식탁에 음식 놓기',
    place_any_food: '식탁에 아무 음식 놓기',
    place_equipment: '장비대에 장비 놓기',
    brew_potion: '포션 만들기',
    place_potion: '포션 선반에 놓기',
    place_book: '책상에 책 놓기',
    gather_material: '재료 모으기',
  };
  return descs[obj.type] ?? obj.type;
}

// --- Quest Creation ---

export function createQuestFromTemplate(state: GameState, template: DialogueTemplate): GameState {
  const qd = template.questData;
  if (!qd) return state;

  const objectives: QuestObjective[] = qd.objectives.map((o) => ({
    ...o,
    currentAmount: 0,
  }));

  const description = objectives
    .map((o) => `${getQuestObjectiveDescription(o)} x${o.targetAmount}`)
    .join(', ');

  const quest: Quest = {
    id: `quest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    requestText: template.sonText,
    description,
    objectives,
    deadline: state.gameTime + qd.deadlineSeconds,
    acceptedAt: state.gameTime,
    status: 'active',
    reward: qd.reward,
    failPenalty: qd.failPenalty,
  };

  state.son.questState.activeQuests.push(quest);
  state.son.questState.lastQuestOfferedAt = state.gameTime;
  return state;
}

// --- Progress Counting ---

/** Resolve a recipe targetId to its display name for matching */
function getRecipeName(targetId: string): string | null {
  // Lazy import to avoid circular — look up name from all recipe arrays
  const { FOOD_RECIPES, EQUIPMENT_RECIPES, POTION_RECIPES } = require('../constants');
  const all = [...FOOD_RECIPES, ...EQUIPMENT_RECIPES, ...POTION_RECIPES];
  const recipe = all.find((r: { id: string }) => r.id === targetId);
  return recipe?.name ?? null;
}

function countObjectiveProgress(state: GameState, obj: QuestObjective): number {
  const targetName = obj.targetId ? getRecipeName(obj.targetId) : null;

  switch (obj.type) {
    case 'craft_food':
    case 'place_food':
      // Match by recipe name (since item.id is a uid, not the recipe id)
      if (!targetName) return state.home.table.length;
      return state.home.table.filter((f) => f.name === targetName).length
        + state.inventory.food.filter((f) => f.name === targetName).length;

    case 'place_any_food':
      return state.home.table.length;

    case 'place_equipment':
      // targetId can be a slot name (weapon/armor/accessory) or a recipe name
      if (!obj.targetId) return state.home.equipmentRack.length;
      // Check if targetId is a slot name
      if (['weapon', 'armor', 'accessory'].includes(obj.targetId)) {
        return state.home.equipmentRack.filter((e) => e.slot === obj.targetId).length
          + state.inventory.equipment.filter((e) => e.slot === obj.targetId).length;
      }
      if (!targetName) return state.home.equipmentRack.length;
      return state.home.equipmentRack.filter((e) => e.name === targetName).length
        + state.inventory.equipment.filter((e) => e.name === targetName).length;

    case 'brew_potion':
    case 'place_potion':
      if (!targetName) return state.home.potionShelf.length;
      return state.home.potionShelf.filter((p) => p.name === targetName).length
        + state.inventory.potions.filter((p) => p.name === targetName).length;

    case 'place_book':
      return state.home.desk.length;

    case 'gather_material':
      if (!obj.targetId) return 0;
      return state.inventory.materials[obj.targetId as MaterialKey] ?? 0;

    default:
      return 0;
  }
}

// --- Quest Progress Check ---

export function checkQuestProgress(state: GameState): GameState {
  const still: Quest[] = [];

  for (const quest of state.son.questState.activeQuests) {
    for (const obj of quest.objectives) {
      obj.currentAmount = countObjectiveProgress(state, obj);
    }

    const allDone = quest.objectives.every((o) => o.currentAmount >= o.targetAmount);

    if (allDone) {
      quest.status = 'completed';
      applyQuestReward(state, quest);
      state.son.questState.completedQuests.push(quest);
      // Keep only the last 10 completed quests
      if (state.son.questState.completedQuests.length > 10) {
        state.son.questState.completedQuests = state.son.questState.completedQuests.slice(-10);
      }
    } else {
      still.push(quest);
    }
  }

  state.son.questState.activeQuests = still;
  return state;
}

// --- Deadline Check ---

export function checkQuestDeadlines(state: GameState): GameState {
  const still: Quest[] = [];

  for (const quest of state.son.questState.activeQuests) {
    if (state.gameTime > quest.deadline) {
      quest.status = 'failed';
      applyQuestPenalty(state, quest);
      state.son.questState.completedQuests.push(quest);
      if (state.son.questState.completedQuests.length > 10) {
        state.son.questState.completedQuests = state.son.questState.completedQuests.slice(-10);
      }
    } else {
      still.push(quest);
    }
  }

  state.son.questState.activeQuests = still;
  return state;
}

// --- Reward & Penalty ---

export function applyQuestReward(state: GameState, quest: Quest): void {
  const r = quest.reward;
  switch (r.type) {
    case 'buff':
      state.son.tempBuffs.push({
        stat: r.stat ?? 'all',
        value: r.value,
        source: quest.description,
      });
      break;
    case 'exp':
      state.son.stats.exp += r.value;
      break;
    case 'mood':
      state.son.dialogueState.mood = Math.min(100, state.son.dialogueState.mood + r.value);
      break;
    case 'materials':
      state.inventory.materials.gold += r.value;
      break;
  }
  const lines = RESPONSE_LINES?.questComplete;
  state.son.dialogue = lines?.length ? pick(lines) : '고마워요, 엄마!';
}

export function applyQuestPenalty(state: GameState, quest: Quest): void {
  state.son.dialogueState.mood = Math.max(0, state.son.dialogueState.mood - quest.failPenalty.value);
  const lines = RESPONSE_LINES?.questFail;
  state.son.dialogue = lines?.length ? pick(lines) : '...괜찮아요.';
}
