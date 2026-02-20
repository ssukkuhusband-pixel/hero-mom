'use client';

import React, { useState } from 'react';
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
  all: '\uC804\uC2A4\uD0EF',
};

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
// Recipe Detail Popup
// ============================================================

function RecipeDetailPopup({
  recipe,
  onClose,
}: {
  recipe: FoodRecipe;
  onClose: () => void;
}) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel || recipe.unlockLevel === 0;
  const canCook = canCookFood(state, recipe.id);
  const foodEmoji = FOOD_EMOJI[recipe.id] ?? '\uD83C\uDF5E';

  const handleCook = () => {
    actions.cookFood(recipe.id);
    addToast(`${recipe.name} \uC694\uB9AC \uC644\uB8CC!`, 'success');
    onClose();
  };

  // Build effects list
  const effects: { icon: string; label: string }[] = [];
  effects.push({ icon: '\uD83C\uDF56', label: `\uBC30\uACE0\uD514 +${recipe.hungerRestore}` });
  if (recipe.hpRestore) {
    effects.push({ icon: '\u2764\uFE0F', label: `HP +${recipe.hpRestore}` });
  }
  if (recipe.tempBuff) {
    effects.push({
      icon: '\u2B50',
      label: `${STAT_LABEL[recipe.tempBuff.stat] ?? recipe.tempBuff.stat} +${recipe.tempBuff.value}`,
    });
  }

  const materials = Object.entries(recipe.materials) as [MaterialKey, number][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Popup */}
      <div
        className="relative bg-gradient-to-b from-amber-900/95 to-stone-900/95 border border-white/20 rounded-2xl p-5 w-full max-w-[340px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-cream-300 hover:text-cream-100 text-lg leading-none"
        >
          {'\u2715'}
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1 mb-4">
          <span className="text-5xl">{foodEmoji}</span>
          <h3 className="font-serif font-bold text-lg text-cream-100 drop-shadow">
            {recipe.name}
          </h3>
          {!isUnlocked && (
            <span className="text-[10px] bg-black/40 text-cream-200 px-2.5 py-0.5 rounded-full">
              {'\uD83D\uDD12'} Lv.{recipe.unlockLevel} \uD544\uC694
            </span>
          )}
        </div>

        {/* Effects */}
        <div className="bg-white/10 rounded-xl px-3 py-2.5 mb-3 border border-white/10">
          <p className="text-[10px] text-cream-400 uppercase tracking-wider mb-1.5">\uD6A8\uACFC</p>
          <div className="flex flex-col gap-1">
            {effects.map((eff, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-cream-100">
                <span>{eff.icon}</span>
                <span>{eff.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white/10 rounded-xl px-3 py-2.5 mb-4 border border-white/10">
          <p className="text-[10px] text-cream-400 uppercase tracking-wider mb-1.5">\uC7AC\uB8CC</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {materials.map(([key, amount]) => {
              const has = state.inventory.materials[key] ?? 0;
              const enough = has >= amount;
              return (
                <div key={key} className="flex items-center gap-1.5 text-sm">
                  <span>{EMOJI_MAP[key] ?? '?'}</span>
                  <span
                    className={`tabular-nums font-medium ${enough ? 'text-cream-200' : 'text-red-400'}`}
                  >
                    {has}/{amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cook button */}
        <button
          onClick={handleCook}
          disabled={!canCook}
          className="btn-wood w-full text-sm !py-2.5"
        >
          {isUnlocked ? '\uD83C\uDF73 \uC694\uB9AC' : '\uD83D\uDD12 \uC7A0\uAE40'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Recipe Grid Item
// ============================================================

function RecipeGridItem({
  recipe,
  onTap,
}: {
  recipe: FoodRecipe;
  onTap: () => void;
}) {
  const { state } = useGameState();
  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel || recipe.unlockLevel === 0;
  const canCook = canCookFood(state, recipe.id);
  const foodEmoji = FOOD_EMOJI[recipe.id] ?? '\uD83C\uDF5E';

  return (
    <button
      onClick={onTap}
      className={`
        relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all active:scale-95
        ${isUnlocked
          ? canCook
            ? 'bg-white/15 border-green-400/40 shadow-[inset_0_-2px_8px_rgba(74,222,128,0.1)]'
            : 'bg-white/15 border-white/20'
          : 'bg-white/10 border-white/10 opacity-50'
        }
      `}
    >
      {/* Can-cook indicator dot */}
      {isUnlocked && canCook && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <span className="absolute top-1.5 right-1.5 text-[10px] bg-black/50 text-cream-200 px-1.5 py-0.5 rounded-full leading-none">
          {'\uD83D\uDD12'}{recipe.unlockLevel}
        </span>
      )}

      {/* Food emoji */}
      <span className="text-[28px] leading-none">{foodEmoji}</span>

      {/* Recipe name */}
      <span className="text-[11px] text-cream-200 font-medium text-center leading-tight truncate w-full">
        {recipe.name}
      </span>
    </button>
  );
}

// ============================================================
// Food Inventory Grid
// ============================================================

function FoodInventory() {
  const { state } = useGameState();
  const foods = state.inventory.food;

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
      <div className="text-center py-3">
        <p className="text-xs text-cream-400 italic">\uBCF4\uC720\uD55C \uC74C\uC2DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {grouped.map(({ food, count }) => {
        const matchedEmoji =
          Object.entries(FOOD_EMOJI).find(
            ([key]) => food.name === FOOD_RECIPES.find((r) => r.id === key)?.name
          )?.[1] ?? '\uD83C\uDF5E';

        return (
          <div
            key={food.name}
            className="relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-white/10 border border-white/15"
          >
            <span className="text-2xl">{matchedEmoji}</span>
            <span className="text-[10px] text-cream-300 truncate w-full text-center">{food.name}</span>
            {/* Count badge */}
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-cream-100 bg-amber-700/90 rounded-full px-1 border border-amber-500/40">
              {count}
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
  const [selectedRecipe, setSelectedRecipe] = useState<FoodRecipe | null>(null);

  const kitchenMaterials: MaterialKey[] = [
    'gold', 'wheat', 'potato', 'carrot', 'apple', 'meat',
  ];

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/kitchen.png')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        {/* Header */}
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">
          {'\uD83C\uDF73'} \uC8FC\uBC29
        </h1>

        {/* Recipe grid */}
        <div>
          <h2 className="font-serif font-bold text-sm text-cream-100 mb-2 drop-shadow">
            {'\uD83D\uDCD6'} \uB808\uC2DC\uD53C
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {FOOD_RECIPES.map((recipe) => (
              <RecipeGridItem
                key={recipe.id}
                recipe={recipe}
                onTap={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-white/20 my-1" />

        {/* Food inventory */}
        <div>
          <h2 className="font-serif font-bold text-sm text-cream-100 mb-2 drop-shadow">
            {'\uD83C\uDF5E'} \uBCF4\uC720 \uC74C\uC2DD
          </h2>
          <FoodInventory />
        </div>

        {/* Bottom material bar */}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
          <MaterialBar materialKeys={kitchenMaterials} />
        </div>
      </div>

      {/* Detail popup */}
      {selectedRecipe && (
        <RecipeDetailPopup
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
