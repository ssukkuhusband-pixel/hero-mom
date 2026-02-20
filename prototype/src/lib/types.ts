// ============================================================
// Hero Mom - All TypeScript Type Definitions
// ============================================================

// --- Son Stats & State ---

export interface SonStats {
  hp: number;
  maxHp: number;
  hunger: number;
  maxHunger: number;
  str: number;
  def: number;
  agi: number;
  int: number;
  level: number;
  exp: number;
  maxExp: number;
}

export enum SonAction {
  IDLE = 'IDLE',
  SLEEPING = 'SLEEPING',
  TRAINING = 'TRAINING',
  EATING = 'EATING',
  READING = 'READING',
  RESTING = 'RESTING',
  HEALING = 'HEALING',
  DRINKING_POTION = 'DRINKING_POTION',
  DEPARTING = 'DEPARTING',
  ADVENTURING = 'ADVENTURING',
}

export interface SonState {
  stats: SonStats;
  equipment: EquippedGear;
  currentAction: SonAction;
  actionTimer: number; // seconds remaining for current action
  isHome: boolean;
  isInjured: boolean;
  adventureLog: string[];
  dialogue: string | null;
  tempBuffs: TempBuff[];
  dialogueState: DialogueState;
  questState: QuestState;
}

// --- Dialogue System ---

export type DialogueType = 'emotion' | 'bedtime' | 'daily' | 'request';

export type FurnitureKey = 'bed' | 'desk' | 'potionShelf' | 'chair' | 'equipmentRack' | 'dummy' | 'table' | 'door';

export interface DialogueEffect {
  type: 'buff' | 'heal' | 'hunger' | 'mood' | 'exp';
  stat?: StatType | 'all' | 'hp';
  value: number;
  duration?: number;   // game seconds for buffs
  source: string;
}

export interface DialogueChoice {
  id: string;
  text: string;
  effect?: DialogueEffect;
}

export interface DialogueTriggerCondition {
  sonAction?: SonAction[];
  hpRange?: [number, number];       // percentage 0-100
  hungerRange?: [number, number];   // absolute 0-100
  minLevel?: number;
  isInjured?: boolean;
  justReturned?: boolean;
  nearFurniture?: FurnitureKey[];
}

export interface QuestData {
  objectives: Omit<QuestObjective, 'currentAmount'>[];
  deadlineSeconds: number;
  reward: QuestReward;
  failPenalty: QuestPenalty;
}

export interface DialogueTemplate {
  id: string;
  type: DialogueType;
  sonText: string;
  choices: DialogueChoice[];
  conditions: DialogueTriggerCondition;
  priority: number;
  questData?: QuestData;
}

export interface ActiveDialogue {
  template: DialogueTemplate;
  startedAt: number;   // gameTime
  responded: boolean;
}

export interface DialogueState {
  activeDialogue: ActiveDialogue | null;
  cooldowns: Record<DialogueType, number>;  // gameTime when cooldown expires
  counts: Record<DialogueType, number>;
  mood: number;              // 0-100
  ticksSinceReturn: number;
}

// --- Quest System ---

export interface QuestObjective {
  type: 'craft_food' | 'craft_equipment' | 'brew_potion' | 'gather_material' | 'place_food' | 'place_potion' | 'place_book' | 'place_equipment' | 'place_any_food';
  targetId?: string;
  targetAmount: number;
  currentAmount: number;
}

export interface QuestReward {
  type: 'buff' | 'exp' | 'mood' | 'materials';
  description: string;
  stat?: StatType | 'all';
  value: number;
}

export interface QuestPenalty {
  type: 'mood';
  description: string;
  value: number;
}

export interface Quest {
  id: string;
  requestText: string;
  description: string;
  objectives: QuestObjective[];
  deadline: number;      // absolute gameTime
  acceptedAt: number;    // gameTime
  status: 'active' | 'completed' | 'failed';
  reward: QuestReward;
  failPenalty: QuestPenalty;
}

export interface QuestState {
  activeQuests: Quest[];
  completedQuests: Quest[];
  lastQuestOfferedAt: number;
}

export interface EquippedGear {
  weapon: Equipment | null;
  armor: Equipment | null;
  accessory: Equipment | null;
}

export interface TempBuff {
  stat: StatType | 'all';
  value: number;
  source: string; // e.g. "meat stew", "strength elixir"
}

// --- Equipment ---

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type EquipmentGrade = 'common' | 'uncommon' | 'rare' | 'epic';

export interface EquipmentStats {
  str?: number;
  def?: number;
  agi?: number;
  int?: number;
  hp?: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  grade: EquipmentGrade;
  baseStats: EquipmentStats;
  enhanceLevel: number;
  durability: number;     // 현재 내구도 (0~100)
  maxDurability: number;  // 최대 내구도 (100)
  tier: number;           // 승급 단계 (0=기본, 1=철, 2=미스릴)
}

// --- Items ---

export type StatType = 'str' | 'def' | 'agi' | 'int';

export interface Food {
  id: string;
  name: string;
  hungerRestore: number;
  hpRestore?: number;
  tempBuff?: { stat: StatType | 'all'; value: number };
}

export interface Potion {
  id: string;
  name: string;
  effect: 'instant' | 'buff';
  stat?: StatType | 'all' | 'hp';
  value?: number;
}

export interface Book {
  id: string;
  name: string;
  statEffect: { stat: StatType; value: number };
}

// --- Materials / Inventory ---

export type MaterialKey =
  | 'gold'
  | 'wood'
  | 'leather'
  | 'ironOre'
  | 'mithril'
  | 'gems'
  | 'enhancementStones'
  | 'specialOre'
  | 'monsterTeeth'
  | 'monsterShell'
  | 'meat'
  | 'wheat'
  | 'potato'
  | 'carrot'
  | 'apple'
  | 'redHerb'
  | 'blueHerb'
  | 'yellowHerb'
  | 'wheatSeed'
  | 'potatoSeed'
  | 'carrotSeed'
  | 'appleSeed'
  | 'redHerbSeed'
  | 'blueHerbSeed'
  | 'yellowHerbSeed';

export type Materials = Record<MaterialKey, number>;

export interface Inventory {
  materials: Materials;
  equipment: Equipment[];
  food: Food[];
  potions: Potion[];
  books: Book[];
}

// --- Home Placement ---

export interface HomePlacements {
  table: Food[];       // max 5 food items on dining table
  potionShelf: Potion[]; // max 3 (expandable to 5) potions on shelf
  equipmentRack: Equipment[]; // equipment available for son
  desk: Book[];        // books on desk for reading
}

// --- Farm ---

export type CropType =
  | 'wheat'
  | 'potato'
  | 'carrot'
  | 'apple'
  | 'redHerb'
  | 'blueHerb'
  | 'yellowHerb';

export interface FarmPlot {
  crop: CropType | null;
  plantedAt: number | null; // timestamp in ms
  growthTime: number;       // seconds to grow
  ready: boolean;
}

export interface FarmState {
  plots: FarmPlot[];
  maxPlots: number; // 4, expandable to 6 at Lv.10
}

// --- Recipes ---

export interface EquipmentRecipe {
  id: string;
  name: string;
  slot: EquipmentSlot;
  grade: EquipmentGrade;
  baseStats: EquipmentStats;
  materials: Partial<Record<MaterialKey, number>>;
  unlockLevel: number;
}

export interface FoodRecipe {
  id: string;
  name: string;
  hungerRestore: number;
  hpRestore?: number;
  tempBuff?: { stat: StatType | 'all'; value: number };
  materials: Partial<Record<MaterialKey, number>>;
  unlockLevel: number;
}

export interface PotionRecipe {
  id: string;
  name: string;
  effect: 'instant' | 'buff';
  stat?: StatType | 'all' | 'hp';
  value?: number;
  materials: Partial<Record<MaterialKey, number>>;
  unlockLevel: number;
}

// --- Enhancement ---

export interface EnhancementLevel {
  level: number;
  stonesRequired: number;
  goldCost: number;
  successRate: number; // 0-1
  statBonus: number;   // multiplier added, e.g. 0.10 = +10%
}

// --- Level Up ---

export interface LevelUpEntry {
  level: number;
  expRequired: number;
  hpGain: number;
  statGains: { str: number; def: number; agi: number; int: number };
}

// --- Letters ---

export interface Letter {
  id: string;
  text: string;
  timestamp: number;
  hpPercent?: number;
  battlesCompleted?: number;
  imageUrl?: string;  // 모험 중 동봉한 이미지 경로
}

// --- Adventure ---

export interface AdventureState {
  active: boolean;
  startTime: number;
  duration: number;       // total adventure time in ms
  letters: Letter[];
  nextLetterAt: number;   // timestamp for next letter
  battleResults: BattleResult[];
  totalBattles: number;
  currentBattle: number;
  rewards: Partial<Materials>;
  bookRewards: Book[];    // books found during adventure
  expGained: number;
  failed: boolean;
  sonHpPercent: number;
}

export interface BattleResult {
  outcome: 'overwhelming' | 'victory' | 'narrow' | 'defeat';
  isBoss: boolean;
  hpLost: number;
  expGained: number;
  rewards: Partial<Materials>;
  bookDrop?: Book;  // rare book drop from battle
}

/** Snapshot of adventure results stored after completion for display in ReturnModal */
export interface AdventureResult {
  battleResults: BattleResult[];
  totalBattles: number;
  rewards: Partial<Materials>;
  bookRewards: Book[];  // books found during adventure
  expGained: number;
  failed: boolean;
  sonHpPercent: number;
}

// --- Unlock State ---

export interface UnlockState {
  systems: {
    alchemy: boolean;
    enhancement: boolean;
    smelting: boolean;
  };
  farmSlots: number;
  potionSlots: number;
  milestones: Record<number, boolean>;
}

// --- Game State ---

export interface GameState {
  son: SonState;
  inventory: Inventory;
  home: HomePlacements;
  farm: FarmState;
  adventure: AdventureState | null;
  lastAdventureResult: AdventureResult | null; // saved when adventure completes
  unlocks: UnlockState;
  letters: Letter[];
  gameTime: number; // total elapsed game time in seconds
  lastTickAt: number; // timestamp of last game tick
}

// --- Action types for reducer ---

export type GameAction =
  | { type: 'TICK'; now: number }
  | { type: 'CRAFT_EQUIPMENT'; recipeId: string }
  | { type: 'COOK_FOOD'; recipeId: string }
  | { type: 'BREW_POTION'; recipeId: string }
  | { type: 'PLANT_CROP'; plotIndex: number; crop: CropType }
  | { type: 'HARVEST_CROP'; plotIndex: number }
  | { type: 'ENHANCE_EQUIPMENT'; equipmentId: string }
  | { type: 'PROMOTE_EQUIPMENT'; equipmentId: string }
  | { type: 'MAINTAIN_EQUIPMENT'; equipmentId: string }
  | { type: 'SMELT_EQUIPMENT'; equipmentId: string }
  | { type: 'PLACE_FOOD'; foodIndex: number }
  | { type: 'PLACE_POTION'; potionIndex: number }
  | { type: 'PLACE_EQUIPMENT'; equipmentId: string }
  | { type: 'PLACE_BOOK'; bookIndex: number }
  | { type: 'REMOVE_FOOD'; placedIndex: number }
  | { type: 'REMOVE_POTION'; placedIndex: number }
  | { type: 'REMOVE_EQUIPMENT'; equipmentId: string }
  | { type: 'REMOVE_BOOK'; placedIndex: number }
  | { type: 'BUY_ITEM'; shopItemId: string }
  | { type: 'SELL_FOOD'; foodIndex: number }
  | { type: 'SELL_POTION'; potionIndex: number }
  | { type: 'SELL_EQUIPMENT'; equipmentId: string }
  | { type: 'RESPOND_DIALOGUE'; choiceId: string }
  | { type: 'DISMISS_DIALOGUE' }
  | { type: 'ACCEPT_QUEST'; questId: string }
  | { type: 'DECLINE_QUEST' }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'RESET_GAME' };
