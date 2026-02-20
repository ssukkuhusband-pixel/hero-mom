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
  overwhelming: { label: '완승', color: 'text-cozy-gold' },
  victory: { label: '승리', color: 'text-cozy-forest' },
  narrow: { label: '신승', color: 'text-cozy-amber' },
  defeat: { label: '패배', color: 'text-cozy-red' },
};

// ============================================================
// Material names for display
// ============================================================

const MATERIAL_NAMES: Partial<Record<MaterialKey, string>> = {
  gold: '골드',
  wood: '나무',
  leather: '가죽',
  ironOre: '철광석',
  mithril: '미스릴',
  gems: '보석',
  enhancementStones: '강화석',
  specialOre: '특수 광석',
  monsterTeeth: '몬스터 이빨',
  monsterShell: '몬스터 껍질',
  meat: '고기',
  wheat: '밀',
  potato: '감자',
  carrot: '당근',
  apple: '사과',
  redHerb: '붉은 약초',
  blueHerb: '푸른 약초',
  yellowHerb: '노란 약초',
  wheatSeed: '밀 씨앗',
  potatoSeed: '감자 씨앗',
  carrotSeed: '당근 씨앗',
  appleSeed: '사과 씨앗',
  redHerbSeed: '붉은 약초 씨앗',
  blueHerbSeed: '푸른 약초 씨앗',
  yellowHerbSeed: '노란 약초 씨앗',
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
        emoji: EMOJI_MAP[key] ?? '❓',
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
    if (failed) return { emoji: '😢', label: '모험 실패...', bgClass: 'from-red-50 to-red-100' };
    if (hpPercent < 50) return { emoji: '😣', label: '부상 귀환', bgClass: 'from-orange-50 to-amber-100' };
    return { emoji: '😊', label: '무사 귀환!', bgClass: 'from-amber-50 to-yellow-100' };
  }, [failed, hpPercent]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-serif font-bold text-xl text-cream-950 mb-1">
            {'🏠'} 아들이 돌아왔습니다!
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
            <span>{'🩹'}</span>
            <p className="text-sm text-cozy-red font-medium">
              아들이 부상을 입었습니다. 회복이 필요합니다.
            </p>
          </div>
        )}

        {failed && (
          <div className="flex items-center gap-2 bg-cozy-red/10 border border-cozy-red/30 rounded-lg px-3 py-2 w-full">
            <span>{'⚠️'}</span>
            <p className="text-sm text-cozy-red font-medium">
              모험 실패로 보상이 50% 감소되었습니다.
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
            {'⚔️'} 모험 요약
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-cream-700">
              전투: {battleSummary.total}회
            </span>
            <div className="flex gap-2 text-xs">
              {battleSummary.overwhelming > 0 && (
                <span className={OUTCOME_LABELS.overwhelming.color}>
                  완승 {battleSummary.overwhelming}
                </span>
              )}
              {battleSummary.victory > 0 && (
                <span className={OUTCOME_LABELS.victory.color}>
                  승리 {battleSummary.victory}
                </span>
              )}
              {battleSummary.narrow > 0 && (
                <span className={OUTCOME_LABELS.narrow.color}>
                  신승 {battleSummary.narrow}
                </span>
              )}
              {battleSummary.defeat > 0 && (
                <span className={OUTCOME_LABELS.defeat.color}>
                  패배 {battleSummary.defeat}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1.5 text-xs text-cream-600">
            획득 EXP: <span className="font-bold text-cozy-teal">{expGained}</span>
          </div>
        </div>

        {/* Rewards */}
        {rewardsList.length > 0 && (
          <div className="w-full bg-cream-200 border border-cream-400 rounded-xl p-3">
            <h3 className="text-xs font-bold text-cream-700 mb-2">
              {'🎁'} 보상
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

        {/* Book rewards */}
        {(adventureData?.bookRewards ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(adventureData?.bookRewards ?? []).map((book) => (
              <span key={book.id} className="inline-flex items-center gap-1 bg-cream-100 border border-cream-500 rounded-lg px-2 py-1 text-xs">
                <span>{EMOJI_MAP.book ?? '📚'}</span>
                <span className="font-medium text-cream-900">{book.name}</span>
              </span>
            ))}
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
          확인
        </button>
      </div>
    </Modal>
  );
}
