'use client';

import React from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canCookFood } from '@/lib/game/crafting';
import { FOOD_RECIPES, EMOJI_MAP } from '@/lib/constants';
import type { MaterialKey, FoodRecipe, Food } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// Constants
// ============================================================

const FOOD_EMOJI: Record<string, string> = {
  bread: '\uD83C\uDF5E',
  vegetable_soup: '\uD83C\uDF72',
  meat_stew: '\uD83C\uDF56',
  fruit_pie: '\uD83E\uDD67',
  hero_lunchbox: '\uD83C\uDF71',
};

const STAT_LABEL: Record<string, string> = {
  str: 'STR',
  def: 'DEF',
  agi: 'AGI',
  int: 'INT',
  all: '\uC804\uC2A4\uD0EF', // 전스탯
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
// Food Recipe Card Component
// ============================================================

function FoodRecipeCard({ recipe }: { recipe: FoodRecipe }) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel || recipe.unlockLevel === 0;
  const canCook = canCookFood(state, recipe.id);

  const handleCook = () => {
    actions.cookFood(recipe.id);
    addToast(`${recipe.name} 요리 완료!`, 'success');
  };

  // Build effects summary
  const effects: string[] = [];
  effects.push(`\uD83C\uDF56 배고픔 +${recipe.hungerRestore}`);
  if (recipe.hpRestore) {
    effects.push(`\u2764\uFE0F HP +${recipe.hpRestore}`);
  }
  if (recipe.tempBuff) {
    effects.push(
      `\u2B50 ${STAT_LABEL[recipe.tempBuff.stat] ?? recipe.tempBuff.stat} +${recipe.tempBuff.value}`
    );
  }

  // Material requirements
  const materials = Object.entries(recipe.materials) as [MaterialKey, number][];

  const foodEmoji = FOOD_EMOJI[recipe.id] ?? '\uD83C\uDF5E';

  return (
    <div
      className={`
        card-parchment !p-4 transition-opacity
        ${!isUnlocked ? 'opacity-50' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{foodEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-cream-900 text-sm truncate">
            {recipe.name}
          </p>
        </div>
        {!isUnlocked && (
          <span className="text-[10px] bg-cream-700 text-cream-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            Lv.{recipe.unlockLevel} 필요
          </span>
        )}
      </div>

      {/* Effects */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2 text-xs text-cream-800 bg-cream-200/80 rounded-lg px-2.5 py-1.5">
        {effects.map((eff, i) => (
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

      {/* Cook button */}
      <button
        onClick={handleCook}
        disabled={!canCook}
        className="btn-wood w-full text-sm !py-2"
      >
        {isUnlocked ? '\uD83C\uDF73 요리' : '\uD83D\uDD12 잠김'}
      </button>
    </div>
  );
}

// ============================================================
// Food Inventory Section
// ============================================================

function FoodInventory() {
  const { state } = useGameState();
  const foods = state.inventory.food;

  // Group foods by name for display
  const grouped = React.useMemo(() => {
    const map = new Map<string, { food: Food; count: number }>();
    for (const food of foods) {
      const existing = map.get(food.name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(food.name, { food, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [foods]);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-cream-500 italic">보유한 음식이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {grouped.map(({ food, count }) => {
        const foodEmoji = FOOD_EMOJI[food.id?.replace(/_.+$/, '') ?? ''] ?? '\uD83C\uDF5E';
        // Try to match emoji by checking all known recipe IDs
        const matchedEmoji = Object.entries(FOOD_EMOJI).find(([key]) => food.name === FOOD_RECIPES.find(r => r.id === key)?.name)?.[1] ?? '\uD83C\uDF5E';

        // Build short effects summary
        const effectParts: string[] = [];
        effectParts.push(`\uD83C\uDF56+${food.hungerRestore}`);
        if (food.hpRestore) effectParts.push(`\u2764\uFE0F+${food.hpRestore}`);
        if (food.tempBuff) {
          effectParts.push(
            `\u2B50${STAT_LABEL[food.tempBuff.stat] ?? food.tempBuff.stat}+${food.tempBuff.value}`
          );
        }

        return (
          <div
            key={food.name}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-cream-400 bg-cream-100"
          >
            <span className="text-xl">{matchedEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cream-900 truncate">
                {food.name}
              </p>
              <p className="text-[10px] text-cream-600">
                {effectParts.join('  ')}
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
// Main KitchenPage Component
// ============================================================

export default function KitchenPage() {
  // Material keys relevant to kitchen
  const kitchenMaterials: MaterialKey[] = [
    'gold', 'wheat', 'potato', 'carrot', 'apple', 'meat',
  ];

  return (
    <div className="px-3 py-4 flex flex-col gap-4 pb-24">
      {/* Header */}
      <h1 className="font-serif font-bold text-xl text-cream-950 text-center">
        {'\uD83C\uDF73'} 주방
      </h1>

      {/* Recipe list */}
      <div>
        <h2 className="font-serif font-bold text-sm text-cream-800 mb-2">
          {'\uD83D\uDCD6'} 레시피
        </h2>
        <div className="flex flex-col gap-3">
          {FOOD_RECIPES.map((recipe) => (
            <FoodRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-cream-400 my-1" />

      {/* Current food inventory */}
      <div>
        <h2 className="font-serif font-bold text-sm text-cream-800 mb-2">
          {'\uD83C\uDF5E'} 보유 음식
        </h2>
        <FoodInventory />
      </div>

      {/* Bottom material bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
        <MaterialBar materialKeys={kitchenMaterials} />
      </div>
    </div>
  );
}
