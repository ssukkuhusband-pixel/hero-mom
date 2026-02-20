// ============================================================
// Hero Mom - All Game Constants, Recipes, and Data Tables
// ============================================================

import type {
  EquipmentRecipe,
  FoodRecipe,
  PotionRecipe,
  EnhancementLevel,
  LevelUpEntry,
  GameState,
  MaterialKey,
  CropType,
  EquipmentGrade,
  EquipmentSlot,
  EquipmentStats,
  StatType,
} from './types';
import { SonAction } from './types';

// --- Son Behavior ---

export const SON_TICK_INTERVAL = 2000; // 2 seconds in ms
export const HUNGER_DECAY_PER_MINUTE = 3;
export const HUNGER_DECAY_PER_TICK = HUNGER_DECAY_PER_MINUTE / 30; // ~0.1 per 2s tick (60s / 2s = 30 ticks/min)

export const DEPARTURE_HUNGER_THRESHOLD = 80;
export const DEPARTURE_HP_THRESHOLD = 0.8; // 80% of maxHP

// Action durations in seconds (min ~ max range, randomly chosen)
export const ACTION_DURATIONS: Record<string, [number, number]> = {
  [SonAction.SLEEPING]: [8, 12],
  [SonAction.EATING]: [5, 7],
  [SonAction.TRAINING]: [6, 10],
  [SonAction.READING]: [7, 10],
  [SonAction.RESTING]: [5, 8],
  [SonAction.DRINKING_POTION]: [3, 4],
  [SonAction.DEPARTING]: [3, 4],
};

// Action effects (HP restore is now per-tick, not lump sum)
export const SLEEP_HP_PER_TICK = 3;  // 2초마다 3 HP 회복 (레벨 비례 추가는 sonAI에서)
export const REST_HP_PER_TICK = 2;   // 2초마다 2 HP 회복

// Legacy (kept for reference, no longer used)
export const SLEEP_HP_RESTORE = 15;
export const REST_HP_RESTORE = 5;
export const TRAINING_EXP_MIN = 8;
export const TRAINING_EXP_MAX = 12;

// Departure behavior: even when conditions are met, son may stay to train/read first
export const DEPARTURE_SKIP_CHANCE = 0.6; // 60% chance to do something else before leaving

// --- Dialogue System ---

export const DIALOGUE_TRIGGER_CHANCE: Record<string, number> = {
  emotion: 0.08,
  bedtime: 0.25,
  daily: 0.05,
  request: 0.06,
};

export const DIALOGUE_COOLDOWNS: Record<string, number> = {
  emotion: 60,   // game seconds
  bedtime: 120,
  daily: 40,
  request: 120,
};

export const DIALOGUE_AUTO_DISMISS = 20; // game seconds before auto-dismiss
export const MAX_ACTIVE_QUESTS = 2;
export const MOOD_DECAY_INTERVAL = 120; // game seconds per mood decay

// --- Adventure ---

export const ADVENTURE_LETTER_INTERVAL_MIN = 30_000; // 30s in ms
export const ADVENTURE_LETTER_INTERVAL_MAX = 60_000; // 60s in ms

// Adventure duration by level range (in ms)
export const ADVENTURE_DURATION_TABLE: { minLevel: number; maxLevel: number; durationMs: number; battles: [number, number] }[] = [
  { minLevel: 1,  maxLevel: 3,  durationMs: 180_000, battles: [2, 3] },
  { minLevel: 4,  maxLevel: 7,  durationMs: 210_000, battles: [3, 4] },
  { minLevel: 8,  maxLevel: 12, durationMs: 240_000, battles: [4, 5] },
  { minLevel: 13, maxLevel: 17, durationMs: 270_000, battles: [5, 6] },
  { minLevel: 18, maxLevel: 20, durationMs: 300_000, battles: [6, 7] },
];

// Enemy combat power by level range
export const ENEMY_POWER_TABLE: { minLevel: number; maxLevel: number; enemyPower: [number, number]; bossChance: number }[] = [
  { minLevel: 1,  maxLevel: 3,  enemyPower: [10, 25],   bossChance: 0.10 },
  { minLevel: 4,  maxLevel: 7,  enemyPower: [25, 50],   bossChance: 0.15 },
  { minLevel: 8,  maxLevel: 12, enemyPower: [50, 90],   bossChance: 0.20 },
  { minLevel: 13, maxLevel: 17, enemyPower: [90, 150],  bossChance: 0.25 },
  { minLevel: 18, maxLevel: 20, enemyPower: [150, 250], bossChance: 0.30 },
];

// --- Durability System ---

export const DURABILITY_MAX = 100;
export const DURABILITY_LOSS_PER_ADVENTURE = 15;
export const DURABILITY_LOSS_BOSS_BONUS = 5;
export const DURABILITY_PENALTY_THRESHOLD = 30; // below this, stats decrease

// --- Maintenance Recipes (per equipment slot) ---

export const MAINTENANCE_RECIPES: Record<EquipmentSlot, { materials: Partial<Record<MaterialKey, number>>; restore: number }> = {
  weapon:    { materials: { ironOre: 1, wood: 1, gold: 10 }, restore: 40 },
  armor:     { materials: { leather: 1, ironOre: 1, gold: 10 }, restore: 40 },
  accessory: { materials: { gems: 1, gold: 15 }, restore: 40 },
};

// --- Mom's Part-time Job System ---
export interface JobLevelData {
  level: number;
  goldReward: number;
  cooldownSeconds: number;
  expRequired: number;
}

export const JOB_LEVEL_TABLE: JobLevelData[] = [
  { level: 1,  goldReward: 3,  cooldownSeconds: 5,  expRequired: 5 },
  { level: 2,  goldReward: 4,  cooldownSeconds: 5,  expRequired: 8 },
  { level: 3,  goldReward: 5,  cooldownSeconds: 5,  expRequired: 12 },
  { level: 4,  goldReward: 6,  cooldownSeconds: 5,  expRequired: 17 },
  { level: 5,  goldReward: 8,  cooldownSeconds: 4,  expRequired: 23 },
  { level: 6,  goldReward: 9,  cooldownSeconds: 4,  expRequired: 30 },
  { level: 7,  goldReward: 10, cooldownSeconds: 4,  expRequired: 38 },
  { level: 8,  goldReward: 12, cooldownSeconds: 4,  expRequired: 47 },
  { level: 9,  goldReward: 13, cooldownSeconds: 3,  expRequired: 57 },
  { level: 10, goldReward: 15, cooldownSeconds: 3,  expRequired: 68 },
  { level: 11, goldReward: 17, cooldownSeconds: 3,  expRequired: 80 },
  { level: 12, goldReward: 19, cooldownSeconds: 3,  expRequired: 93 },
  { level: 13, goldReward: 21, cooldownSeconds: 3,  expRequired: 107 },
  { level: 14, goldReward: 23, cooldownSeconds: 2,  expRequired: 122 },
  { level: 15, goldReward: 25, cooldownSeconds: 2,  expRequired: 999 },
];

export function getJobLevelData(level: number): JobLevelData {
  return JOB_LEVEL_TABLE.find(j => j.level === level) ?? JOB_LEVEL_TABLE[JOB_LEVEL_TABLE.length - 1];
}

// --- Equipment Refining System ---
export interface RefiningLevelData {
  level: number;
  expRequired: number;
}

export const REFINING_LEVEL_TABLE: RefiningLevelData[] = [
  { level: 1,  expRequired: 3 },
  { level: 2,  expRequired: 5 },
  { level: 3,  expRequired: 8 },
  { level: 4,  expRequired: 12 },
  { level: 5,  expRequired: 17 },
  { level: 6,  expRequired: 23 },
  { level: 7,  expRequired: 30 },
  { level: 8,  expRequired: 38 },
  { level: 9,  expRequired: 47 },
  { level: 10, expRequired: 57 },
  { level: 11, expRequired: 68 },
  { level: 12, expRequired: 80 },
  { level: 13, expRequired: 93 },
  { level: 14, expRequired: 107 },
  { level: 15, expRequired: 122 },
  { level: 16, expRequired: 140 },
  { level: 17, expRequired: 160 },
  { level: 18, expRequired: 180 },
  { level: 19, expRequired: 200 },
  { level: 20, expRequired: 999 },
];

export const REFINING_COST = 3;

export const REFINING_GRADE_RATES: { minLevel: number; maxLevel: number; rates: Record<EquipmentGrade, number> }[] = [
  { minLevel: 1,  maxLevel: 4,  rates: { common: 0.80, uncommon: 0.20, rare: 0.00, epic: 0.00 } },
  { minLevel: 5,  maxLevel: 9,  rates: { common: 0.60, uncommon: 0.30, rare: 0.10, epic: 0.00 } },
  { minLevel: 10, maxLevel: 14, rates: { common: 0.40, uncommon: 0.35, rare: 0.20, epic: 0.05 } },
  { minLevel: 15, maxLevel: 99, rates: { common: 0.20, uncommon: 0.35, rare: 0.30, epic: 0.15 } },
];

export const REFINING_SLOT_MULTIPLIERS: Record<EquipmentSlot, Partial<Record<string, number>>> = {
  weapon:    { str: 1.5, agi: 0.3 },
  armor:     { def: 1.5, hp: 3.0 },
  accessory: { int: 0.8, agi: 0.6, hp: 1.5 },
};

export const EQUIPMENT_NAMES: Record<EquipmentSlot, { maxLevel: number; name: string }[]> = {
  weapon: [
    { maxLevel: 5,  name: '나무 검' },
    { maxLevel: 10, name: '철 검' },
    { maxLevel: 15, name: '강철 검' },
    { maxLevel: 20, name: '마법 검' },
    { maxLevel: 25, name: '미스릴 검' },
    { maxLevel: 30, name: '전설의 검' },
  ],
  armor: [
    { maxLevel: 5,  name: '가죽 갑옷' },
    { maxLevel: 10, name: '철 갑옷' },
    { maxLevel: 15, name: '강철 갑옷' },
    { maxLevel: 20, name: '마법 갑옷' },
    { maxLevel: 25, name: '미스릴 갑옷' },
    { maxLevel: 30, name: '전설의 갑옷' },
  ],
  accessory: [
    { maxLevel: 5,  name: '부적' },
    { maxLevel: 10, name: '반지' },
    { maxLevel: 15, name: '팔찌' },
    { maxLevel: 20, name: '마법 목걸이' },
    { maxLevel: 25, name: '빛나는 펜던트' },
    { maxLevel: 30, name: '전설의 목걸이' },
  ],
};

export const GRADE_PREFIX: Record<EquipmentGrade, string> = {
  common: '',
  uncommon: '고급 ',
  rare: '희귀한 ',
  epic: '영웅의 ',
};

// --- Farm Level System ---
export interface FarmLevelData {
  level: number;
  expRequired: number;
  cropRates: Record<CropType, number>;
}

export const FARM_LEVEL_TABLE: FarmLevelData[] = [
  { level: 1,  expRequired: 5,  cropRates: { wheat: 0.40, potato: 0.30, carrot: 0.30, apple: 0, redHerb: 0, blueHerb: 0, yellowHerb: 0 } },
  { level: 2,  expRequired: 8,  cropRates: { wheat: 0.40, potato: 0.30, carrot: 0.30, apple: 0, redHerb: 0, blueHerb: 0, yellowHerb: 0 } },
  { level: 3,  expRequired: 12, cropRates: { wheat: 0.30, potato: 0.25, carrot: 0.25, apple: 0.10, redHerb: 0.10, blueHerb: 0, yellowHerb: 0 } },
  { level: 4,  expRequired: 17, cropRates: { wheat: 0.30, potato: 0.25, carrot: 0.25, apple: 0.10, redHerb: 0.10, blueHerb: 0, yellowHerb: 0 } },
  { level: 5,  expRequired: 23, cropRates: { wheat: 0.20, potato: 0.15, carrot: 0.15, apple: 0.15, redHerb: 0.15, blueHerb: 0.10, yellowHerb: 0.10 } },
  { level: 6,  expRequired: 30, cropRates: { wheat: 0.20, potato: 0.15, carrot: 0.15, apple: 0.15, redHerb: 0.15, blueHerb: 0.10, yellowHerb: 0.10 } },
  { level: 7,  expRequired: 38, cropRates: { wheat: 0.13, potato: 0.13, carrot: 0.13, apple: 0.13, redHerb: 0.16, blueHerb: 0.16, yellowHerb: 0.16 } },
  { level: 8,  expRequired: 47, cropRates: { wheat: 0.13, potato: 0.13, carrot: 0.13, apple: 0.13, redHerb: 0.16, blueHerb: 0.16, yellowHerb: 0.16 } },
  { level: 9,  expRequired: 57, cropRates: { wheat: 0.12, potato: 0.12, carrot: 0.12, apple: 0.13, redHerb: 0.17, blueHerb: 0.17, yellowHerb: 0.17 } },
  { level: 10, expRequired: 999, cropRates: { wheat: 0.12, potato: 0.12, carrot: 0.12, apple: 0.13, redHerb: 0.17, blueHerb: 0.17, yellowHerb: 0.17 } },
];

export function getFarmLevelData(level: number): FarmLevelData {
  return FARM_LEVEL_TABLE.find(f => f.level === level) ?? FARM_LEVEL_TABLE[FARM_LEVEL_TABLE.length - 1];
}

export const UNIVERSAL_GROWTH_TIME = 30;

// --- Smelting Output (equipment → refining stones) ---

export const SMELTING_OUTPUT: Record<EquipmentGrade, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 5,
};

export function getSmeltingStones(grade: EquipmentGrade, equipLevel: number): number {
  const base = SMELTING_OUTPUT[grade];
  const levelBonus = Math.max(0, Math.floor((equipLevel - 10) / 3));
  return base + levelBonus;
}

// --- Equipment Recipes (base tier only, others via promotion) ---

export const EQUIPMENT_RECIPES: EquipmentRecipe[] = [
  {
    id: 'wooden_sword',
    name: '나무 검',
    slot: 'weapon',
    grade: 'common',
    baseStats: { str: 3 },
    materials: { wood: 3, gold: 10 },
    unlockLevel: 0,
  },
  {
    id: 'leather_armor',
    name: '가죽 갑옷',
    slot: 'armor',
    grade: 'common',
    baseStats: { def: 3 },
    materials: { leather: 3, gold: 15 },
    unlockLevel: 0,
  },
  {
    id: 'amulet',
    name: '부적',
    slot: 'accessory',
    grade: 'common',
    baseStats: { int: 3 },
    materials: { redHerb: 2, gems: 1, gold: 20 },
    unlockLevel: 0,
  },
  {
    id: 'agility_ring',
    name: '민첩의 반지',
    slot: 'accessory',
    grade: 'common',
    baseStats: { agi: 5 },
    materials: { gems: 2, gold: 35 },
    unlockLevel: 5,
  },
  {
    id: 'life_pendant',
    name: '생명의 펜던트',
    slot: 'accessory',
    grade: 'common',
    baseStats: { hp: 30, def: 2 },
    materials: { gems: 3, redHerb: 3, gold: 60 },
    unlockLevel: 12,
  },
];

// --- Food Recipes ---

export const FOOD_RECIPES: FoodRecipe[] = [
  {
    id: 'bread',
    name: '빵',
    hungerRestore: 20,
    materials: { wheat: 2 },
    unlockLevel: 0,
  },
  {
    id: 'vegetable_soup',
    name: '야채 수프',
    hungerRestore: 35,
    hpRestore: 5,
    materials: { potato: 1, carrot: 1 },
    unlockLevel: 0,
  },
  {
    id: 'meat_stew',
    name: '고기 스튜',
    hungerRestore: 50,
    tempBuff: { stat: 'str', value: 2 },
    materials: { meat: 2, potato: 1 },
    unlockLevel: 8,
  },
  {
    id: 'fruit_pie',
    name: '과일 파이',
    hungerRestore: 30,
    hpRestore: 15,
    materials: { apple: 2, wheat: 1 },
    unlockLevel: 5,
  },
  {
    id: 'hero_lunchbox',
    name: '영웅의 도시락',
    hungerRestore: 70,
    tempBuff: { stat: 'all', value: 1 },
    materials: { meat: 2, wheat: 2, apple: 1 },
    unlockLevel: 8,
  },
];

// --- Potion Recipes ---

export const POTION_RECIPES: PotionRecipe[] = [
  {
    id: 'health_potion',
    name: '체력 포션',
    effect: 'instant',
    stat: 'hp',
    value: 30,
    materials: { redHerb: 2 },
    unlockLevel: 3,
  },
  {
    id: 'strength_elixir',
    name: '힘의 영약',
    effect: 'buff',
    stat: 'str',
    value: 5,
    materials: { blueHerb: 2, monsterTeeth: 1 },
    unlockLevel: 3,
  },
  {
    id: 'guardian_elixir',
    name: '수호의 영약',
    effect: 'buff',
    stat: 'def',
    value: 5,
    materials: { yellowHerb: 2, monsterShell: 1 },
    unlockLevel: 5,
  },
  {
    id: 'swiftness_elixir',
    name: '신속의 영약',
    effect: 'buff',
    stat: 'agi',
    value: 5,
    materials: { blueHerb: 1, yellowHerb: 1 },
    unlockLevel: 5,
  },
  {
    id: 'wisdom_elixir',
    name: '지혜의 영약',
    effect: 'buff',
    stat: 'int',
    value: 5,
    materials: { redHerb: 1, blueHerb: 1, gems: 1 },
    unlockLevel: 8,
  },
  {
    id: 'universal_elixir',
    name: '만능 비약',
    effect: 'buff',
    stat: 'all',
    value: 3,
    materials: { redHerb: 2, blueHerb: 2, yellowHerb: 2 },
    unlockLevel: 8,
  },
];

// --- Crop Data ---

export const CROP_DATA: Record<CropType, { growthTimeSeconds: number; yieldMin: number; yieldMax: number; produceKey: MaterialKey }> = {
  wheat:      { growthTimeSeconds: 30, yieldMin: 2, yieldMax: 3, produceKey: 'wheat' },
  potato:     { growthTimeSeconds: 30, yieldMin: 2, yieldMax: 3, produceKey: 'potato' },
  carrot:     { growthTimeSeconds: 30, yieldMin: 2, yieldMax: 3, produceKey: 'carrot' },
  apple:      { growthTimeSeconds: 30, yieldMin: 1, yieldMax: 2, produceKey: 'apple' },
  redHerb:    { growthTimeSeconds: 30, yieldMin: 1, yieldMax: 2, produceKey: 'redHerb' },
  blueHerb:   { growthTimeSeconds: 30, yieldMin: 1, yieldMax: 2, produceKey: 'blueHerb' },
  yellowHerb: { growthTimeSeconds: 30, yieldMin: 1, yieldMax: 2, produceKey: 'yellowHerb' },
};

// --- Level Up Table ---

export const LEVEL_TABLE: LevelUpEntry[] = [
  { level: 2,  expRequired: 50,   hpGain: 10, statGains: { str: 1, def: 1, agi: 0, int: 0 } },
  { level: 3,  expRequired: 80,   hpGain: 10, statGains: { str: 1, def: 0, agi: 1, int: 0 } },
  { level: 4,  expRequired: 120,  hpGain: 10, statGains: { str: 0, def: 1, agi: 0, int: 1 } },
  { level: 5,  expRequired: 170,  hpGain: 15, statGains: { str: 2, def: 1, agi: 0, int: 0 } },
  { level: 6,  expRequired: 230,  hpGain: 15, statGains: { str: 1, def: 0, agi: 1, int: 1 } },
  { level: 7,  expRequired: 300,  hpGain: 15, statGains: { str: 0, def: 2, agi: 1, int: 0 } },
  { level: 8,  expRequired: 380,  hpGain: 15, statGains: { str: 1, def: 1, agi: 1, int: 1 } },
  { level: 9,  expRequired: 470,  hpGain: 20, statGains: { str: 2, def: 2, agi: 0, int: 0 } },
  { level: 10, expRequired: 570,  hpGain: 20, statGains: { str: 1, def: 1, agi: 1, int: 1 } },
  { level: 11, expRequired: 700,  hpGain: 20, statGains: { str: 2, def: 0, agi: 2, int: 0 } },
  { level: 12, expRequired: 850,  hpGain: 20, statGains: { str: 0, def: 2, agi: 0, int: 2 } },
  { level: 13, expRequired: 1020, hpGain: 25, statGains: { str: 2, def: 1, agi: 1, int: 0 } },
  { level: 14, expRequired: 1210, hpGain: 25, statGains: { str: 1, def: 2, agi: 0, int: 1 } },
  { level: 15, expRequired: 1420, hpGain: 25, statGains: { str: 2, def: 2, agi: 2, int: 2 } },
  { level: 16, expRequired: 1660, hpGain: 30, statGains: { str: 3, def: 0, agi: 2, int: 0 } },
  { level: 17, expRequired: 1930, hpGain: 30, statGains: { str: 0, def: 3, agi: 0, int: 2 } },
  { level: 18, expRequired: 2230, hpGain: 30, statGains: { str: 2, def: 2, agi: 2, int: 0 } },
  { level: 19, expRequired: 2560, hpGain: 35, statGains: { str: 2, def: 2, agi: 2, int: 2 } },
  { level: 20, expRequired: 2920, hpGain: 40, statGains: { str: 3, def: 3, agi: 3, int: 3 } },
];

// --- Enhancement Table ---

export const ENHANCEMENT_TABLE: EnhancementLevel[] = [
  { level: 1, stonesRequired: 1, goldCost: 20,  successRate: 1.00, statBonus: 0.10 },
  { level: 2, stonesRequired: 2, goldCost: 40,  successRate: 0.90, statBonus: 0.20 },
  { level: 3, stonesRequired: 3, goldCost: 70,  successRate: 0.75, statBonus: 0.35 },
  { level: 4, stonesRequired: 4, goldCost: 110, successRate: 0.55, statBonus: 0.55 },
  { level: 5, stonesRequired: 6, goldCost: 160, successRate: 0.35, statBonus: 0.80 },
];

// --- Grade Multipliers ---

export const GRADE_MULTIPLIERS: Record<EquipmentGrade, number> = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.7,
  epic: 2.2,
};

export const GRADE_COLORS: Record<EquipmentGrade, string> = {
  common: '#9CA3AF',    // gray
  uncommon: '#22C55E',  // green
  rare: '#3B82F6',      // blue
  epic: '#A855F7',      // purple
};

// --- Emoji Map ---

export const EMOJI_MAP: Record<string, string> = {
  // Materials
  gold: '\uD83E\uDE99',
  wood: '\uD83E\uDEB5',
  leather: '\uD83D\uDFE4',
  ironOre: '\u26CF\uFE0F',
  mithril: '\uD83D\uDC8E',
  gems: '\uD83D\uDCA0',
  enhancementStones: '\uD83D\uDD2E',
  specialOre: '\u2728',
  monsterTeeth: '\uD83E\uDDB7',
  monsterShell: '\uD83D\uDEE1\uFE0F',
  meat: '\uD83E\uDD69',
  wheat: '\uD83C\uDF3E',
  potato: '\uD83E\uDD54',
  carrot: '\uD83E\uDD55',
  apple: '\uD83C\uDF4E',
  redHerb: '\uD83C\uDF39',
  blueHerb: '\uD83D\uDC99',
  yellowHerb: '\uD83D\uDC9B',
  refiningStone: '⚗️',
  seed: '🌱',
  // Stats
  str: '\u2694\uFE0F',
  def: '\uD83D\uDEE1\uFE0F',
  agi: '\uD83D\uDCA8',
  int: '\uD83D\uDCD6',
  hp: '\u2764\uFE0F',
  hunger: '\uD83C\uDF56',
  exp: '\u2B50',
  level: '\uD83C\uDF1F',
  // Son actions
  sleeping: '\uD83D\uDCA4',
  eating: '\uD83C\uDF7D\uFE0F',
  training: '\u2694\uFE0F',
  reading: '\uD83D\uDCD6',
  resting: '\uD83D\uDE0C',
  potion: '\uD83E\uDDEA',
  departing: '\uD83D\uDEB6',
  adventuring: '\u2694\uFE0F',
  // Equipment slots
  weapon: '\u2694\uFE0F',
  armor: '\uD83D\uDEE1\uFE0F',
  accessory: '\uD83D\uDC8D',
  // Misc
  letter: '\u2709\uFE0F',
  farm: '\uD83C\uDF3E',
  book: '\uD83D\uDCD5',
  food: '\uD83C\uDF5E',
};

// --- Son Dialogues ---

export const SON_DIALOGUES = {
  eating: ['오! 맛있겠다!', '엄마(아빠) 요리 최고!', '냠냠 맛있다~'],
  eatingNoFood: ['배고프다...', '뭐 먹을 거 없나?', '꼬르륵...'],
  training: ['하앗! 오늘도 강해지자!', '이 정도면 드래곤도 이기겠지?', '얍! 얍! 얍!'],
  reading: ['음... 어려운데?', '오호, 이런 기술이?!', '글씨가 좀 작은데...'],
  sleeping: ['zzZ...', '5분만 더...', '쿨쿨...'],
  resting: ['잠깐 쉬자~', '영웅도 쉴 때가 필요해!', '음~ 편하다~'],
  departing: ['다녀올게요!', '오늘은 대박날 거야!', '걱정 마세요, 금방 올게요!'],
  injured: ['으으... 조금 아파', '괜찮아, 이 정도 쯤이야!', '약간... 쓰리네'],
  drinkingPotion: ['꿀꺽! 힘이 솟는다!', '맛은 좀 그렇지만...', '우웩... 근데 효과 좋다!'],
  idle: ['뭐하지~?', '심심한데...', '음~'],
};

// --- Adventure Letter Templates ---

export const LETTER_TEMPLATES = {
  start: [
    '출발했어요! 오늘 날씨가 좋아서 기분이 좋아요~',
    '모험 시작! 오늘은 뭘 만날까?',
  ],
  overwhelming: [
    '방금 고블린을 한 방에 쓰러뜨렸어요! 이 검 진짜 좋다!',
    '너무 쉬웠어요! 엄마(아빠)가 만들어준 장비 최고!',
  ],
  victory: [
    '슬라임 물리쳤어요. 좀 끈적해졌지만 괜찮아요!',
    '이겼어요! 좀 힘들었지만 해냈다!',
  ],
  narrow: [
    '으으... 오크가 생각보다 강했어요. 근데 이겼다!',
    '위험했어요... 근데 괜찮아요! 아직 멀쩡해요!',
  ],
  defeat: [
    '아야... 늑대한테 좀 당했어요. 괜찮으니 걱정 마세요.',
    '좀 아프지만 괜찮아요... 다음엔 이길 거예요!',
  ],
  lowHp: [
    '조금 힘든데... 집에 가면 엄마(아빠) 밥 먹고 싶어요.',
    '좀 많이 다쳤어요... 근데 아직 할 수 있어요!',
  ],
  treasure: [
    '반짝이는 게 있어서 주워왔어요! 뭔지는 모르겠지만...',
    '우와! 보물 상자 발견! 뭐가 들었을까?',
  ],
  boss: [
    '앞에 엄청 큰 게 있어요...! 가볼게요!',
    '보스 몬스터다...! 긴장되지만 해볼게요!',
  ],
  returning: [
    '모험 끝! 지금 집으로 돌아가는 중이에요~',
    '다 끝났어요! 얼른 집에 갈게요!',
  ],
};

// --- Adventure Scene Images ---
export const ADVENTURE_IMAGES: { url: string; scenes: string[] }[] = [
  { url: '/hero-mom/assets/adventure/adventure_goblin.png', scenes: ['goblin', 'battle', 'overwhelming'] },
  { url: '/hero-mom/assets/adventure/adventure_slime.png', scenes: ['slime', 'easy', 'victory'] },
  { url: '/hero-mom/assets/adventure/adventure_wolf.png', scenes: ['wolf', 'narrow', 'tense'] },
  { url: '/hero-mom/assets/adventure/adventure_treasure.png', scenes: ['treasure', 'loot', 'gold'] },
  { url: '/hero-mom/assets/adventure/adventure_forest.png', scenes: ['forest', 'path', 'travel'] },
  { url: '/hero-mom/assets/adventure/adventure_camp.png', scenes: ['camp', 'rest', 'night'] },
  { url: '/hero-mom/assets/adventure/adventure_injured.png', scenes: ['injured', 'hurt', 'defeat'] },
  { url: '/hero-mom/assets/adventure/adventure_victory.png', scenes: ['victory', 'win', 'triumph'] },
  { url: '/hero-mom/assets/adventure/adventure_boss.png', scenes: ['boss', 'danger', 'monster'] },
  { url: '/hero-mom/assets/adventure/adventure_return.png', scenes: ['return', 'home', 'coming'] },
];

// --- Loot drop table ---

export const LOOT_TABLE: { item: MaterialKey; chance: number; min: number; max: number }[] = [
  { item: 'gold',         chance: 1.00, min: 5,  max: 15 },
  { item: 'monsterTeeth',  chance: 0.40, min: 1,  max: 2 },
  { item: 'monsterShell', chance: 0.35, min: 1,  max: 2 },
  { item: 'leather',      chance: 0.30, min: 1,  max: 2 },
  { item: 'ironOre',      chance: 0.25, min: 1,  max: 2 },
  { item: 'meat',         chance: 0.35, min: 1,  max: 2 },
];

// Herb drops are separate (random color)
export const HERB_DROP_CHANCE = 0.45;
export const HERB_DROP_MIN = 1;
export const HERB_DROP_MAX = 3;
export const HERB_TYPES: MaterialKey[] = ['redHerb', 'blueHerb', 'yellowHerb'];

// Seed drop
export const SEED_DROP_CHANCE = 0.20;

// Rare loot (boss / special conditions)
export const RARE_LOOT = {
  mithril:       { chance: 0.50 }, // boss kill
  gems:          { chance: 0.40 }, // boss kill
  enhancementStones: { chance: 0.15, minLevel: 5 }, // any victory at Lv5+
  specialOre:    { chance: 0.30, minLevel: 8 }, // boss kill at Lv8+
};

// --- Max placement slots ---

export const MAX_TABLE_FOOD = 5;
export const MAX_POTION_SHELF = 3;
export const EXPANDED_POTION_SHELF = 5;

// --- Initial Game State ---

export const INITIAL_GAME_STATE: GameState = {
  son: {
    stats: {
      hp: 100,
      maxHp: 100,
      hunger: 100,
      maxHunger: 100,
      str: 5,
      def: 3,
      agi: 3,
      int: 2,
      level: 1,
      exp: 0,
      maxExp: 50,
    },
    equipment: {
      weapon: {
        id: 'starter_sword',
        name: '나무 검',
        slot: 'weapon',
        grade: 'common',
        baseStats: { str: 3 },
        enhanceLevel: 0,
        durability: 100,
        maxDurability: 100,
        tier: 0,
        level: 1,
      },
      armor: {
        id: 'starter_armor',
        name: '가죽 갑옷',
        slot: 'armor',
        grade: 'common',
        baseStats: { def: 3 },
        enhanceLevel: 0,
        durability: 100,
        maxDurability: 100,
        tier: 0,
        level: 1,
      },
      accessory: null,
    },
    currentAction: SonAction.IDLE,
    actionTimer: 0,
    isHome: true,
    isInjured: false,
    adventureLog: [],
    dialogue: null,
    tempBuffs: [],
    dialogueState: {
      activeDialogue: null,
      cooldowns: { emotion: 0, bedtime: 0, daily: 0, request: 0 },
      counts: { emotion: 0, bedtime: 0, daily: 0, request: 0 },
      mood: 70,
      ticksSinceReturn: 999,
    },
    questState: {
      activeQuests: [],
      completedQuests: [],
      lastQuestOfferedAt: 0,
    },
  },
  inventory: {
    materials: {
      gold: 50,
      wood: 5,
      leather: 0,
      ironOre: 0,
      mithril: 0,
      gems: 0,
      enhancementStones: 0,
      specialOre: 0,
      monsterTeeth: 0,
      monsterShell: 0,
      meat: 0,
      wheat: 4,
      potato: 0,
      carrot: 0,
      apple: 0,
      redHerb: 0,
      blueHerb: 0,
      yellowHerb: 0,
      refiningStone: 0,
      seed: 12,
    },
    equipment: [],
    food: [
      { id: 'starter_bread_1', name: '빵', hungerRestore: 20 },
      { id: 'starter_bread_2', name: '빵', hungerRestore: 20 },
    ],
    potions: [],
    books: [
      {
        id: 'starter_book',
        name: '초급 전사 가이드',
        statEffect: { stat: 'str', value: 1 },
      },
    ],
  },
  home: {
    table: [
      { id: 'starter_bread_1', name: '빵', hungerRestore: 20 },
      { id: 'starter_bread_2', name: '빵', hungerRestore: 20 },
    ],
    potionShelf: [],
    equipmentRack: [],
    desk: [
      {
        id: 'starter_book',
        name: '초급 전사 가이드',
        statEffect: { stat: 'str', value: 1 },
      },
    ],
  },
  farm: {
    plots: [
      { crop: null, plantedAt: null, growthTime: 0, ready: false },
      { crop: null, plantedAt: null, growthTime: 0, ready: false },
      { crop: null, plantedAt: null, growthTime: 0, ready: false },
      { crop: null, plantedAt: null, growthTime: 0, ready: false },
    ],
    maxPlots: 4,
    farmLevel: 1,
    farmExp: 0,
    farmMaxExp: 5,
  },
  adventure: null,
  lastAdventureResult: null,
  unlocks: {
    systems: {
      alchemy: false,
      enhancement: false,
      smelting: false,
    },
    farmSlots: 4,
    potionSlots: 3,
    milestones: {},
  },
  letters: [],
  gameTime: 0,
  lastTickAt: Date.now(),
  mom: {
    jobLevel: 1,
    jobExp: 0,
    jobMaxExp: 5,
    lastJobAt: 0,
    refiningLevel: 1,
    refiningExp: 0,
    refiningMaxExp: 3,
  },
};

// --- Milestone Levels ---

export const MILESTONE_LEVELS = [5, 10, 15, 20];

export const MILESTONE_MESSAGES: Record<number, string> = {
  5:  '축하해요! 아들이 첫 보스를 처치했어요! "엄마(아빠)! 해냈어요!"',
  10: '아들이 모험가 길드에 정식 등록되었습니다! "이제 진짜 모험가예요!"',
  15: '마을 사람들이 아들의 이름을 알아봅니다! "소문난 영웅이 된 거예요!"',
  20: '아들이 왕에게 훈장을 받았습니다! "엄마(아빠)... 다 엄마(아빠) 덕분이에요. 감사해요."',
};

// Unlock levels for systems
export const UNLOCK_LEVELS = {
  alchemy: 3,
  enhancement: 5,
  ironEquipment: 5,
  fruitPie: 5,
  guardianElixir: 5,
  swiftnessElixir: 5,
  smelting: 8,
  advancedRecipes: 8,
  meatStew: 8,
  heroLunchbox: 8,
  wisdomElixir: 8,
  universalElixir: 8,
  farmExpansion: 10,
  mithrilEquipment: 12,
  potionShelfExpansion: 15,
};

// ============================================================
// Book Templates (for adventure drops & shop)
// ============================================================

export interface BookTemplate {
  name: string;
  stat: StatType;
  value: number;
  minLevel: number;
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  { name: '초급 전사 가이드', stat: 'str', value: 1, minLevel: 1 },
  { name: '방어의 기초', stat: 'def', value: 1, minLevel: 1 },
  { name: '순발력 훈련법', stat: 'agi', value: 1, minLevel: 1 },
  { name: '마법 입문서', stat: 'int', value: 1, minLevel: 1 },
  { name: '중급 검술 교본', stat: 'str', value: 2, minLevel: 5 },
  { name: '철벽 수비론', stat: 'def', value: 2, minLevel: 5 },
  { name: '속도의 비밀', stat: 'agi', value: 2, minLevel: 8 },
  { name: '고급 마법서', stat: 'int', value: 2, minLevel: 8 },
  { name: '영웅전', stat: 'str', value: 3, minLevel: 12 },
  { name: '불멸의 방패술', stat: 'def', value: 3, minLevel: 12 },
];

export const BOOK_DROP_CHANCE = 0.12;       // 12% per battle
export const BOOK_DROP_BOSS_CHANCE = 0.35;  // 35% from boss battles

// ============================================================
// Shop System
// ============================================================

export interface ShopItem {
  id: string;
  category: 'book' | 'seed';
  name: string;
  emoji: string;
  description: string;
  goldCost: number;
  book?: { name: string; stat: StatType; value: number };
  material?: { key: MaterialKey; amount: number };
}

export const SHOP_INVENTORY: ShopItem[] = [
  // Books
  { id: 'shop_str_book', category: 'book', name: '전사 가이드', emoji: '📕', description: 'STR +1', goldCost: 80, book: { name: '전사 가이드', stat: 'str', value: 1 } },
  { id: 'shop_def_book', category: 'book', name: '방어의 기초', emoji: '📘', description: 'DEF +1', goldCost: 80, book: { name: '방어의 기초', stat: 'def', value: 1 } },
  { id: 'shop_agi_book', category: 'book', name: '순발력 훈련법', emoji: '📗', description: 'AGI +1', goldCost: 80, book: { name: '순발력 훈련법', stat: 'agi', value: 1 } },
  { id: 'shop_int_book', category: 'book', name: '마법 입문서', emoji: '📙', description: 'INT +1', goldCost: 80, book: { name: '마법 입문서', stat: 'int', value: 1 } },
  // Seeds
  { id: 'shop_seed', category: 'seed', name: '씨앗 x5', emoji: '🌱', description: '만능 씨앗 5개', goldCost: 50, material: { key: 'seed', amount: 5 } },
];

export const SELL_PRICES: {
  food: number;
  potion: number;
  book: number;
  equipment: Record<EquipmentGrade, number>;
} = {
  food: 5,
  potion: 10,
  book: 15,
  equipment: {
    common: 15,
    uncommon: 40,
    rare: 100,
    epic: 250,
  },
};
