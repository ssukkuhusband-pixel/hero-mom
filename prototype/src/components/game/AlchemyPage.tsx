'use client';

import React from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canBrewPotion } from '@/lib/game/crafting';
import { POTION_RECIPES, EMOJI_MAP, UNLOCK_LEVELS } from '@/lib/constants';
import type { MaterialKey, PotionRecipe, Potion } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// Constants
// ============================================================

const STAT_LABEL: Record<string, string> = {
  str: 'STR',
  def: 'DEF',
  agi: 'AGI',
  int: 'INT',
  hp: 'HP',
  all: '\uC804\uC2A4\uD0EF', // 전스탯
};

const STAT_EMOJI: Record<string, string> = {
  str: '\u2694\uFE0F',
  def: '\uD83D\uDEE1\uFE0F',
  agi: '\uD83D\uDCA8',
  int: '\uD83D\uDCD6',
  hp: '\u2764\uFE0F',
  all: '\u2728',
};

const EFFECT_TYPE_LABEL: Record<string, string> = {
  instant: '\uC988\uC2DC', // 즉시
  buff: '\uBAA8\uD5D8 \uC911 \uC9C0\uC18D', // 모험 중 지속
};

// ============================================================
// Material Bar Component
// ============================================================

function MaterialBar({ materialKeys }: { materialKeys: MaterialKey[] }) {
  const { state } = useGameState();

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 bg-cream-300/80 rounded-xl border border-cream-500/50">
      {materialKeys.map((key) => (
        <div key={key} className="flex items-center gap-1 text-xs">
          <span className="text-sm">{EMOJI_MAP[key] ?? '?'}</span>
          <span className="font-medium text-cream-800 tabular-nums">
            {state.inventory.materials[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Potion Recipe Card Component
// ============================================================

function PotionRecipeCard({ recipe }: { recipe: PotionRecipe }) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel;
  const canBrew = canBrewPotion(state, recipe.id);

  const handleBrew = () => {
    actions.brewPotion(recipe.id);
    addToast(`${recipe.name} \uC591\uC870 \uC644\uB8CC!`, 'success'); // 양조 완료!
  };

  // Effect type badge
  const effectTypeBadge = recipe.effect === 'instant'
    ? { label: EFFECT_TYPE_LABEL.instant, className: 'bg-cozy-red/20 text-cozy-red' }
    : { label: EFFECT_TYPE_LABEL.buff, className: 'bg-cozy-purple/20 text-cozy-purple' };

  // Build effect details
  const effectDetails: string[] = [];
  if (recipe.stat && recipe.value) {
    const statLabel = STAT_LABEL[recipe.stat] ?? recipe.stat;
    const statEmoji = STAT_EMOJI[recipe.stat] ?? '';
    if (recipe.effect === 'instant') {
      effectDetails.push(`${statEmoji} ${statLabel} +${recipe.value} \uD68C\uBCF5`); // 회복
    } else {
      effectDetails.push(`${statEmoji} ${statLabel} +${recipe.value} (\uBAA8\uD5D8 1\uD68C)`); // (모험 1회)
    }
  }

  // Material requirements
  const materials = Object.entries(recipe.materials) as [MaterialKey, number][];

  return (
    <div
      className={`
        card-parchment !p-4 transition-opacity
        ${!isUnlocked ? 'opacity-50' : ''}
      `}
      style={{
        borderColor: isUnlocked ? 'rgba(155, 126, 200, 0.4)' : undefined,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{'\uD83E\uDDEA'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-cream-900 text-sm truncate">
            {recipe.name}
          </p>
        </div>
        {/* Effect type badge */}
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${effectTypeBadge.className}`}>
          {effectTypeBadge.label}
        </span>
        {!isUnlocked && (
          <span className="text-[10px] bg-cream-700 text-cream-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            Lv.{recipe.unlockLevel} \uD544\uC694
          </span>
        )}
      </div>

      {/* Effect details */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2 text-xs text-cream-800 bg-purple-50/60 rounded-lg px-2.5 py-1.5 border border-purple-200/30">
        {effectDetails.map((eff, i) => (
          <span key={i}>{eff}</span>
        ))}
      </div>

      {/* Materials */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {materials.map(([key, amount]) => {
          const has = state.inventory.materials[key] ?? 0;
          const enough = has >= amount;
          return (
            <div key={key} className="flex items-center gap-1 text-xs">
              <span className="text-sm">{EMOJI_MAP[key] ?? '?'}</span>
              <span
                className={`tabular-nums font-medium ${enough ? 'text-cream-800' : 'text-cozy-red'}`}
              >
                {has}/{amount}
              </span>
            </div>
          );
        })}
      </div>

      {/* Brew button */}
      <button
        onClick={handleBrew}
        disabled={!canBrew}
        className="btn-wood w-full text-sm !py-2"
      >
        {isUnlocked ? '\u2697\uFE0F \uC591\uC870' : '\uD83D\uDD12 \uC7A0\uAE40'}
      </button>
    </div>
  );
}

// ============================================================
// Potion Inventory Section
// ============================================================

function PotionInventory() {
  const { state } = useGameState();
  const potions = state.inventory.potions;

  // Group potions by name
  const grouped = React.useMemo(() => {
    const map = new Map<string, { potion: Potion; count: number }>();
    for (const potion of potions) {
      const existing = map.get(potion.name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(potion.name, { potion, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [potions]);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-cream-500 italic">
          {'\uBCF4\uC720\uD55C \uD3EC\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}{/* 보유한 포션이 없습니다 */}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {grouped.map(({ potion, count }) => {
        const effectParts: string[] = [];
        if (potion.stat && potion.value) {
          const statLabel = STAT_LABEL[potion.stat] ?? potion.stat;
          if (potion.effect === 'instant') {
            effectParts.push(`${STAT_EMOJI[potion.stat] ?? ''} ${statLabel}+${potion.value}`);
          } else {
            effectParts.push(`${STAT_EMOJI[potion.stat] ?? ''} ${statLabel}+${potion.value} buff`);
          }
        }
        const effectTypeLabel = potion.effect === 'instant' ? EFFECT_TYPE_LABEL.instant : EFFECT_TYPE_LABEL.buff;

        return (
          <div
            key={potion.name}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-purple-200/50 bg-purple-50/30"
          >
            <span className="text-xl">{'\uD83E\uDDEA'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cream-900 truncate">
                {potion.name}
              </p>
              <p className="text-[10px] text-cream-600">
                {effectTypeLabel} &middot; {effectParts.join('  ')}
              </p>
            </div>
            <span className="text-sm font-bold text-cream-800 tabular-nums bg-cream-300 px-2 py-0.5 rounded-lg">
              x{count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Main AlchemyPage Component
// ============================================================

export default function AlchemyPage() {
  const { state } = useGameState();
  const sonLevel = state.son.stats.level;
  const isUnlocked = state.unlocks.systems.alchemy;

  // Material keys relevant to alchemy
  const alchemyMaterials: MaterialKey[] = [
    'gold', 'redHerb', 'blueHerb', 'yellowHerb', 'monsterTeeth', 'monsterShell',
  ];

  // Locked state
  if (!isUnlocked) {
    return (
      <div className="px-3 py-4 flex flex-col gap-4 pb-24">
        <h1 className="font-serif font-bold text-xl text-cream-950 text-center">
          {'\u2697\uFE0F'} {'\uC5F0\uAE08\uC220 \uC5F0\uAD6C\uC18C'}{/* 연금술 연구소 */}
        </h1>

        <div className="flex flex-col items-center gap-4 py-12">
          <div className="text-6xl opacity-30">{'\uD83D\uDD12'}</div>
          <p className="text-sm text-cream-700 font-medium text-center">
            {'\uD83D\uDD12 \uC5F0\uAE08\uC220\uC740 \uC544\uB4E4 Lv.'}{UNLOCK_LEVELS.alchemy}{' \uC774\uD6C4 \uD574\uAE08\uB429\uB2C8\uB2E4'}
          </p>
          <p className="text-xs text-cream-500 text-center">
            {'\uD604\uC7AC \uC544\uB4E4 \uB808\uBCA8: Lv.'}{sonLevel}
          </p>
          <p className="text-xs text-cream-500 italic text-center mt-4 max-w-[280px]">
            {'\uC2E0\uBE44\uD55C \uC5F0\uAE30\uC640 \uBCF4\uB77C\uBE5B \uC561\uCCB4\uAC00 \uBD80\uAE00\uBD80\uAE00 \uB044\uC5B4\uC624\uB974\uB294 \uC5F0\uAD6C\uC18C...\n\uC544\uC9C1\uC740 \uBB38\uC774 \uC7A0\uACBC \uC788\uC2B5\uB2C8\uB2E4.'}
          </p>
        </div>
      </div>
    );
  }

  // Unlocked state
  return (
    <div className="px-3 py-4 flex flex-col gap-4 pb-24">
      {/* Header */}
      <h1 className="font-serif font-bold text-xl text-cream-950 text-center">
        {'\u2697\uFE0F'} {'\uC5F0\uAE08\uC220 \uC5F0\uAD6C\uC18C'}
      </h1>

      {/* Recipe list */}
      <div>
        <h2 className="font-serif font-bold text-sm text-cream-800 mb-2">
          {'\uD83D\uDCD6'} {'\uD3EC\uC158 \uB808\uC2DC\uD53C'}{/* 포션 레시피 */}
        </h2>
        <div className="flex flex-col gap-3">
          {POTION_RECIPES.map((recipe) => (
            <PotionRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-cream-400 my-1" />

      {/* Current potion inventory */}
      <div>
        <h2 className="font-serif font-bold text-sm text-cream-800 mb-2">
          {'\uD83E\uDDEA'} {'\uBCF4\uC720 \uD3EC\uC158'}{/* 보유 포션 */}
        </h2>
        <PotionInventory />
      </div>

      {/* Bottom material bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
        <MaterialBar materialKeys={alchemyMaterials} />
      </div>
    </div>
  );
}
