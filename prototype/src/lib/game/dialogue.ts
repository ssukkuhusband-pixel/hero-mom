// ============================================================
// Dialogue Trigger & Response Logic
// Evaluates dialogue triggers each tick and processes responses
// ============================================================

import type { GameState, DialogueTemplate, DialogueType, ActiveDialogue, DialogueEffect, FurnitureKey } from '../types';
import { SonAction } from '../types';
import { DIALOGUE_TRIGGER_CHANCE, DIALOGUE_COOLDOWNS, DIALOGUE_AUTO_DISMISS, MAX_ACTIVE_QUESTS, MOOD_DECAY_INTERVAL } from '../constants';
import { ALL_DIALOGUES, RESPONSE_LINES } from './dialogueData';

// --- Helpers ---

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Map SonAction to the furniture the son is near */
function actionToFurniture(action: SonAction): FurnitureKey | null {
  switch (action) {
    case SonAction.SLEEPING: return 'bed';
    case SonAction.TRAINING: return 'dummy';
    case SonAction.EATING: return 'table';
    case SonAction.READING: return 'desk';
    case SonAction.RESTING: return 'chair';
    case SonAction.DRINKING_POTION: return 'potionShelf';
    case SonAction.DEPARTING: return 'door';
    default: return null;
  }
}

// --- Condition Matching ---

function matchesConditions(template: DialogueTemplate, state: GameState): boolean {
  const { conditions } = template;
  const son = state.son;

  if (conditions.sonAction && !conditions.sonAction.includes(son.currentAction)) return false;

  if (conditions.hpRange) {
    const hpPct = (son.stats.hp / son.stats.maxHp) * 100;
    if (hpPct < conditions.hpRange[0] || hpPct > conditions.hpRange[1]) return false;
  }

  if (conditions.hungerRange) {
    if (son.stats.hunger < conditions.hungerRange[0] || son.stats.hunger > conditions.hungerRange[1]) return false;
  }

  if (conditions.minLevel != null && son.stats.level < conditions.minLevel) return false;

  if (conditions.isInjured != null && son.isInjured !== conditions.isInjured) return false;

  if (conditions.justReturned && son.dialogueState.ticksSinceReturn >= 15) return false;

  if (conditions.nearFurniture) {
    const furniture = actionToFurniture(son.currentAction);
    if (!furniture || !conditions.nearFurniture.includes(furniture)) return false;
  }

  // Request type: can't exceed max active quests
  if (template.type === 'request' && son.questState.activeQuests.length >= MAX_ACTIVE_QUESTS) return false;

  return true;
}

// --- Effect Application ---

function applyDialogueEffect(state: GameState, effect: DialogueEffect): void {
  const son = state.son;
  switch (effect.type) {
    case 'heal':
      son.stats.hp = Math.min(son.stats.hp + effect.value, son.stats.maxHp);
      break;
    case 'hunger':
      son.stats.hunger = Math.min(son.stats.hunger + effect.value, son.stats.maxHunger);
      break;
    case 'buff':
      son.tempBuffs.push({ stat: effect.stat as 'str' | 'def' | 'agi' | 'int' | 'all', value: effect.value, source: effect.source });
      break;
    case 'exp':
      son.stats.exp += effect.value;
      break;
    case 'mood':
      son.dialogueState.mood = Math.max(0, Math.min(100, son.dialogueState.mood + effect.value));
      break;
  }
}

// --- Main Functions ---

/** Evaluate dialogue triggers each tick. Mutates state in place (caller clones). */
export function evaluateDialogueTriggers(state: GameState): GameState {
  const s = state;
  const ds = s.son.dialogueState;

  // Auto-dismiss active dialogue after timeout
  if (ds.activeDialogue) {
    if (s.gameTime - ds.activeDialogue.startedAt >= DIALOGUE_AUTO_DISMISS) {
      ds.activeDialogue = null;
    }
    return s;
  }

  // Skip if son is not home or adventuring
  if (!s.son.isHome || s.son.currentAction === SonAction.ADVENTURING) return s;

  // Mood decay toward 50
  if (s.gameTime > 0 && Math.floor(s.gameTime / MOOD_DECAY_INTERVAL) > Math.floor((s.gameTime - 1) / MOOD_DECAY_INTERVAL)) {
    if (ds.mood > 50) ds.mood = Math.max(50, ds.mood - 1);
    else if (ds.mood < 50) ds.mood = Math.min(50, ds.mood + 1);
  }

  // Gather candidates
  const candidates = ALL_DIALOGUES.filter(t => {
    // Cooldown check
    if (ds.cooldowns[t.type] > s.gameTime) return false;
    return matchesConditions(t, s);
  });

  if (candidates.length === 0) return s;

  // Sort by priority descending
  candidates.sort((a, b) => b.priority - a.priority);

  // Roll probability for the top candidate
  const top = candidates[0];
  const chance = DIALOGUE_TRIGGER_CHANCE[top.type] ?? 0;
  if (Math.random() > chance) return s;

  // Trigger dialogue
  ds.activeDialogue = {
    template: top,
    startedAt: s.gameTime,
    responded: false,
  };

  return s;
}

/** Process player's response to a dialogue choice.
 *  Returns { state, acceptedTemplate } where acceptedTemplate is set if a quest was accepted. */
export function processDialogueResponse(
  state: GameState,
  choiceId: string,
): { state: GameState; acceptedTemplate: DialogueTemplate | null } {
  const s = structuredClone(state);
  const ds = s.son.dialogueState;
  const active = ds.activeDialogue;
  if (!active) return { state: s, acceptedTemplate: null };

  const choice = active.template.choices.find(c => c.id === choiceId);
  if (!choice) return { state: s, acceptedTemplate: null };

  // Apply effect
  if (choice.effect) {
    applyDialogueEffect(s, choice.effect);
  }

  const dtype = active.template.type;
  const tmpl = active.template;

  // Set cooldown
  ds.cooldowns[dtype] = s.gameTime + (DIALOGUE_COOLDOWNS[dtype] ?? 60);

  // Increment count
  ds.counts[dtype] = (ds.counts[dtype] || 0) + 1;

  // Clear active dialogue
  ds.activeDialogue = null;

  // Set a response line
  if (dtype === 'request' && choiceId === 'decline') {
    const declineLines = RESPONSE_LINES['decline'];
    s.son.dialogue = declineLines?.length ? pick(declineLines) : '알겠어요...';
  } else {
    const lines = RESPONSE_LINES[dtype];
    if (lines && lines.length > 0) {
      s.son.dialogue = pick(lines);
    }
  }

  // For request-accept, return the template so the reducer can create the quest
  const accepted = dtype === 'request' && choiceId === 'accept' ? tmpl : null;

  return { state: s, acceptedTemplate: accepted };
}

/** Dismiss the active dialogue without responding */
export function dismissDialogue(state: GameState): GameState {
  const s = structuredClone(state);
  s.son.dialogueState.activeDialogue = null;
  return s;
}

export { matchesConditions, applyDialogueEffect, actionToFurniture, pick };
