'use client';

import React, { useMemo } from 'react';
import { useGameState } from '@/lib/gameState';
import { EMOJI_MAP } from '@/lib/constants';
import type { BattleResult, MaterialKey, AdventureResult } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';

// ============================================================
// Battle outcome display
// ============================================================

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  overwhelming: { label: '\uC644\uC2B9', color: 'text-cozy-gold' },
  victory: { label: '\uC2B9\uB9AC', color: 'text-cozy-forest' },
  narrow: { label: '\uC2E0\uC2B9', color: 'text-cozy-amber' },
  defeat: { label: '\uD328\uBC30', color: 'text-cozy-red' },
};

// ============================================================
// Material names for display
// ============================================================

const MATERIAL_NAMES: Partial<Record<MaterialKey, string>> = {
  gold: '\uACE8\uB4DC',
  wood: '\uB098\uBB34',
  leather: '\uAC00\uC8FD',
  ironOre: '\uCCA0\uAD11\uC11D',
  mithril: '\uBBF8\uC2A4\uB9B4',
  gems: '\uBCF4\uC11D',
  enhancementStones: '\uAC15\uD654\uC11D',
  specialOre: '\uD2B9\uC218 \uAD11\uC11D',
  monsterTeeth: '\uBAC0\uC2A4\uD130 \uC774\uBE68',
  monsterShell: '\uBAC0\uC2A4\uD130 \uAECD\uC9C8',
  meat: '\uACE0\uAE30',
  wheat: '\uBC00',
  potato: '\uAC10\uC790',
  carrot: '\uB2F9\uADFC',
  apple: '\uC0AC\uACFC',
  redHerb: '\uBD89\uC740 \uC57D\uCD08',
  blueHerb: '\uD478\uB978 \uC57D\uCD08',
  yellowHerb: '\uB178\uB780 \uC57D\uCD08',
  wheatSeed: '\uBC00 \uC528\uC557',
  potatoSeed: '\uAC10\uC790 \uC528\uC557',
  carrotSeed: '\uB2F9\uADFC \uC528\uC557',
  appleSeed: '\uC0AC\uACFC \uC528\uC557',
  redHerbSeed: '\uBD89\uC740 \uC57D\uCD08 \uC528\uC557',
  blueHerbSeed: '\uD478\uB978 \uC57D\uCD08 \uC528\uC557',
  yellowHerbSeed: '\uB178\uB780 \uC57D\uCD08 \uC528\uC557',
};

// ============================================================
// ReturnModal Component
// ============================================================

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnModal({ isOpen, onClose }: ReturnModalProps) {
  const { state } = useGameState();
  const { son, lastAdventureResult } = state;

  // Use the saved adventure result snapshot (persisted after adventure completes)
  const adventureData = lastAdventureResult;

  // Compute battle summary
  const battleSummary = useMemo(() => {
    if (!adventureData?.battleResults) {
      return { total: 0, overwhelming: 0, victory: 0, narrow: 0, defeat: 0 };
    }
    const results = adventureData.battleResults;
    return {
      total: results.length,
      overwhelming: results.filter((b) => b.outcome === 'overwhelming').length,
      victory: results.filter((b) => b.outcome === 'victory').length,
      narrow: results.filter((b) => b.outcome === 'narrow').length,
      defeat: results.filter((b) => b.outcome === 'defeat').length,
    };
  }, [adventureData?.battleResults]);

  // Compute rewards list
  const rewardsList = useMemo(() => {
    if (!adventureData?.rewards) return [];
    return Object.entries(adventureData.rewards)
      .filter(([, v]) => v && v > 0)
      .map(([key, value]) => ({
        key: key as MaterialKey,
        emoji: EMOJI_MAP[key] ?? '\u2753',
        name: MATERIAL_NAMES[key as MaterialKey] ?? key,
        amount: value!,
      }));
  }, [adventureData?.rewards]);

  const expGained = adventureData?.expGained ?? 0;
  const failed = adventureData?.failed ?? false;

  // Determine son's return state
  const hpPercent = son.stats.maxHp > 0
    ? (son.stats.hp / son.stats.maxHp) * 100
    : 100;

  const returnMood = useMemo(() => {
    if (failed) return { emoji: '\uD83D\uDE22', label: '\uBAA8\uD5D8; \uC2E4\uD328...', bgClass: 'from-red-50 to-red-100' };
    if (hpPercent < 50) return { emoji: '\uD83D\uDE23', label: '\uBD80\uC0C1 \uADC0\uD658', bgClass: 'from-orange-50 to-amber-100' };
    return { emoji: '\uD83D\uDE0A', label: '\uBB34\uC0AC \uADC0\uD658!', bgClass: 'from-amber-50 to-yellow-100' };
  }, [failed, hpPercent]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-serif font-bold text-xl text-cream-950 mb-1">
            {'\uD83C\uDFE0'} &#xC544;&#xB4E4;&#xC774; &#xB3CC;&#xC544;&#xC654;&#xC2B5;&#xB2C8;&#xB2E4;!
          </h2>
          <p className="text-sm text-cream-600">{returnMood.label}</p>
        </div>

        {/* Son character */}
        <div
          className={`
            w-20 h-20 rounded-full
            bg-gradient-to-br ${returnMood.bgClass}
            border-3 border-amber-300
            flex items-center justify-center
            shadow-lg
          `}
        >
          <span className="text-4xl select-none">{returnMood.emoji}</span>
        </div>

        {/* Injury notice */}
        {son.isInjured && (
          <div className="flex items-center gap-2 bg-cozy-red/10 border border-cozy-red/30 rounded-lg px-3 py-2 w-full">
            <span>{'\uD83E\uDE79'}</span>
            <p className="text-sm text-cozy-red font-medium">
              &#xC544;&#xB4E4;&#xC774; &#xBD80;&#xC0C1;&#xC744; &#xC785;&#xC5C8;&#xC2B5;&#xB2C8;&#xB2E4;. &#xD68C;&#xBCF5;&#xC774; &#xD544;&#xC694;&#xD569;&#xB2C8;&#xB2E4;.
            </p>
          </div>
        )}

        {failed && (
          <div className="flex items-center gap-2 bg-cozy-red/10 border border-cozy-red/30 rounded-lg px-3 py-2 w-full">
            <span>{'\u26A0\uFE0F'}</span>
            <p className="text-sm text-cozy-red font-medium">
              &#xBAA8;&#xD5D8; &#xC2E4;&#xD328;&#xB85C; &#xBCF4;&#xC0C1;&#xC774; 50% &#xAC10;&#xC18C;&#xB418;&#xC5C8;&#xC2B5;&#xB2C8;&#xB2E4;.
            </p>
          </div>
        )}

        {/* HP Bar */}
        <div className="w-full">
          <ProgressBar
            current={son.stats.hp}
            max={son.stats.maxHp}
            color="hp"
            label={`${EMOJI_MAP.hp} HP`}
            showValues
            size="md"
          />
        </div>

        {/* Battle Summary */}
        <div className="w-full bg-cream-200 border border-cream-400 rounded-xl p-3">
          <h3 className="text-xs font-bold text-cream-700 mb-2">
            {'\u2694\uFE0F'} &#xBAA8;&#xD5D8; &#xC694;&#xC57D;
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-cream-700">
              &#xC804;&#xD22C;: {battleSummary.total}&#xD68C;
            </span>
            <div className="flex gap-2 text-xs">
              {battleSummary.overwhelming > 0 && (
                <span className={OUTCOME_LABELS.overwhelming.color}>
                  &#xC644;&#xC2B9; {battleSummary.overwhelming}
                </span>
              )}
              {battleSummary.victory > 0 && (
                <span className={OUTCOME_LABELS.victory.color}>
                  &#xC2B9;&#xB9AC; {battleSummary.victory}
                </span>
              )}
              {battleSummary.narrow > 0 && (
                <span className={OUTCOME_LABELS.narrow.color}>
                  &#xC2E0;&#xC2B9; {battleSummary.narrow}
                </span>
              )}
              {battleSummary.defeat > 0 && (
                <span className={OUTCOME_LABELS.defeat.color}>
                  &#xD328;&#xBC30; {battleSummary.defeat}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1.5 text-xs text-cream-600">
            &#xD69D;&#xB4DD; EXP: <span className="font-bold text-cozy-teal">{expGained}</span>
          </div>
        </div>

        {/* Rewards */}
        {rewardsList.length > 0 && (
          <div className="w-full bg-cream-200 border border-cream-400 rounded-xl p-3">
            <h3 className="text-xs font-bold text-cream-700 mb-2">
              {'\uD83C\uDF81'} &#xBCF4;&#xC0C1;
            </h3>
            <div className="flex flex-wrap gap-2">
              {rewardsList.map((reward) => (
                <div
                  key={reward.key}
                  className="flex items-center gap-1 bg-cream-100 border border-cream-400 rounded-lg px-2 py-1"
                >
                  <span className="text-base">{reward.emoji}</span>
                  <span className="text-xs text-cream-800 font-medium">
                    {reward.name}
                  </span>
                  <span className="text-xs font-bold text-cozy-amber">
                    x{reward.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="
            w-full mt-2
            bg-gradient-to-b from-cozy-amber to-cozy-amber-dark
            border-2 border-[#A06520] rounded-xl
            px-6 py-3
            text-cream-100 font-serif font-bold text-base
            shadow-[0_2px_0_#8B5218,0_4px_8px_rgba(61,43,31,0.2)]
            hover:from-[#E09A50] hover:to-[#C88030]
            hover:-translate-y-0.5
            active:translate-y-0.5
            active:shadow-[0_1px_0_#8B5218,0_2px_4px_rgba(61,43,31,0.2)]
            transition-all duration-150
          "
        >
          &#xD655;&#xC778;
        </button>
      </div>
    </Modal>
  );
}
