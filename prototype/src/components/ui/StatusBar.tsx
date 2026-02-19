'use client';

import React, { useMemo } from 'react';
import { useGameState } from '@/lib/gameState';
import { EMOJI_MAP } from '@/lib/constants';
import { SonAction } from '@/lib/types';
import ProgressBar from './ProgressBar';

// Map son actions to display labels and emojis
const ACTION_DISPLAY: Record<
  string,
  { label: string; emoji: string }
> = {
  [SonAction.IDLE]: { label: '대기 중', emoji: EMOJI_MAP.resting },
  [SonAction.SLEEPING]: { label: '수면 중', emoji: EMOJI_MAP.sleeping },
  [SonAction.TRAINING]: { label: '훈련 중', emoji: EMOJI_MAP.training },
  [SonAction.EATING]: { label: '식사 중', emoji: EMOJI_MAP.eating },
  [SonAction.READING]: { label: '독서 중', emoji: EMOJI_MAP.reading },
  [SonAction.RESTING]: { label: '휴식 중', emoji: EMOJI_MAP.resting },
  [SonAction.HEALING]: { label: '회복 중', emoji: EMOJI_MAP.hp },
  [SonAction.DRINKING_POTION]: { label: '포션 음용', emoji: EMOJI_MAP.potion },
  [SonAction.DEPARTING]: { label: '출발 준비', emoji: EMOJI_MAP.departing },
  [SonAction.ADVENTURING]: { label: '모험 중...', emoji: EMOJI_MAP.adventuring },
};

interface StatusBarProps {
  onOpenInventory?: () => void;
}

export default function StatusBar({ onOpenInventory }: StatusBarProps) {
  const { state } = useGameState();
  const { son, inventory, adventure } = state;
  const { stats, currentAction, isInjured } = son;

  const isAdventuring = adventure?.active ?? false;
  const gold = inventory.materials.gold;

  // Adventure remaining time
  const adventureTimeLeft = useMemo(() => {
    if (!adventure?.active) return '';
    const elapsed = Date.now() - adventure.startTime;
    const remaining = Math.max(0, adventure.duration - elapsed);
    const totalSecs = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [adventure]);

  const actionInfo = ACTION_DISPLAY[currentAction] ?? ACTION_DISPLAY[SonAction.IDLE];

  const bgClass = isAdventuring
    ? 'bg-[#2A3D2B]'
    : 'bg-cream-900';

  return (
    <header
      className={`
        fixed top-0 left-1/2 -translate-x-1/2
        w-full max-w-[480px] z-40
        ${bgClass}
        px-3 py-2
        shadow-[0_2px_8px_rgba(44,24,16,0.3)]
        transition-colors duration-300
      `}
    >
      {/* Top row: name/level + gold + bag */}
      <div className="flex items-center justify-between mb-1.5">
        {/* Left: Son name + level */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-cozy-gold">
            {EMOJI_MAP.level} Lv.{stats.level}
          </span>
          <span className="text-sm font-serif font-bold text-cream-100">
            아들
          </span>
          {isInjured && (
            <span className="text-sm" title="부상">
              {'\uD83E\uDE79'}
            </span>
          )}
        </div>

        {/* Right: Gold + current action + bag */}
        <div className="flex items-center gap-2.5">
          {/* Current action */}
          <div className="flex items-center gap-1 text-cream-300 text-xs">
            <span>{actionInfo.emoji}</span>
            <span>{isAdventuring ? `모험 중 ${adventureTimeLeft}` : actionInfo.label}</span>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-0.5 text-cozy-gold text-sm font-bold tabular-nums">
            <span>{EMOJI_MAP.gold}</span>
            <span>{gold}</span>
          </div>

          {/* Inventory bag button */}
          <button
            onClick={onOpenInventory}
            className="w-8 h-8 flex items-center justify-center
                       rounded-lg text-lg
                       bg-cream-800 hover:bg-cream-700
                       transition-colors"
            aria-label="인벤토리"
          >
            {'\uD83C\uDF92'}
          </button>
        </div>
      </div>

      {/* Bottom row: HP + Hunger + EXP bars */}
      <div className="flex items-center gap-2">
        {/* HP bar */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xs shrink-0">{EMOJI_MAP.hp}</span>
          <ProgressBar
            current={stats.hp}
            max={stats.maxHp}
            color="hp"
            size="sm"
            showValues={false}
          />
        </div>

        {/* Hunger bar */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xs shrink-0">{EMOJI_MAP.hunger}</span>
          <ProgressBar
            current={stats.hunger}
            max={stats.maxHunger}
            color="hunger"
            size="sm"
            showValues={false}
          />
        </div>

        {/* EXP bar */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xs shrink-0">{EMOJI_MAP.exp}</span>
          <ProgressBar
            current={stats.exp}
            max={stats.maxExp}
            color="exp"
            size="sm"
            showValues={false}
          />
        </div>
      </div>
    </header>
  );
}
