'use client';

import React from 'react';
import { useGameState } from '@/lib/gameState';
import { EMOJI_MAP, GRADE_COLORS, fmt } from '@/lib/constants';
import { SonAction } from '@/lib/types';
import type { Equipment, EquipmentSlot } from '@/lib/types';
import { calculateEquipmentStats } from '@/lib/game/crafting';
import ProgressBar from '@/components/ui/ProgressBar';

// ============================================================
// Constants
// ============================================================

const SLOT_EMOJI: Record<EquipmentSlot, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  accessory: '💍',
};

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구',
};

const STAT_CONFIG: { key: string; label: string; emoji: string; color: string }[] = [
  { key: 'str', label: 'STR', emoji: '⚔️', color: 'text-red-400' },
  { key: 'def', label: 'DEF', emoji: '🛡️', color: 'text-blue-400' },
  { key: 'agi', label: 'AGI', emoji: '💨', color: 'text-green-400' },
  { key: 'int', label: 'INT', emoji: '📖', color: 'text-purple-400' },
];

const ACTION_LABEL: Record<string, string> = {
  [SonAction.IDLE]: '대기 중',
  [SonAction.SLEEPING]: '수면 중',
  [SonAction.TRAINING]: '훈련 중',
  [SonAction.EATING]: '식사 중',
  [SonAction.READING]: '독서 중',
  [SonAction.RESTING]: '휴식 중',
  [SonAction.HEALING]: '회복 중',
  [SonAction.DRINKING_POTION]: '포션 음용 중',
  [SonAction.DEPARTING]: '출발 준비 중',
  [SonAction.ADVENTURING]: '모험 중',
};

// ============================================================
// Equipment Slot Card
// ============================================================

function EquipmentSlotCard({ slot, equipment }: { slot: EquipmentSlot; equipment: Equipment | null }) {
  if (!equipment) {
    return (
      <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-3 py-2.5">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
          <span className="text-lg opacity-30">{SLOT_EMOJI[slot]}</span>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-cream-400 uppercase tracking-wider">{SLOT_LABEL[slot]}</p>
          <p className="text-xs text-cream-500 italic">미장착</p>
        </div>
      </div>
    );
  }

  const stats = calculateEquipmentStats(equipment);
  const statEntries = Object.entries(stats).filter(([, v]) => v > 0);
  const gradeColor = GRADE_COLORS[equipment.grade];

  return (
    <div
      className="flex items-center gap-2.5 bg-white/10 border rounded-xl px-3 py-2.5 transition-all"
      style={{ borderColor: `${gradeColor}40` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center border"
        style={{
          borderColor: `${gradeColor}60`,
          background: `linear-gradient(135deg, ${gradeColor}15 0%, ${gradeColor}08 100%)`,
          boxShadow: `0 0 8px ${gradeColor}20`,
        }}
      >
        <span className="text-lg">{SLOT_EMOJI[slot]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-cream-100 truncate">
            {equipment.name}
            {equipment.enhanceLevel > 0 && (
              <span className="text-cozy-amber ml-1">+{equipment.enhanceLevel}</span>
            )}
          </p>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize"
            style={{ color: gradeColor, backgroundColor: `${gradeColor}20` }}
          >
            {equipment.grade}
          </span>
        </div>
        <div className="flex gap-2 mt-0.5">
          {statEntries.map(([stat, val]) => (
            <span key={stat} className="text-[10px] text-cream-300">
              {stat.toUpperCase()} +{val}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Buff List
// ============================================================

function BuffList() {
  const { state } = useGameState();
  const buffs = state.son.tempBuffs;

  if (buffs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {buffs.map((buff, i) => (
        <span
          key={i}
          className="text-[10px] bg-cozy-purple/20 text-cozy-purple border border-cozy-purple/30 rounded-full px-2 py-0.5"
        >
          ✨ {buff.stat === 'all' ? '전스탯' : buff.stat.toUpperCase()} +{buff.value}
          <span className="text-cream-400 ml-1">({buff.source})</span>
        </span>
      ))}
    </div>
  );
}

// ============================================================
// Main SonStatusPanel Component
// ============================================================

interface SonStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SonStatusPanel({ isOpen, onClose }: SonStatusPanelProps) {
  const { state } = useGameState();
  const { son } = state;
  const { stats, equipment, currentAction, isInjured } = son;
  const mood = son.dialogueState?.mood ?? 50;

  if (!isOpen) return null;

  // Calculate total stats from equipment
  const equipStats: Record<string, number> = {};
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];
  for (const slot of slots) {
    const eq = equipment[slot];
    if (eq) {
      const computed = calculateEquipmentStats(eq);
      for (const [k, v] of Object.entries(computed)) {
        equipStats[k] = (equipStats[k] ?? 0) + v;
      }
    }
  }

  const moodEmoji = mood >= 80 ? '😊' : mood >= 60 ? '🙂' : mood >= 40 ? '😐' : mood >= 20 ? '😟' : '😢';
  const moodLabel = mood >= 80 ? '매우 좋음' : mood >= 60 ? '좋음' : mood >= 40 ? '보통' : mood >= 20 ? '나쁨' : '매우 나쁨';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel - slides up from bottom */}
      <div
        className="relative w-full max-w-[480px] bg-gradient-to-b from-cream-900 to-cream-950 rounded-t-3xl px-4 pt-4 pb-8 max-h-[85vh] overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-cream-600 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-cream-400 hover:bg-white/20 transition-colors"
        >
          ✕
        </button>

        {/* === Character Header === */}
        <div className="flex items-center gap-4 mb-5">
          {/* Son avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100/20 to-amber-200/10 border-2 border-amber-300/30 flex items-center justify-center overflow-hidden">
              <img
                src="/hero-mom/assets/characters/son.png"
                alt="아들"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl">🧑</span>';
                }}
              />
            </div>
            {isInjured && (
              <span className="absolute -top-1 -right-1 text-sm">🩹</span>
            )}
          </div>

          {/* Name & Level */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-cream-100">아들</h2>
              <span className="text-sm font-bold text-cozy-gold bg-cozy-gold/15 px-2 py-0.5 rounded-lg">
                Lv.{stats.level}
              </span>
            </div>
            <p className="text-xs text-cream-400 mb-1.5">
              {ACTION_LABEL[currentAction] ?? '대기 중'}
              {isInjured && ' · 🩹 부상'}
            </p>
            {/* EXP bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cream-400">EXP</span>
              <ProgressBar
                current={stats.exp}
                max={stats.maxExp}
                color="exp"
                size="sm"
                showValues={false}
                className="flex-1"
              />
              <span className="text-[10px] text-cream-400 tabular-nums">
                {fmt(stats.exp)}/{fmt(stats.maxExp)}
              </span>
            </div>
          </div>
        </div>

        {/* === HP & Hunger Bars === */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/8 rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cream-300">❤️ HP</span>
              <span className="text-xs text-cream-200 tabular-nums font-medium">
                {fmt(stats.hp)}/{fmt(stats.maxHp)}
              </span>
            </div>
            <ProgressBar current={stats.hp} max={stats.maxHp} color="hp" size="sm" showValues={false} />
          </div>
          <div className="bg-white/8 rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cream-300">🍖 포만감</span>
              <span className="text-xs text-cream-200 tabular-nums font-medium">
                {fmt(stats.hunger)}/{fmt(stats.maxHunger)}
              </span>
            </div>
            <ProgressBar current={stats.hunger} max={stats.maxHunger} color="hunger" size="sm" showValues={false} />
          </div>
        </div>

        {/* === Core Stats === */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-cream-400 uppercase tracking-wider mb-2">전투 스탯</h3>
          <div className="grid grid-cols-4 gap-2">
            {STAT_CONFIG.map(({ key, label, emoji, color }) => {
              const base = stats[key as keyof typeof stats] as number;
              const bonus = equipStats[key] ?? 0;
              return (
                <div key={key} className="bg-white/8 rounded-xl p-2.5 text-center">
                  <span className="text-lg block mb-0.5">{emoji}</span>
                  <p className={`text-sm font-bold ${color}`}>{base}</p>
                  {bonus > 0 && (
                    <p className="text-[9px] text-green-400">+{bonus}</p>
                  )}
                  <p className="text-[9px] text-cream-500 mt-0.5">{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* === Mood === */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-cream-400 uppercase tracking-wider mb-2">기분</h3>
          <div className="bg-white/8 rounded-xl px-3 py-2.5 flex items-center gap-3">
            <span className="text-2xl">{moodEmoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-cream-200 font-medium">{moodLabel}</span>
                <span className="text-xs text-cream-400 tabular-nums">{fmt(mood)}/100</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${mood}%`,
                    background: mood >= 60
                      ? 'linear-gradient(90deg, #5B8C5A, #7BC67B)'
                      : mood >= 40
                        ? 'linear-gradient(90deg, #E8B84A, #D4893F)'
                        : 'linear-gradient(90deg, #C85454, #E07070)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* === Active Buffs === */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-cream-400 uppercase tracking-wider mb-2">활성 버프</h3>
          <BuffList />
          {son.tempBuffs.length === 0 && (
            <p className="text-xs text-cream-500 italic">활성 버프 없음</p>
          )}
        </div>

        {/* === Equipment === */}
        <div>
          <h3 className="text-xs font-bold text-cream-400 uppercase tracking-wider mb-2">장착 장비</h3>
          <div className="flex flex-col gap-2">
            <EquipmentSlotCard slot="weapon" equipment={equipment.weapon} />
            <EquipmentSlotCard slot="armor" equipment={equipment.armor} />
            <EquipmentSlotCard slot="accessory" equipment={equipment.accessory} />
          </div>
        </div>
      </div>
    </div>
  );
}
