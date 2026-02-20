'use client';

import React, { useState } from 'react';
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
  all: '\uC804\uC2A4\uD0EF',
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
  instant: '\uC988\uC2DC',
  buff: '\uC9C0\uC18D',
};

const EFFECT_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  instant: { label: '\uC988\uC2DC', className: 'bg-cozy-red/25 text-red-300' },
  buff: { label: '\uC9C0\uC18D', className: 'bg-cozy-purple/25 text-purple-300' },
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
// Potion Detail Popup
// ============================================================

function PotionDetailPopup({
  recipe,
  onClose,
}: {
  recipe: PotionRecipe;
  onClose: () => void;
}) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel;
  const canBrew = canBrewPotion(state, recipe.id);

  const handleBrew = () => {
    actions.brewPotion(recipe.id);
    addToast(`${recipe.name} \uC591\uC870 \uC644\uB8CC!`, 'success');
    onClose();
  };

  // Effect badge
  const badge = EFFECT_TYPE_BADGE[recipe.effect] ?? EFFECT_TYPE_BADGE.instant;

  // Build effect description
  let effectDesc = '';
  if (recipe.stat && recipe.value) {
    const statLabel = STAT_LABEL[recipe.stat] ?? recipe.stat;
    const statEmoji = STAT_EMOJI[recipe.stat] ?? '';
    if (recipe.effect === 'instant') {
      effectDesc = `${statEmoji} ${statLabel} +${recipe.value} \uD68C\uBCF5`;
    } else {
      effectDesc = `${statEmoji} ${statLabel} +${recipe.value} (\uBAA8\uD5D8 1\uD68C)`;
    }
  }

  const materials = Object.entries(recipe.materials) as [MaterialKey, number][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Popup */}
      <div
        className="relative bg-gradient-to-b from-purple-900/95 to-stone-900/95 border border-purple-400/30 rounded-2xl p-5 w-full max-w-[340px] shadow-2xl"
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
          <span className="text-5xl">{'\uD83E\uDDEA'}</span>
          <h3 className="font-serif font-bold text-lg text-cream-100 drop-shadow">
            {recipe.name}
          </h3>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${badge.className}`}>
            {badge.label}
          </span>
          {!isUnlocked && (
            <span className="text-[10px] bg-black/40 text-cream-200 px-2.5 py-0.5 rounded-full mt-1">
              {'\uD83D\uDD12'} Lv.{recipe.unlockLevel} \uD544\uC694
            </span>
          )}
        </div>

        {/* Effect */}
        <div className="bg-purple-500/15 rounded-xl px-3 py-2.5 mb-3 border border-purple-400/20">
          <p className="text-[10px] text-cream-400 uppercase tracking-wider mb-1.5">\uD6A8\uACFC</p>
          {effectDesc && (
            <p className="text-sm text-cream-100">{effectDesc}</p>
          )}
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

        {/* Brew button */}
        <button
          onClick={handleBrew}
          disabled={!canBrew}
          className="btn-wood w-full text-sm !py-2.5"
        >
          {isUnlocked ? '\u2697\uFE0F \uC591\uC870' : '\uD83D\uDD12 \uC7A0\uAE40'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Potion Grid Item
// ============================================================

function PotionGridItem({
  recipe,
  onTap,
}: {
  recipe: PotionRecipe;
  onTap: () => void;
}) {
  const { state } = useGameState();
  const sonLevel = state.son.stats.level;
  const isUnlocked = sonLevel >= recipe.unlockLevel;
  const canBrew = canBrewPotion(state, recipe.id);
  const badge = EFFECT_TYPE_BADGE[recipe.effect] ?? EFFECT_TYPE_BADGE.instant;

  return (
    <button
      onClick={onTap}
      className={`
        relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all active:scale-95
        ${isUnlocked
          ? canBrew
            ? 'bg-white/15 border-green-400/40 shadow-[inset_0_-2px_8px_rgba(74,222,128,0.1)]'
            : 'bg-white/15 border-purple-400/30'
          : 'bg-white/10 border-white/10 opacity-50'
        }
      `}
    >
      {/* Can-brew indicator dot */}
      {isUnlocked && canBrew && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <span className="absolute top-1.5 right-1.5 text-[10px] bg-black/50 text-cream-200 px-1.5 py-0.5 rounded-full leading-none">
          {'\uD83D\uDD12'}{recipe.unlockLevel}
        </span>
      )}

      {/* Potion emoji */}
      <span className="text-[28px] leading-none">{'\uD83E\uDDEA'}</span>

      {/* Recipe name */}
      <span className="text-[11px] text-cream-200 font-medium text-center leading-tight truncate w-full">
        {recipe.name}
      </span>

      {/* Effect type badge */}
      {isUnlocked && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium leading-none ${badge.className}`}>
          {badge.label}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Potion Inventory Grid
// ============================================================

function PotionInventory() {
  const { state } = useGameState();
  const potions = state.inventory.potions;

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
      <div className="text-center py-3">
        <p className="text-xs text-cream-400 italic">\uBCF4\uC720\uD55C \uD3EC\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {grouped.map(({ potion, count }) => {
        const effectLabel = potion.effect === 'instant' ? EFFECT_TYPE_LABEL.instant : EFFECT_TYPE_LABEL.buff;

        return (
          <div
            key={potion.name}
            className="relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-purple-500/10 border border-purple-400/20"
          >
            <span className="text-2xl">{'\uD83E\uDDEA'}</span>
            <span className="text-[10px] text-cream-300 truncate w-full text-center">{potion.name}</span>
            {/* Count badge */}
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-cream-100 bg-purple-700/90 rounded-full px-1 border border-purple-400/40">
              {count}
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
  const [selectedRecipe, setSelectedRecipe] = useState<PotionRecipe | null>(null);
  const sonLevel = state.son.stats.level;
  const isUnlocked = state.unlocks.systems.alchemy;

  const alchemyMaterials: MaterialKey[] = [
    'gold', 'redHerb', 'blueHerb', 'yellowHerb', 'monsterTeeth', 'monsterShell',
  ];

  // Locked state
  if (!isUnlocked) {
    return (
      <div className="relative min-h-[calc(100vh-140px)]">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm"
          style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/alchemy.png')" }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
          <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">
            {'\u2697\uFE0F'} \uC5F0\uAE08\uC220 \uC5F0\uAD6C\uC18C
          </h1>

          <div className="flex flex-col items-center gap-4 py-12">
            <div className="text-6xl opacity-40">{'\uD83D\uDD12'}</div>
            <p className="text-sm text-cream-200 font-medium text-center">
              {'\uD83D\uDD12'} \uC5F0\uAE08\uC220\uC740 \uC544\uB4E4 Lv.{UNLOCK_LEVELS.alchemy} \uC774\uD6C4 \uD574\uAE08\uB429\uB2C8\uB2E4
            </p>
            <p className="text-xs text-cream-400 text-center">
              \uD604\uC7AC \uC544\uB4E4 \uB808\uBCA8: Lv.{sonLevel}
            </p>
            <p className="text-xs text-cream-400 italic text-center mt-4 max-w-[280px]">
              {'\uC2E0\uBE44\uD55C \uC5F0\uAE30\uC640 \uBCF4\uB77C\uBE5B \uC561\uCCB4\uAC00 \uBD80\uAE00\uBD80\uAE00 \uB054\uC5B4\uC624\uB974\uB294 \uC5F0\uAD6C\uC18C...\n\uC544\uC9C1\uC740 \uBB38\uC774 \uC7A0\uACBC \uC788\uC2B5\uB2C8\uB2E4.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked state
  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/alchemy.png')" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        {/* Header */}
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">
          {'\u2697\uFE0F'} \uC5F0\uAE08\uC220 \uC5F0\uAD6C\uC18C
        </h1>

        {/* Recipe grid */}
        <div>
          <h2 className="font-serif font-bold text-sm text-cream-100 mb-2 drop-shadow">
            {'\uD83D\uDCD6'} \uD3EC\uC158 \uB808\uC2DC\uD53C
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {POTION_RECIPES.map((recipe) => (
              <PotionGridItem
                key={recipe.id}
                recipe={recipe}
                onTap={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-white/20 my-1" />

        {/* Potion inventory */}
        <div>
          <h2 className="font-serif font-bold text-sm text-cream-100 mb-2 drop-shadow">
            {'\uD83E\uDDEA'} \uBCF4\uC720 \uD3EC\uC158
          </h2>
          <PotionInventory />
        </div>

        {/* Bottom material bar */}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
          <MaterialBar materialKeys={alchemyMaterials} />
        </div>
      </div>

      {/* Detail popup */}
      {selectedRecipe && (
        <PotionDetailPopup
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
