// ============================================================
// Adventure System - Departure, Combat, Letters, Return
// ============================================================

import type {
  GameState,
  AdventureState,
  BattleResult,
  Letter,
  MaterialKey,
  Equipment,
  TempBuff,
  Book,
} from '../types';
import { SonAction } from '../types';
import {
  ADVENTURE_DURATION_TABLE,
  ADVENTURE_LETTER_INTERVAL_MIN,
  ADVENTURE_LETTER_INTERVAL_MAX,
  ENEMY_POWER_TABLE,
  LOOT_TABLE,
  HERB_DROP_CHANCE,
  HERB_DROP_MIN,
  HERB_DROP_MAX,
  HERB_TYPES,
  SEED_DROP_CHANCE,
  RARE_LOOT,
  LETTER_TEMPLATES,
  GRADE_MULTIPLIERS,
  ENHANCEMENT_TABLE,
  ADVENTURE_IMAGES,
  BOOK_TEMPLATES,
  BOOK_DROP_CHANCE,
  BOOK_DROP_BOSS_CHANCE,
  DURABILITY_PENALTY_THRESHOLD,
  DURABILITY_LOSS_PER_ADVENTURE,
  DURABILITY_LOSS_BOSS_BONUS,
} from '../constants';

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -----------------------------------------------------------------
// Book drop generation
// -----------------------------------------------------------------

function generateBookDrop(level: number, isBoss: boolean, outcome: string): Book | undefined {
  if (outcome === 'defeat') return undefined;
  const chance = isBoss ? BOOK_DROP_BOSS_CHANCE : BOOK_DROP_CHANCE;
  if (Math.random() >= chance) return undefined;
  const eligible = BOOK_TEMPLATES.filter(b => level >= b.minLevel);
  if (eligible.length === 0) return undefined;
  const template = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: template.name,
    statEffect: { stat: template.stat, value: template.value },
  };
}

// -----------------------------------------------------------------
// Start Adventure
// -----------------------------------------------------------------

export function startAdventure(state: GameState): GameState {
  const newState = structuredClone(state);
  const son = newState.son;
  const level = son.stats.level;
  const now = Date.now();

  // Find duration and battle count for this level
  const durationEntry = ADVENTURE_DURATION_TABLE.find(
    e => level >= e.minLevel && level <= e.maxLevel
  ) ?? ADVENTURE_DURATION_TABLE[0];

  const totalBattles = randInt(durationEntry.battles[0], durationEntry.battles[1]);

  // Pre-calculate all battle results
  const battleResults = generateBattleResults(newState, totalBattles);

  // Calculate total rewards and exp
  let totalRewards: Partial<Record<MaterialKey, number>> = {};
  let totalExp = 0;
  let bookRewards: Book[] = [];
  let sonHp = son.stats.hp;
  let failed = false;

  for (let i = 0; i < battleResults.length; i++) {
    const battle = battleResults[i];
    totalExp += battle.expGained;

    // Accumulate rewards
    for (const [key, val] of Object.entries(battle.rewards)) {
      const mk = key as MaterialKey;
      totalRewards[mk] = (totalRewards[mk] ?? 0) + (val ?? 0);
    }

    // Accumulate book drops
    if (battle.bookDrop) {
      bookRewards.push(battle.bookDrop);
    }

    // Apply HP loss
    sonHp -= battle.hpLost;
    if (sonHp <= 0) {
      failed = true;
      // Reduce rewards by 50% on failure
      for (const key of Object.keys(totalRewards)) {
        const mk = key as MaterialKey;
        totalRewards[mk] = Math.ceil((totalRewards[mk] ?? 0) * 0.5);
      }
      break;
    }
  }

  const adventure: AdventureState = {
    active: true,
    startTime: now,
    duration: durationEntry.durationMs,
    letters: [],
    nextLetterAt: now + randInt(5000, 15000), // first letter comes early
    battleResults,
    totalBattles,
    currentBattle: 0,
    rewards: totalRewards,
    bookRewards,
    expGained: totalExp,
    failed,
    sonHpPercent: failed ? 0 : Math.max(0, (sonHp / son.stats.maxHp) * 100),
  };

  // Send initial letter (sometimes with forest/camp image)
  const startLetter: Letter = {
    id: uid(),
    text: pick(LETTER_TEMPLATES.start),
    timestamp: now,
    hpPercent: 100,
    battlesCompleted: 0,
  };
  if (Math.random() < 0.6) {
    startLetter.imageUrl = pickAdventureImage(['forest', 'camp']);
  }
  adventure.letters.push(startLetter);

  // Update son state
  son.isHome = false;
  son.currentAction = SonAction.ADVENTURING;
  son.actionTimer = 0;

  newState.adventure = adventure;
  return newState;
}

// -----------------------------------------------------------------
// Process adventure tick (called during game tick)
// -----------------------------------------------------------------

export function processAdventureTick(state: GameState): GameState {
  if (!state.adventure?.active) return state;

  const newState = structuredClone(state);
  const adventure = newState.adventure!;
  const now = Date.now();

  // Check if adventure time is over
  const elapsed = now - adventure.startTime;
  if (elapsed >= adventure.duration) {
    return completeAdventure(newState);
  }

  // Generate letters based on progress
  if (now >= adventure.nextLetterAt) {
    const progress = elapsed / adventure.duration;
    const battlesCompleted = Math.floor(progress * adventure.totalBattles);

    if (battlesCompleted > adventure.currentBattle) {
      // New battle result to report
      const battleIdx = Math.min(battlesCompleted - 1, adventure.battleResults.length - 1);
      const battle = adventure.battleResults[battleIdx];
      const letter = generateLetter(battle, adventure, battlesCompleted);
      adventure.letters.push(letter);
      newState.letters.push(letter);
      adventure.currentBattle = battlesCompleted;
    }

    adventure.nextLetterAt = now + randInt(
      ADVENTURE_LETTER_INTERVAL_MIN,
      ADVENTURE_LETTER_INTERVAL_MAX
    );
  }

  // Near the end, send returning letter
  const timeRemaining = adventure.duration - elapsed;
  if (
    timeRemaining < 15000 &&
    !adventure.letters.some(l => l.text.includes('집으로') || l.text.includes('끝'))
  ) {
    const letter: Letter = {
      id: uid(),
      text: pick(LETTER_TEMPLATES.returning),
      timestamp: now,
      hpPercent: adventure.sonHpPercent,
      battlesCompleted: adventure.totalBattles,
      imageUrl: pickAdventureImage(['return', 'home']),
    };
    adventure.letters.push(letter);
    newState.letters.push(letter);
  }

  // Limit stored letters to last 50 to prevent localStorage bloat
  if (newState.letters.length > 50) {
    newState.letters = newState.letters.slice(-50);
  }

  return newState;
}

// -----------------------------------------------------------------
// Complete adventure - son returns home
// -----------------------------------------------------------------

function completeAdventure(state: GameState): GameState {
  const adventure = state.adventure!;
  const son = state.son;

  // Save adventure results for ReturnModal display before clearing
  state.lastAdventureResult = {
    battleResults: adventure.battleResults,
    totalBattles: adventure.totalBattles,
    rewards: { ...adventure.rewards },
    bookRewards: adventure.bookRewards ?? [],
    expGained: adventure.expGained,
    failed: adventure.failed,
    sonHpPercent: adventure.sonHpPercent,
  };

  // Apply rewards to inventory
  for (const [key, val] of Object.entries(adventure.rewards)) {
    const mk = key as MaterialKey;
    state.inventory.materials[mk] = (state.inventory.materials[mk] ?? 0) + (val ?? 0);
  }

  // Apply book rewards to inventory
  for (const book of adventure.bookRewards ?? []) {
    state.inventory.books.push(book);
  }

  // Apply EXP
  son.stats.exp += adventure.expGained;

  // Update son state
  son.isHome = true;
  son.currentAction = SonAction.IDLE;
  son.actionTimer = 0;
  son.tempBuffs = []; // clear adventure buffs
  son.isInjured = adventure.failed;

  // Reset dialogue state for return-related dialogues
  if (son.dialogueState) {
    son.dialogueState.ticksSinceReturn = 0;
    son.dialogueState.cooldowns.emotion = 0; // allow immediate emotion dialogue on return
  }

  if (adventure.failed) {
    son.stats.hp = 1; // return with 1 HP on failure
    son.stats.hunger = Math.max(10, son.stats.hunger - 30);
  } else {
    // Successful return: come back at 25~40% of maxHP
    // Scales properly with level so recovery time stays manageable
    const hpPercent = randInt(25, 40) / 100;
    son.stats.hp = Math.max(1, Math.floor(son.stats.maxHp * hpPercent));
    son.stats.hunger = Math.max(20, son.stats.hunger - 30);
  }

  // Reduce durability on equipped gear
  const hasBossBattle = adventure.battleResults.some(r => r.isBoss);
  const equipSlots: (keyof typeof son.equipment)[] = ['weapon', 'armor', 'accessory'];
  for (const slot of equipSlots) {
    const eq = son.equipment[slot];
    if (!eq) continue;
    let loss = DURABILITY_LOSS_PER_ADVENTURE;
    if (hasBossBattle) loss += DURABILITY_LOSS_BOSS_BONUS;
    if (adventure.failed) loss = Math.ceil(loss * 1.5);
    eq.durability = Math.max(0, eq.durability - loss);
  }

  // Clear adventure
  state.adventure = null;

  return state;
}

// -----------------------------------------------------------------
// Generate battle results
// -----------------------------------------------------------------

function generateBattleResults(state: GameState, totalBattles: number): BattleResult[] {
  const son = state.son;
  const level = son.stats.level;

  // Calculate son's combat power
  const combatPower = calculateCombatPower(state);

  // Get enemy power range for this level
  const enemyEntry = ENEMY_POWER_TABLE.find(
    e => level >= e.minLevel && level <= e.maxLevel
  ) ?? ENEMY_POWER_TABLE[0];

  const results: BattleResult[] = [];

  for (let i = 0; i < totalBattles; i++) {
    const isLastBattle = i === totalBattles - 1;
    const isBoss = isLastBattle && Math.random() < enemyEntry.bossChance;

    let enemyPower = randInt(enemyEntry.enemyPower[0], enemyEntry.enemyPower[1]);
    if (isBoss) enemyPower = Math.floor(enemyPower * 1.8);

    const result = resolveBattle(combatPower, enemyPower, isBoss, level, son.stats.maxHp);
    results.push(result);
  }

  return results;
}

function resolveBattle(
  combatPower: number,
  enemyPower: number,
  isBoss: boolean,
  level: number,
  maxHp: number
): BattleResult {
  let outcome: BattleResult['outcome'];
  let hpLostPercent: number;
  let rewardMultiplier: number;

  if (combatPower > enemyPower * 1.5) {
    outcome = 'overwhelming';
    hpLostPercent = randInt(0, 5) / 100;
    rewardMultiplier = 1.2;
  } else if (combatPower > enemyPower) {
    outcome = 'victory';
    hpLostPercent = randInt(5, 15) / 100;
    rewardMultiplier = 1.0;
  } else if (combatPower > enemyPower * 0.7) {
    outcome = 'narrow';
    hpLostPercent = randInt(15, 30) / 100;
    rewardMultiplier = 0.8;
  } else {
    outcome = 'defeat';
    hpLostPercent = randInt(30, 50) / 100;
    rewardMultiplier = 0.3;
  }

  if (isBoss) rewardMultiplier *= 2.5;

  const hpLost = Math.floor(maxHp * hpLostPercent);
  const expGained = calculateBattleExp(outcome, level);
  const rewards = generateBattleLoot(level, rewardMultiplier, isBoss, outcome);
  const bookDrop = generateBookDrop(level, isBoss, outcome);

  return { outcome, isBoss, hpLost, expGained, rewards, bookDrop };
}

// -----------------------------------------------------------------
// Combat power calculation
// -----------------------------------------------------------------

export function calculateCombatPower(state: GameState): number {
  const son = state.son;
  const stats = son.stats;

  // Base stats
  let str = stats.str;
  let def = stats.def;
  let agi = stats.agi;
  let int = stats.int;

  // Equipment contributions
  const slots: (keyof typeof son.equipment)[] = ['weapon', 'armor', 'accessory'];
  for (const slot of slots) {
    const eq = son.equipment[slot];
    if (!eq) continue;
    const finalStats = getEquipmentFinalStats(eq);
    str += finalStats.str ?? 0;
    def += finalStats.def ?? 0;
    agi += finalStats.agi ?? 0;
    int += finalStats.int ?? 0;
  }

  // Temp buffs
  for (const buff of son.tempBuffs) {
    if (buff.stat === 'all') {
      str += buff.value;
      def += buff.value;
      agi += buff.value;
      int += buff.value;
    } else if (buff.stat === 'str') str += buff.value;
    else if (buff.stat === 'def') def += buff.value;
    else if (buff.stat === 'agi') agi += buff.value;
    else if (buff.stat === 'int') int += buff.value;
  }

  return str * 2 + def * 1.5 + agi * 1.2 + int * 0.8;
}

function getEquipmentFinalStats(eq: Equipment): Record<string, number> {
  const gradeMultiplier = GRADE_MULTIPLIERS[eq.grade];
  const enhanceEntry = ENHANCEMENT_TABLE.find(e => e.level === eq.enhanceLevel);
  const enhanceBonus = enhanceEntry ? enhanceEntry.statBonus : 0;

  // Durability scaling: 0 durability = 0 stats, below threshold = proportional reduction
  let durabilityScale = 1;
  if (eq.durability <= 0) {
    durabilityScale = 0;
  } else if (eq.durability < DURABILITY_PENALTY_THRESHOLD) {
    durabilityScale = eq.durability / DURABILITY_PENALTY_THRESHOLD;
  }

  const result: Record<string, number> = {};
  for (const [stat, val] of Object.entries(eq.baseStats)) {
    if (val !== undefined) {
      result[stat] = Math.floor(val * gradeMultiplier * (1 + enhanceBonus) * durabilityScale);
    }
  }
  return result;
}

// -----------------------------------------------------------------
// Battle EXP
// -----------------------------------------------------------------

function calculateBattleExp(outcome: BattleResult['outcome'], level: number): number {
  const enemyLevel = Math.max(1, level + randInt(-1, 1));
  switch (outcome) {
    case 'overwhelming': return 15 + enemyLevel * 3;
    case 'victory':      return 20 + enemyLevel * 4;
    case 'narrow':       return 25 + enemyLevel * 5;
    case 'defeat':       return 5 + enemyLevel * 1;
  }
}

// -----------------------------------------------------------------
// Loot generation
// -----------------------------------------------------------------

function generateBattleLoot(
  level: number,
  multiplier: number,
  isBoss: boolean,
  outcome: BattleResult['outcome']
): Partial<Record<MaterialKey, number>> {
  const loot: Partial<Record<MaterialKey, number>> = {};

  // Level scaling for gold
  const levelBonus = 1 + (level - 1) * 0.15;

  // Basic loot table
  for (const entry of LOOT_TABLE) {
    if (Math.random() < entry.chance * multiplier) {
      const amount = Math.ceil(randInt(entry.min, entry.max) * levelBonus);
      loot[entry.item] = (loot[entry.item] ?? 0) + amount;
    }
  }

  // Herb drop (random color)
  if (Math.random() < HERB_DROP_CHANCE * multiplier) {
    const herb = pick(HERB_TYPES);
    loot[herb] = (loot[herb] ?? 0) + randInt(HERB_DROP_MIN, HERB_DROP_MAX);
  }

  // Seed drop (universal seed)
  if (Math.random() < SEED_DROP_CHANCE * multiplier) {
    loot.seed = (loot.seed ?? 0) + randInt(1, 2);
  }

  // Rare loot (boss / special)
  if (isBoss) {
    if (Math.random() < RARE_LOOT.mithril.chance) {
      loot.mithril = (loot.mithril ?? 0) + 1;
    }
    if (Math.random() < RARE_LOOT.gems.chance) {
      loot.gems = (loot.gems ?? 0) + 1;
    }
    if (level >= (RARE_LOOT.specialOre.minLevel ?? 0) && Math.random() < RARE_LOOT.specialOre.chance) {
      loot.specialOre = (loot.specialOre ?? 0) + 1;
    }
  }

  // Enhancement stones from any victory at Lv5+
  if (
    level >= (RARE_LOOT.enhancementStones.minLevel ?? 0) &&
    outcome !== 'defeat' &&
    Math.random() < RARE_LOOT.enhancementStones.chance
  ) {
    loot.enhancementStones = (loot.enhancementStones ?? 0) + 1;
  }

  return loot;
}

// -----------------------------------------------------------------
// Adventure image selection helper
// -----------------------------------------------------------------

function pickAdventureImage(sceneKeywords: string[]): string | undefined {
  // Try to find an image matching any of the scene keywords
  for (const keyword of sceneKeywords) {
    const matches = ADVENTURE_IMAGES.filter(img =>
      img.scenes.includes(keyword)
    );
    if (matches.length > 0) return pick(matches).url;
  }
  // Fallback: random adventure image
  return pick(ADVENTURE_IMAGES).url;
}

// -----------------------------------------------------------------
// Generate letter from battle result
// -----------------------------------------------------------------

function generateLetter(
  battle: BattleResult,
  adventure: AdventureState,
  battlesCompleted: number
): Letter {
  let text: string;
  let imageUrl: string | undefined;

  // About 60% of letters should have an image attached
  const shouldAttachImage = Math.random() < 0.6;

  if (battle.isBoss) {
    text = pick(LETTER_TEMPLATES.boss);
    if (shouldAttachImage) imageUrl = pickAdventureImage(['boss', 'danger', 'monster']);
  } else if (adventure.sonHpPercent < 30) {
    text = pick(LETTER_TEMPLATES.lowHp);
    if (shouldAttachImage) imageUrl = pickAdventureImage(['injured', 'hurt']);
  } else {
    text = pick(LETTER_TEMPLATES[battle.outcome]);
    if (shouldAttachImage) {
      if (battle.outcome === 'overwhelming' || battle.outcome === 'victory') {
        imageUrl = pickAdventureImage(['victory', 'slime', 'goblin']);
      } else if (battle.outcome === 'narrow') {
        imageUrl = pickAdventureImage(['wolf', 'forest']);
      } else if (battle.outcome === 'defeat') {
        imageUrl = pickAdventureImage(['injured']);
      }
    }
  }

  // Occasionally mention treasure
  if (Math.random() < 0.2 && battle.outcome !== 'defeat') {
    text += ' ' + pick(LETTER_TEMPLATES.treasure);
    if (shouldAttachImage) imageUrl = pickAdventureImage(['treasure', 'loot']);
  }

  const letter: Letter = {
    id: uid(),
    text,
    timestamp: Date.now(),
    hpPercent: adventure.sonHpPercent,
    battlesCompleted,
  };
  if (imageUrl) letter.imageUrl = imageUrl;

  return letter;
}
