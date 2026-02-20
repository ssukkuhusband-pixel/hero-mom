'use client';

import React, { useState, useMemo } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import {
  canCraftEquipment,
  canEnhance,
  canGacha,
  calculateEquipmentStats,
  enhanceEquipment as enhanceEquipmentFn,
} from '@/lib/game/crafting';
import {
  EQUIPMENT_RECIPES,
  ENHANCEMENT_TABLE,
  GACHA_RATES,
  GACHA_COST,
  EMOJI_MAP,
  GRADE_COLORS,
  UNLOCK_LEVELS,
} from '@/lib/constants';
import type {
  Equipment,
  EquipmentSlot,
  EquipmentGrade,
  MaterialKey,
  EquipmentRecipe,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// Constants
// ============================================================

const SLOT_EMOJI: Record<EquipmentSlot, string> = {
  weapon: '\u2694\uFE0F',
  armor: '\uD83D\uDEE1\uFE0F',
  accessory: '\uD83D\uDC8D',
};

const STAT_EMOJI: Record<string, string> = {
  str: '\u2694\uFE0F',
  def: '\uD83D\uDEE1\uFE0F',
  agi: '\uD83D\uDCA8',
  int: '\uD83D\uDCD6',
  hp: '\u2764\uFE0F',
};

const STAT_LABEL: Record<string, string> = {
  str: 'STR',
  def: 'DEF',
  agi: 'AGI',
  int: 'INT',
  hp: 'HP',
};

const GRADE_LABEL: Record<EquipmentGrade, string> = {
  common: '\uD83D\uDD34 Common',
  uncommon: '\uD83D\uDFE2 Uncommon',
  rare: '\uD83D\uDD35 Rare',
  epic: '\uD83D\uDFE3 Epic',
};

const GRADE_BG: Record<EquipmentGrade, string> = {
  common: 'bg-gray-100 border-gray-300',
  uncommon: 'bg-green-50 border-green-300',
  rare: 'bg-blue-50 border-blue-300',
  epic: 'bg-purple-50 border-purple-300',
};

type TabType = 'craft' | 'enhance' | 'gacha';

// ============================================================
// Material Bar Component
// ============================================================

function MaterialBar({ materialKeys }: { materialKeys: MaterialKey[] }) {
  const { state } = useGameState();

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20">
      {materialKeys.map((key) => (
        <div key={key} className="flex items-center gap-1 text-xs">
          <span className="text-sm">{EMOJI_MAP[key] ?? '?'}</span>
          <span className="font-medium text-cream-200 tabular-nums">
            {state.inventory.materials[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Recipe Card Component (Craft Tab)
// ============================================================

function RecipeCard({ recipe }: { recipe: EquipmentRecipe }) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel || recipe.unlockLevel === 0;
  const canCraft = canCraftEquipment(state, recipe.id);

  const handleCraft = () => {
    actions.craftEquipment(recipe.id);
    addToast(`${recipe.name} 제작 완료!`, 'success');
  };

  // Build stat preview string
  const statsPreview = Object.entries(recipe.baseStats)
    .filter(([, v]) => v !== undefined && v > 0)
    .map(([k, v]) => `${STAT_EMOJI[k] ?? ''} ${STAT_LABEL[k] ?? k}+${v}`)
    .join('  ');

  // Build material requirements
  const materials = Object.entries(recipe.materials) as [MaterialKey, number][];

  return (
    <div
      className={`
        bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-4 transition-opacity
        ${!isUnlocked ? 'opacity-50' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{SLOT_EMOJI[recipe.slot]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-cream-100 text-sm truncate drop-shadow">
            {recipe.name}
          </p>
          <p className="text-[10px] text-cream-300">
            Common
          </p>
        </div>
        {!isUnlocked && (
          <span className="text-[10px] bg-black/40 text-cream-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            Lv.{recipe.unlockLevel} 필요
          </span>
        )}
      </div>

      {/* Stats preview */}
      <div className="text-xs text-cream-100 mb-2 bg-white/10 rounded-lg px-2.5 py-1.5">
        {statsPreview}
      </div>

      {/* Materials */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {materials.map(([key, amount]) => {
          const has = state.inventory.materials[key] ?? 0;
          const enough = has >= amount;
          return (
            <div key={key} className="flex items-center gap-1 text-xs">
              <span className="text-sm">{EMOJI_MAP[key] ?? '?'}</span>
              <span className={`tabular-nums font-medium ${enough ? 'text-cream-200' : 'text-red-400'}`}>
                {has}/{amount}
              </span>
            </div>
          );
        })}
      </div>

      {/* Craft button */}
      <button
        onClick={handleCraft}
        disabled={!canCraft}
        className="btn-wood w-full text-sm !py-2"
      >
        {isUnlocked ? '\u2692\uFE0F 제작' : '\uD83D\uDD12 잠김'}
      </button>
    </div>
  );
}

// ============================================================
// Enhance Tab Content
// ============================================================

function EnhanceTab() {
  const { state, dispatch } = useGameState();
  const { addToast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Collect all equipment from inventory, rack, and equipped
  const allEquipment = useMemo(() => {
    const items: { eq: Equipment; location: string }[] = [];

    state.inventory.equipment.forEach((eq) => {
      items.push({ eq, location: '인벤토리' });
    });

    state.home.equipmentRack.forEach((eq) => {
      items.push({ eq, location: '장비대' });
    });

    const { weapon, armor, accessory } = state.son.equipment;
    if (weapon) items.push({ eq: weapon, location: '장착 중' });
    if (armor) items.push({ eq: armor, location: '장착 중' });
    if (accessory) items.push({ eq: accessory, location: '장착 중' });

    return items;
  }, [state.inventory.equipment, state.home.equipmentRack, state.son.equipment]);

  const selected = allEquipment.find((item) => item.eq.id === selectedId);
  const selectedEq = selected?.eq ?? null;

  const isMaxEnhance = selectedEq ? selectedEq.enhanceLevel >= 5 : false;
  const nextEnhanceLevel = selectedEq
    ? ENHANCEMENT_TABLE.find((e) => e.level === selectedEq.enhanceLevel + 1)
    : null;

  const canDoEnhance = selectedEq ? canEnhance(state, selectedEq.id) : false;

  // Calculate stat preview for success
  const currentStats = selectedEq ? calculateEquipmentStats(selectedEq) : {};
  const previewStats = useMemo(() => {
    if (!selectedEq || !nextEnhanceLevel) return {};
    // Simulate +1 enhance level
    const simulated = { ...selectedEq, enhanceLevel: selectedEq.enhanceLevel + 1 };
    return calculateEquipmentStats(simulated);
  }, [selectedEq, nextEnhanceLevel]);

  const handleEnhance = () => {
    if (!selectedEq) return;

    // We need to detect success/failure. The reducer returns just the state.
    // We'll check the equipment's enhance level before/after dispatch.
    const beforeLevel = selectedEq.enhanceLevel;

    // Use the pure function to determine the result
    const result = enhanceEquipmentFn(state, selectedEq.id);
    // Check if enhance level changed
    const afterEq = [
      ...result.state.inventory.equipment,
      ...result.state.home.equipmentRack,
      result.state.son.equipment.weapon,
      result.state.son.equipment.armor,
      result.state.son.equipment.accessory,
    ].find((e) => e?.id === selectedEq.id);

    const success = afterEq ? afterEq.enhanceLevel > beforeLevel : false;

    // Dispatch to actually update state (we need the same random result)
    // Since the reducer re-rolls random, we load the already-computed state instead.
    dispatch({ type: 'LOAD_STATE', state: result.state });

    if (success) {
      addToast(`${selectedEq.name} +${beforeLevel + 1} 강화 성공!`, 'success');
    } else {
      addToast(`${selectedEq.name} 강화 실패... 재료가 소모되었습니다`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Enhancement unlock check */}
      {!state.unlocks.systems.enhancement && (
        <div className="text-center py-6">
          <p className="text-sm text-cream-300">
            {'\uD83D\uDD12'} Lv.{UNLOCK_LEVELS.enhancement} 달성 시 해금됩니다
          </p>
        </div>
      )}

      {state.unlocks.systems.enhancement && (
        <>
          {/* Equipment list */}
          <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
            {allEquipment.length === 0 && (
              <p className="text-xs text-cream-400 italic text-center py-4">
                강화할 장비가 없습니다
              </p>
            )}
            {allEquipment.map(({ eq, location }) => (
              <button
                key={eq.id}
                onClick={() => setSelectedId(eq.id === selectedId ? null : eq.id)}
                className={`
                  flex items-center gap-2.5 w-full text-left
                  px-3 py-2 rounded-lg border-2 transition-all
                  ${eq.id === selectedId
                    ? 'border-cozy-amber bg-amber-900/40 shadow-sm'
                    : 'border-white/20 bg-white/10 hover:border-white/40'
                  }
                `}
              >
                <span className="text-xl">{SLOT_EMOJI[eq.slot]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cream-100 truncate">
                    {eq.name}
                    {eq.enhanceLevel > 0 && (
                      <span className="text-cozy-amber ml-1">+{eq.enhanceLevel}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-cream-300">
                    {location} &middot;{' '}
                    <span style={{ color: GRADE_COLORS[eq.grade] }}>
                      {eq.grade}
                    </span>
                  </p>
                </div>
                {eq.enhanceLevel >= 5 && (
                  <span className="text-[10px] bg-cozy-gold text-cream-900 px-1.5 py-0.5 rounded-full font-bold">
                    MAX
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Enhancement detail */}
          {selectedEq && (
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{SLOT_EMOJI[selectedEq.slot]}</span>
                <div>
                  <p className="font-serif font-bold text-cream-100 text-sm drop-shadow">
                    {selectedEq.name}
                    {selectedEq.enhanceLevel > 0 && (
                      <span className="text-cozy-amber ml-1">+{selectedEq.enhanceLevel}</span>
                    )}
                  </p>
                  <p className="text-[10px]" style={{ color: GRADE_COLORS[selectedEq.grade] }}>
                    {selectedEq.grade}
                  </p>
                </div>
              </div>

              {isMaxEnhance ? (
                <div className="text-center py-3">
                  <p className="text-sm font-bold text-cozy-gold">
                    {'\u2728'} 최대 강화 달성! {'\u2728'}
                  </p>
                </div>
              ) : nextEnhanceLevel ? (
                <>
                  {/* Cost */}
                  <div className="flex items-center gap-4 mb-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span>{EMOJI_MAP.enhancementStones}</span>
                      <span
                        className={`tabular-nums font-medium ${
                          state.inventory.materials.enhancementStones >= nextEnhanceLevel.stonesRequired
                            ? 'text-cream-200'
                            : 'text-red-400'
                        }`}
                      >
                        {state.inventory.materials.enhancementStones}/{nextEnhanceLevel.stonesRequired}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{EMOJI_MAP.gold}</span>
                      <span
                        className={`tabular-nums font-medium ${
                          state.inventory.materials.gold >= nextEnhanceLevel.goldCost
                            ? 'text-cream-200'
                            : 'text-red-400'
                        }`}
                      >
                        {state.inventory.materials.gold}/{nextEnhanceLevel.goldCost}
                      </span>
                    </div>
                  </div>

                  {/* Success rate */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cream-300">성공률</span>
                      <span className="font-bold text-cream-100">
                        {Math.round(nextEnhanceLevel.successRate * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cozy-forest rounded-full transition-all"
                        style={{ width: `${nextEnhanceLevel.successRate * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Stat preview */}
                  <div className="bg-white/10 rounded-lg px-2.5 py-2 mb-3 text-xs">
                    <p className="text-cream-300 mb-1 text-[10px]">강화 시 스탯 변화:</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {Object.keys(previewStats).map((stat) => (
                        <span key={stat} className="text-cream-100">
                          {STAT_EMOJI[stat] ?? ''} {STAT_LABEL[stat] ?? stat}{' '}
                          <span className="text-cream-300">{currentStats[stat] ?? 0}</span>
                          {' \u2192 '}
                          <span className="text-green-400 font-bold">{previewStats[stat]}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Enhance button */}
                  <button
                    onClick={handleEnhance}
                    disabled={!canDoEnhance}
                    className="btn-wood w-full text-sm !py-2"
                  >
                    {'\uD83D\uDD2E'} +{selectedEq.enhanceLevel} {'\u2192'} +{selectedEq.enhanceLevel + 1} 강화
                  </button>
                </>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Gacha Tab Content
// ============================================================

function GachaTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [lastResult, setLastResult] = useState<Equipment | null>(null);
  const [animating, setAnimating] = useState(false);

  const specialOreCount = state.inventory.materials.specialOre;
  const gachaCostAmount = (GACHA_COST as Record<string, number>).specialOre ?? 3;
  const canDoGacha = canGacha(state);

  const handleGacha = () => {
    if (!canDoGacha || animating) return;

    // Record equipment count before gacha
    const prevCount = state.inventory.equipment.length;

    setAnimating(true);
    setLastResult(null);

    // Perform gacha via dispatch
    actions.performGacha();

    // After a brief animation delay, show the result
    setTimeout(() => {
      // We can't easily get the new item from dispatch alone,
      // so we'll rely on the state update. The newest equipment
      // will be the last one added.
      setAnimating(false);
    }, 1200);
  };

  // Watch for new equipment appearing (gacha result)
  const latestEquipment = state.inventory.equipment[state.inventory.equipment.length - 1] ?? null;

  // Display the last gacha result
  React.useEffect(() => {
    if (!animating && latestEquipment && lastResult === null) {
      // Only show if we just finished an animation cycle
    }
  }, [animating, latestEquipment, lastResult]);

  // Use a ref to track gacha result
  const prevEquipCountRef = React.useRef(state.inventory.equipment.length);
  React.useEffect(() => {
    const prevCount = prevEquipCountRef.current;
    const newCount = state.inventory.equipment.length;
    if (newCount > prevCount && !animating) {
      const newItem = state.inventory.equipment[newCount - 1];
      setLastResult(newItem);
      addToast(`${newItem.name} (${newItem.grade}) 획득!`, newItem.grade === 'epic' ? 'success' : 'info');
    }
    prevEquipCountRef.current = newCount;
  }, [state.inventory.equipment.length, animating, addToast, state.inventory.equipment]);

  return (
    <div className="flex flex-col gap-4">
      {/* Special ore count */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-2xl">{EMOJI_MAP.specialOre}</span>
        <span className="text-lg font-bold text-cream-100 tabular-nums">
          {specialOreCount}
        </span>
        <span className="text-sm text-cream-300">/ {gachaCostAmount} 필요</span>
      </div>

      {/* Grade probability display */}
      <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3">
        <p className="text-xs text-cream-300 mb-2 font-medium text-center">등급 확률</p>
        <div className="flex flex-col gap-1.5">
          {GACHA_RATES.map((rate) => (
            <div key={rate.grade} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: GRADE_COLORS[rate.grade], borderColor: GRADE_COLORS[rate.grade] }}
              />
              <span className="text-xs text-cream-100 flex-1 capitalize">{rate.grade}</span>
              <span className="text-xs font-bold text-cream-100 tabular-nums">
                {Math.round(rate.chance * 100)}%
              </span>
              <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${rate.chance * 100}%`, backgroundColor: GRADE_COLORS[rate.grade] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gacha button */}
      <button
        onClick={handleGacha}
        disabled={!canDoGacha || animating}
        className={`
          btn-wood w-full text-lg !py-4 relative overflow-hidden
          ${animating ? 'animate-pulse' : ''}
        `}
      >
        {animating ? (
          <span className="text-xl">{'\u2728'} 두근두근... {'\u2728'}</span>
        ) : (
          <span>{'\uD83C\uDFB0'} 뽑기! ({EMOJI_MAP.specialOre}{gachaCostAmount})</span>
        )}
      </button>

      {/* Result display */}
      {lastResult && !animating && (
        <div
          className={`
            bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center animate-fade-in
            border-2
          `}
          style={{ borderColor: GRADE_COLORS[lastResult.grade] }}
        >
          <p className="text-xs text-cream-300 mb-1">획득!</p>
          <span className="text-4xl block mb-2">{SLOT_EMOJI[lastResult.slot]}</span>
          <p className="font-serif font-bold text-cream-100 text-lg drop-shadow">
            {lastResult.name}
          </p>
          <p
            className="text-sm font-bold capitalize mb-2"
            style={{ color: GRADE_COLORS[lastResult.grade] }}
          >
            {lastResult.grade}
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-cream-200">
            {Object.entries(calculateEquipmentStats(lastResult))
              .filter(([, v]) => v > 0)
              .map(([stat, val]) => (
                <span key={stat}>
                  {STAT_EMOJI[stat] ?? ''} {STAT_LABEL[stat] ?? stat}+{val}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main BlacksmithPage Component
// ============================================================

export default function BlacksmithPage() {
  const { state } = useGameState();
  const [activeTab, setActiveTab] = useState<TabType>('craft');

  const sonLevel = state.son.stats.level;
  const gachaLocked = sonLevel < UNLOCK_LEVELS.gacha;

  const tabs: { key: TabType; label: string; locked?: boolean }[] = [
    { key: 'craft', label: '\u2692\uFE0F 제작' },
    { key: 'enhance', label: '\uD83D\uDD2E 강화' },
    { key: 'gacha', label: '\uD83C\uDFB0 가챠', locked: gachaLocked },
  ];

  // Material keys relevant to blacksmith
  const blacksmithMaterials: MaterialKey[] = [
    'gold', 'wood', 'ironOre', 'mithril', 'leather', 'gems',
    'enhancementStones', 'specialOre',
  ];

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/blacksmith.png')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        {/* Header */}
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">
          {'\u2692\uFE0F'} 대장간
        </h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.locked && setActiveTab(tab.key)}
              disabled={tab.locked}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.key
                  ? 'bg-white/20 text-cream-100 shadow-sm'
                  : tab.locked
                    ? 'text-cream-500 cursor-not-allowed'
                    : 'text-cream-300 hover:bg-white/10'
                }
              `}
            >
              {tab.label}
              {tab.locked && (
                <span className="block text-[9px] text-cream-500">
                  Lv.{UNLOCK_LEVELS.gacha}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'craft' && (
          <div className="flex flex-col gap-3">
            {EQUIPMENT_RECIPES.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        {activeTab === 'enhance' && <EnhanceTab />}

        {activeTab === 'gacha' && !gachaLocked && <GachaTab />}
        {activeTab === 'gacha' && gachaLocked && (
          <div className="text-center py-8">
            <p className="text-sm text-cream-300">
              {'\uD83D\uDD12'} Lv.{UNLOCK_LEVELS.gacha} 달성 시 해금됩니다
            </p>
          </div>
        )}

        {/* Bottom material bar */}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
          <MaterialBar materialKeys={blacksmithMaterials} />
        </div>
      </div>
    </div>
  );
}
