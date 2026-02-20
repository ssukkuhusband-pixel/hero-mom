'use client';

import React, { useState } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canBrewPotion } from '@/lib/game/crafting';
import { POTION_RECIPES, EMOJI_MAP, UNLOCK_LEVELS, fmt } from '@/lib/constants';
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
  all: '전스탯',
};

const STAT_EMOJI: Record<string, string> = {
  str: '⚔️',
  def: '🛡️',
  agi: '💨',
  int: '📖',
  hp: '❤️',
  all: '✨',
};

const EFFECT_TYPE_LABEL: Record<string, string> = {
  instant: '즉시',
  buff: '지속',
};

const EFFECT_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  instant: { label: '즉시', className: 'bg-cozy-red/25 text-red-300' },
  buff: { label: '지속', className: 'bg-cozy-purple/25 text-purple-300' },
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
            {fmt(state.inventory.materials[key])}
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
    addToast(`${recipe.name} 양조 완료!`, 'success');
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
      effectDesc = `${statEmoji} ${statLabel} +${fmt(recipe.value)} 회복`;
    } else {
      effectDesc = `${statEmoji} ${statLabel} +${fmt(recipe.value)} (모험 1회)`;
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
          {'✕'}
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1 mb-4">
          <span className="text-5xl">{'🧪'}</span>
          <h3 className="font-serif font-bold text-lg text-cream-100 drop-shadow">
            {recipe.name}
          </h3>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${badge.className}`}>
            {badge.label}
          </span>
          {!isUnlocked && (
            <span className="text-[10px] bg-black/40 text-cream-200 px-2.5 py-0.5 rounded-full mt-1">
              {'🔒'} Lv.{recipe.unlockLevel} 필요
            </span>
          )}
        </div>

        {/* Effect */}
        <div className="bg-purple-500/15 rounded-xl px-3 py-2.5 mb-3 border border-purple-400/20">
          <p className="text-[10px] text-cream-400 uppercase tracking-wider mb-1.5">효과</p>
          {effectDesc && (
            <p className="text-sm text-cream-100">{effectDesc}</p>
          )}
        </div>

        {/* Materials */}
        <div className="bg-white/10 rounded-xl px-3 py-2.5 mb-4 border border-white/10">
          <p className="text-[10px] text-cream-400 uppercase tracking-wider mb-1.5">재료</p>
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
          {isUnlocked ? '⚗️ 양조' : '🔒 잠김'}
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
          {'🔒'}{recipe.unlockLevel}
        </span>
      )}

      {/* Potion emoji */}
      <span className="text-[28px] leading-none">{'🧪'}</span>

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
        <p className="text-xs text-cream-400 italic">보유한 포션이 없습니다</p>
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
            <span className="text-2xl">{'🧪'}</span>
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
            {'⚗️'} 연금술 연구소
          </h1>

          <div className="flex flex-col items-center gap-4 py-12">
            <div className="text-6xl opacity-40">{'🔒'}</div>
            <p className="text-sm text-cream-200 font-medium text-center">
              {'🔒'} 연금술은 아들 Lv.{UNLOCK_LEVELS.alchemy} 이후 해금됩니다
            </p>
            <p className="text-xs text-cream-400 text-center">
              현재 아들 레벨: Lv.{sonLevel}
            </p>
            <p className="text-xs text-cream-400 italic text-center mt-4 max-w-[280px]">
              {'신비한 연기와 보랏빛 액체가 부글부글 끓어오르는 연구소...\n아직은 문이 잠겨 있습니다.'}
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
          {'⚗️'} 연금술 연구소
        </h1>

        {/* Recipe grid */}
        <div>
          <h2 className="font-serif font-bold text-sm text-cream-100 mb-2 drop-shadow">
            {'📖'} 포션 레시피
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
            {'🧪'} 보유 포션
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
