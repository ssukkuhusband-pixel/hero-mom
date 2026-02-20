'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { SonAction } from '@/lib/types';
import type { Food, Potion, Book, Equipment, FurnitureKey } from '@/lib/types';
import {
  EMOJI_MAP,
  MAX_TABLE_FOOD,
} from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import ReturnModal from './ReturnModal';
import DialogueBubble from './DialogueBubble';
import QuestPanel from './QuestPanel';
import QuestBadge from './QuestBadge';

// ============================================================
// Son character emoji states
// ============================================================

const SON_STATE_EMOJI: Record<string, string> = {
  [SonAction.IDLE]: '\uD83E\uDDD1',
  [SonAction.SLEEPING]: '\uD83D\uDE34',
  [SonAction.TRAINING]: '\uD83D\uDE24',
  [SonAction.EATING]: '\uD83D\uDE0B',
  [SonAction.READING]: '\uD83E\uDD13',
  [SonAction.RESTING]: '\uD83D\uDE0C',
  [SonAction.HEALING]: '\uD83E\uDE79',
  [SonAction.DRINKING_POTION]: '\uD83D\uDE32',
  [SonAction.DEPARTING]: '\uD83D\uDEB6',
  [SonAction.ADVENTURING]: '\uD83D\uDDFA\uFE0F',
};

const ACTION_INDICATOR: Record<string, { emoji: string; label: string }> = {
  [SonAction.IDLE]: { emoji: '\uD83E\uDDD1', label: '대기 중...' },
  [SonAction.SLEEPING]: { emoji: '\uD83D\uDCA4', label: '수면 중...' },
  [SonAction.TRAINING]: { emoji: '\u2694\uFE0F', label: '훈련 중...' },
  [SonAction.EATING]: { emoji: '\uD83C\uDF7D\uFE0F', label: '식사 중...' },
  [SonAction.READING]: { emoji: '\uD83D\uDCD6', label: '독서 중...' },
  [SonAction.RESTING]: { emoji: '\uD83D\uDE0C', label: '휴식 중...' },
  [SonAction.HEALING]: { emoji: '\uD83E\uDE79', label: '회복 중...' },
  [SonAction.DRINKING_POTION]: { emoji: '\uD83E\uDDEA', label: '포션 음용 중...' },
  [SonAction.DEPARTING]: { emoji: '\uD83D\uDEB6', label: '출발 준비 중...' },
  [SonAction.ADVENTURING]: { emoji: '\u2694\uFE0F', label: '모험 중...' },
};

// ============================================================
// Spatial Layout: Furniture Positions (% based)
// ============================================================

interface Position { top: number; left: number }

// Furniture positions within the room (percentage)
const FURNITURE_POSITIONS: Record<FurnitureKey, Position> = {
  bed:           { top: 3,  left: 3  },
  desk:          { top: 4,  left: 42 },
  potionShelf:   { top: 3,  left: 73 },
  chair:         { top: 30, left: 5  },
  equipmentRack: { top: 30, left: 72 },
  dummy:         { top: 58, left: 3  },
  table:         { top: 62, left: 35 },
  door:          { top: 72, left: 73 },
};

// Son's target position when interacting with each furniture
const SON_POSITIONS: Record<FurnitureKey | 'idle', Position> = {
  bed:           { top: 12, left: 32 },
  desk:          { top: 14, left: 60 },
  potionShelf:   { top: 14, left: 68 },
  chair:         { top: 38, left: 26 },
  equipmentRack: { top: 40, left: 66 },
  dummy:         { top: 65, left: 26 },
  table:         { top: 72, left: 54 },
  door:          { top: 80, left: 68 },
  idle:          { top: 44, left: 48 },
};

// ============================================================
// Placement modal types
// ============================================================

type PlacementType = 'food' | 'potion' | 'book' | 'equipment';

// ============================================================
// Furniture Visual Illustrations
// ============================================================

interface FurnitureBaseProps {
  items?: Array<{ emoji: string; name: string }>;
  maxSlots?: number;
  onClick?: () => void;
  highlight?: boolean;
  occupied?: boolean;
  occupiedLabel?: string;
  className?: string;
  dimmed?: boolean;
}

function FurnitureWrapper({
  children,
  label,
  items = [],
  maxSlots,
  onClick,
  highlight = false,
  occupied = false,
  occupiedLabel,
  className = '',
  dimmed = false,
}: FurnitureBaseProps & { children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative flex flex-col items-center gap-0.5 p-1.5 rounded-xl
        backdrop-blur-sm transition-all duration-300
        ${dimmed
          ? 'bg-white/10 border-2 border-white/10 opacity-50'
          : highlight
            ? 'bg-white/30 border-2 border-cozy-amber shadow-[0_0_16px_rgba(212,137,63,0.5)]'
            : 'bg-white/15 border border-white/15'
        }
        ${onClick ? 'cursor-pointer hover:bg-white/25 hover:border-cozy-amber/50 hover:shadow-md active:scale-95' : 'cursor-default'}
        ${className}
      `}
    >
      {children}
      <span className="text-[9px] text-cream-100 font-medium drop-shadow-sm leading-tight">{label}</span>

      {occupied && occupiedLabel && (
        <span className="absolute -top-1.5 -right-1.5 text-sm bg-cozy-amber/90 text-cream-50 w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md border border-white/30 animate-pulse">
          {occupiedLabel}
        </span>
      )}

      {items.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center max-w-[60px]">
          {items.slice(0, 3).map((item, i) => (
            <span key={i} className="text-xs drop-shadow-sm" title={item.name}>
              {item.emoji}
            </span>
          ))}
          {items.length > 3 && (
            <span className="text-[9px] text-cream-300/70">+{items.length - 3}</span>
          )}
        </div>
      )}
      {items.length === 0 && maxSlots && (
        <span className="text-[8px] text-cream-300/60 leading-tight">
          {onClick ? '배치' : ''}
        </span>
      )}
    </button>
  );
}

// --- Bed Illustration ---
function BedIllustration() {
  return (
    <div className="relative w-14 h-10 drop-shadow-md">
      <div className="absolute bottom-0 left-0.5 right-0.5 h-6 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-md rounded-b-sm border border-amber-600/50" />
      <div className="absolute bottom-1.5 left-1.5 right-1.5 h-4 bg-gradient-to-b from-cream-100 to-cream-200 rounded-sm" />
      <div className="absolute bottom-1.5 left-1.5 right-4 h-4 bg-gradient-to-br from-blue-300 to-blue-500 rounded-sm opacity-90" />
      <div className="absolute bottom-3 right-2 w-4 h-3 bg-gradient-to-b from-cream-50 to-cream-200 rounded-md border border-cream-300/50" />
      <div className="absolute top-0 right-0.5 w-2 h-8 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-md" />
      <span className="absolute -top-1 -left-0.5 text-[10px] opacity-60">{'\uD83D\uDCA4'}</span>
    </div>
  );
}

// --- Training Dummy Illustration ---
function DummyIllustration() {
  return (
    <div className="relative w-14 h-12 drop-shadow-md flex items-end justify-center">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-10 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-gradient-to-b from-amber-700 to-amber-900 rounded-full" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-full" />
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-6 h-5 bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-lg border border-yellow-500/40" />
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-full border border-yellow-400/40" />
      <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] leading-none">{'\u00D7'}</span>
      <span className="absolute top-1 -right-0.5 text-[10px] animate-pulse">{'\uD83D\uDCA5'}</span>
    </div>
  );
}

// --- Desk Illustration ---
function DeskIllustration() {
  return (
    <div className="relative w-14 h-10 drop-shadow-md">
      <div className="absolute bottom-2.5 left-0 right-0 h-2 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm border-t border-amber-500/50" />
      <div className="absolute bottom-0 left-0.5 right-0.5 h-3 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-sm" />
      <div className="absolute bottom-4 left-2 w-4 h-3 bg-gradient-to-br from-red-400 to-red-600 rounded-sm transform -rotate-3" />
      <div className="absolute bottom-4.5 left-2.5 w-3 h-0.5 bg-cream-100/50 rounded-full" />
      <span className="absolute bottom-4 right-2 text-[10px] transform rotate-12">{'\uD83D\uDD8A\uFE0F'}</span>
      <span className="absolute -top-1 right-1 text-[10px]">{'\uD83D\uDD6F\uFE0F'}</span>
    </div>
  );
}

// --- Chair Illustration ---
function ChairIllustration() {
  return (
    <div className="relative w-12 h-11 drop-shadow-md">
      <div className="absolute top-0 left-2 right-2 h-5 bg-gradient-to-b from-amber-500 to-amber-700 rounded-t-lg border border-amber-400/30" />
      <div className="absolute top-1 left-3.5 w-0.5 h-3 bg-amber-400/40 rounded-full" />
      <div className="absolute top-1 left-5 w-0.5 h-3 bg-amber-400/40 rounded-full" />
      <div className="absolute top-1 right-3.5 w-0.5 h-3 bg-amber-400/40 rounded-full" />
      <div className="absolute top-5 left-1 right-1 h-2.5 bg-gradient-to-b from-red-400 to-red-600 rounded-sm border border-red-300/30" />
      <div className="absolute bottom-0 left-2 w-1 h-3 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-sm" />
      <div className="absolute bottom-0 right-2 w-1 h-3 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-sm" />
      <span className="absolute top-4.5 left-1/2 -translate-x-1/2 text-[8px] opacity-50">~</span>
    </div>
  );
}

// --- Dining Table Illustration ---
function TableIllustration() {
  return (
    <div className="relative w-16 h-10 drop-shadow-md">
      <div className="absolute top-2 left-0 right-0 h-2.5 bg-gradient-to-b from-amber-500 to-amber-700 rounded-md border-t border-amber-400/50" />
      <div className="absolute top-4 left-0.5 right-0.5 h-1 bg-cream-100/30 rounded-b-sm" />
      <div className="absolute bottom-0 left-1.5 w-1.5 h-4 bg-gradient-to-b from-amber-600 to-amber-900 rounded-b-sm" />
      <div className="absolute bottom-0 right-1.5 w-1.5 h-4 bg-gradient-to-b from-amber-600 to-amber-900 rounded-b-sm" />
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-cream-100/80 rounded-full border border-cream-300/50" />
      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[10px]">{'\uD83C\uDF56'}</span>
    </div>
  );
}

// --- Potion Shelf Illustration ---
function PotionShelfIllustration() {
  return (
    <div className="relative w-14 h-12 drop-shadow-md">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-800 to-amber-950 rounded-md border border-amber-700/30" />
      <div className="absolute top-3 left-0.5 right-0.5 h-0.5 bg-amber-600" />
      <div className="absolute top-7 left-0.5 right-0.5 h-0.5 bg-amber-600" />
      <span className="absolute top-0.5 left-1 text-[10px]">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-0.5 left-5 text-[10px] hue-rotate-90">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-0.5 right-1 text-[10px] hue-rotate-180">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-4 left-2 text-[10px] hue-rotate-60">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-4 right-2 text-[10px] hue-rotate-270">{'\uD83E\uDDEA'}</span>
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-400/20 rounded-full blur-sm" />
    </div>
  );
}

// --- Equipment Rack Illustration ---
function EquipmentRackIllustration() {
  return (
    <div className="relative w-14 h-12 drop-shadow-md">
      <div className="absolute bottom-0 left-1 w-1 h-11 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-sm" />
      <div className="absolute bottom-0 right-1 w-1 h-11 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-sm" />
      <div className="absolute top-0 left-1 right-1 h-1 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 rounded-full" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-b from-gray-600 to-gray-800 rounded-sm" />
      <span className="absolute top-1 left-2 text-[12px] transform -rotate-12">{'\u2694\uFE0F'}</span>
      <span className="absolute top-1 right-1.5 text-[12px]">{'\uD83D\uDEE1\uFE0F'}</span>
      <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[12px]">{'\uD83E\uDDBE'}</span>
    </div>
  );
}

// --- Door Illustration ---
function DoorIllustration({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative w-10 h-14 drop-shadow-md">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-lg border-2 border-amber-600/50" />
      <div className="absolute top-1.5 left-1.5 right-1.5 h-4.5 bg-amber-600/60 rounded-sm border border-amber-500/30" />
      <div className="absolute bottom-2 left-1.5 right-1.5 h-4 bg-amber-600/60 rounded-sm border border-amber-500/30" />
      <div className="absolute top-1/2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-yellow-300 shadow-sm" />
      {isOpen && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-yellow-100/30 rounded-t-lg animate-pulse" />
      )}
    </div>
  );
}

// ============================================================
// Speech Bubble Component (follows son)
// ============================================================

function SpeechBubble({ text, align }: { text: string; align: 'left' | 'center' | 'right' }) {
  return (
    <div className={`
      relative max-w-[180px] animate-fade-in whitespace-normal
      ${align === 'left' ? 'left-0' : align === 'right' ? 'right-0 -translate-x-full' : 'left-1/2 -translate-x-1/2'}
    `}>
      <div className="bg-cream-50/95 backdrop-blur-sm border-2 border-cream-500/80 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-serif text-cream-900 text-center italic leading-tight">
          &ldquo;{text}&rdquo;
        </p>
      </div>
      <div className={`
        absolute -bottom-2 w-0 h-0
        border-l-[6px] border-l-transparent
        border-t-[6px] border-t-cream-500/80
        border-r-[6px] border-r-transparent
        ${align === 'left' ? 'left-4' : align === 'right' ? 'right-4' : 'left-1/2 -translate-x-1/2'}
      `} />
    </div>
  );
}

// ============================================================
// Adventure Status Indicator
// ============================================================

function AdventureStatusIndicator() {
  const { state } = useGameState();
  const { adventure } = state;

  const timeInfo = useMemo(() => {
    if (!adventure?.active) {
      return { display: '0:00', percent: 0 };
    }
    const elapsed = Date.now() - adventure.startTime;
    const remaining = Math.max(0, adventure.duration - elapsed);
    const totalSecs = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const percent = Math.min(100, (elapsed / adventure.duration) * 100);
    return {
      display: `${mins}:${secs.toString().padStart(2, '0')}`,
      percent,
    };
  }, [adventure]);

  if (!adventure?.active) return null;

  return (
    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-white/10">
      <span className="text-sm animate-pulse">{'\u2694\uFE0F'}</span>
      <span className="text-xs text-cream-100 font-medium">모험 중</span>
      <span className="text-xs text-cozy-gold font-bold tabular-nums">{timeInfo.display}</span>
      <div className="w-10 h-1.5 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cozy-forest to-[#7BC67B] rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${timeInfo.percent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Placement Modal Content
// ============================================================

interface PlacementModalProps {
  type: PlacementType;
  isOpen: boolean;
  onClose: () => void;
}

function PlacementModal({ type, isOpen, onClose }: PlacementModalProps) {
  const { state } = useGameState();
  const actions = useGameActions();

  const config = useMemo(() => {
    switch (type) {
      case 'food':
        return {
          title: '\uD83C\uDF7D\uFE0F 식탁에 음식 배치',
          items: state.inventory.food,
          placed: state.home.table,
          maxSlots: MAX_TABLE_FOOD,
          getEmoji: (item: Food) => EMOJI_MAP.food,
          getName: (item: Food) => item.name,
          getDesc: (item: Food) =>
            `배고픔 +${item.hungerRestore}${item.hpRestore ? ` HP +${item.hpRestore}` : ''}${item.tempBuff ? ` ${item.tempBuff.stat === 'all' ? '전스탯' : item.tempBuff.stat.toUpperCase()} +${item.tempBuff.value}` : ''}`,
          onPlace: (idx: number) => { actions.placeFood(idx); },
          onRemove: (idx: number) => { actions.removeFood(idx); },
        };
      case 'potion':
        return {
          title: '\uD83E\uDDEA 포션 선반에 배치',
          items: state.inventory.potions,
          placed: state.home.potionShelf,
          maxSlots: state.unlocks.potionSlots,
          getEmoji: (item: Potion) => EMOJI_MAP.potion,
          getName: (item: Potion) => item.name,
          getDesc: (item: Potion) =>
            item.effect === 'instant'
              ? `HP +${item.value} (즉시)`
              : `${item.stat === 'all' ? '전스탯' : (item.stat ?? '').toUpperCase()} +${item.value} (1모험)`,
          onPlace: (idx: number) => { actions.placePotion(idx); },
          onRemove: (idx: number) => { actions.removePotion(idx); },
        };
      case 'book':
        return {
          title: '\uD83D\uDCDA 책상에 책 배치',
          items: state.inventory.books,
          placed: state.home.desk,
          maxSlots: 3,
          getEmoji: (item: Book) => EMOJI_MAP.book,
          getName: (item: Book) => item.name,
          getDesc: (item: Book) =>
            `${item.statEffect.stat.toUpperCase()} +${item.statEffect.value}`,
          onPlace: (idx: number) => { actions.placeBook(idx); },
          onRemove: (idx: number) => { actions.removeBook(idx); },
        };
      case 'equipment':
        return {
          title: '\u2694\uFE0F 장비대에 장비 배치',
          items: state.inventory.equipment,
          placed: state.home.equipmentRack,
          maxSlots: 10,
          getEmoji: (item: Equipment) => EMOJI_MAP[item.slot] ?? '\u2694\uFE0F',
          getName: (item: Equipment) => `${item.name}${item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : ''}`,
          getDesc: (item: Equipment) => {
            const stats = Object.entries(item.baseStats)
              .filter(([, v]) => v && v > 0)
              .map(([k, v]) => `${k.toUpperCase()} +${v}`)
              .join(', ');
            return stats;
          },
          onPlace: (idx: number) => {
            const eq = state.inventory.equipment[idx];
            if (eq) actions.placeEquipment(eq.id);
          },
          onRemove: (idx: number) => {
            const eq = state.home.equipmentRack[idx];
            if (eq) actions.removeEquipment(eq.id);
          },
        };
    }
  }, [type, state.inventory, state.home, state.unlocks.potionSlots, actions]);

  const isFull = config.placed.length >= config.maxSlots;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title}>
      <div className="mb-4">
        <p className="text-xs text-cream-700 mb-2">
          배치됨 ({config.placed.length}/{config.maxSlots})
        </p>
        <div className="flex flex-wrap gap-2">
          {config.placed.map((item, i) => (
            <button
              key={i}
              onClick={() => config.onRemove(i)}
              className="flex items-center gap-1.5 bg-cream-200 border border-cream-500 rounded-lg px-2.5 py-1.5 hover:bg-red-50 hover:border-red-300 transition-colors group cursor-pointer"
              title="클릭하여 회수"
            >
              <span className="text-lg">{config.getEmoji(item as never)}</span>
              <span className="text-xs font-medium text-cream-800 group-hover:text-red-600">{config.getName(item as never)}</span>
              <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">{'\u2715'}</span>
            </button>
          ))}
          {config.placed.length === 0 && (
            <p className="text-xs text-cream-500 italic">아직 배치된 아이템이 없습니다</p>
          )}
        </div>
      </div>

      <div className="border-t border-cream-400 my-3" />

      <div>
        <p className="text-xs text-cream-700 mb-2">인벤토리 ({config.items.length}개)</p>
        {config.items.length === 0 ? (
          <p className="text-xs text-cream-500 italic">배치할 수 있는 아이템이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {config.items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { config.onPlace(idx); }}
                disabled={isFull}
                className={`
                  flex items-center gap-2.5 w-full text-left
                  px-3 py-2 rounded-lg border transition-all
                  ${isFull
                    ? 'border-cream-400 bg-cream-300 opacity-50 cursor-not-allowed'
                    : 'border-cream-500 bg-cream-100 hover:border-cozy-amber hover:bg-cream-50 active:scale-[0.98]'
                  }
                `}
              >
                <span className="text-xl">{config.getEmoji(item as never)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cream-900 truncate">{config.getName(item as never)}</p>
                  <p className="text-[11px] text-cream-600">{config.getDesc(item as never)}</p>
                </div>
                {!isFull && <span className="text-xs text-cozy-amber font-bold shrink-0">배치</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFull && (
        <p className="text-xs text-cozy-red mt-2 text-center">슬롯이 가득 찼습니다</p>
      )}
    </Modal>
  );
}

// ============================================================
// Main HomePage Component
// ============================================================

export default function HomePage() {
  const { state } = useGameState();
  const { son, home, adventure } = state;

  const [placementModal, setPlacementModal] = useState<PlacementType | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Skip transition on initial render
  const isInitialRender = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => { isInitialRender.current = false; }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Track when son returns from adventure
  const prevAdventureRef = useRef(adventure?.active ?? false);
  useEffect(() => {
    const wasAdventuring = prevAdventureRef.current;
    const isAdv = adventure?.active ?? false;
    if (wasAdventuring && !isAdv && son.isHome) {
      setShowReturnModal(true);
    }
    prevAdventureRef.current = isAdv;
  }, [adventure?.active, son.isHome]);

  const isAdventuring = adventure?.active ?? false;
  const sonIsHome = son.isHome && !isAdventuring;
  const currentAction = son.currentAction;

  // Map son's action to which furniture he's at
  const activeFurniture = useMemo((): FurnitureKey | null => {
    if (!sonIsHome) return null;
    switch (currentAction) {
      case SonAction.SLEEPING: return 'bed';
      case SonAction.EATING: return 'table';
      case SonAction.TRAINING: return 'dummy';
      case SonAction.READING: return 'desk';
      case SonAction.RESTING: return 'chair';
      case SonAction.DRINKING_POTION: return 'potionShelf';
      case SonAction.DEPARTING: return 'door';
      default: return null;
    }
  }, [currentAction, sonIsHome]);

  // Son's animated position
  const sonPosition = useMemo(() => {
    if (!sonIsHome) return SonPositionDefault();
    const key = activeFurniture ?? 'idle';
    return SON_POSITIONS[key];
  }, [activeFurniture, sonIsHome]);

  // Speech bubble alignment based on son's horizontal position
  const bubbleAlign = useMemo((): 'left' | 'center' | 'right' => {
    if (sonPosition.left < 30) return 'left';
    if (sonPosition.left > 65) return 'right';
    return 'center';
  }, [sonPosition.left]);

  // Prepare item previews
  const tableItems = home.table.map((f) => ({ emoji: EMOJI_MAP.food, name: f.name }));
  const potionItems = home.potionShelf.map((p) => ({ emoji: EMOJI_MAP.potion, name: p.name }));
  const deskItems = home.desk.map((b) => ({ emoji: EMOJI_MAP.book, name: b.name }));
  const equipmentItems = home.equipmentRack.map((e) => ({ emoji: EMOJI_MAP[e.slot] ?? '\u2694\uFE0F', name: e.name }));

  const dialogue = son.dialogue;
  const activeDialogue = son.dialogueState?.activeDialogue ?? null;
  const quests = son.questState?.activeQuests ?? [];
  const completedQuests = son.questState?.completedQuests ?? [];
  const allQuests = [...quests, ...completedQuests.filter(q => state.gameTime - q.deadline < 10)];
  const actionInfo = ACTION_INDICATOR[currentAction] ?? ACTION_INDICATOR[SonAction.IDLE];
  const isDoorOpen = currentAction === SonAction.DEPARTING;

  const [showQuestPanel, setShowQuestPanel] = useState(false);

  const { respondDialogue, dismissDialogue: dismissDlg } = useGameActions();

  return (
    <>
      {/* Room container - spatial layout */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 'calc(100vh - 140px)',
          backgroundImage: "url('/hero-mom/assets/backgrounds/home.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${isAdventuring ? 'bg-black/50' : 'bg-black/30'}`} />

        {/* === Room zone hints (subtle) === */}
        <div className="absolute top-0 left-0 w-[42%] h-[28%] bg-blue-400/5 rounded-br-3xl pointer-events-none z-0" />
        <span className="absolute top-1.5 left-2 text-[8px] text-cream-200/25 pointer-events-none z-0 font-medium">침실</span>

        <div className="absolute top-0 right-0 w-[30%] h-[50%] bg-purple-400/5 rounded-bl-3xl pointer-events-none z-0" />
        <span className="absolute top-1.5 right-2 text-[8px] text-cream-200/25 pointer-events-none z-0 font-medium">보관실</span>

        <div className="absolute bottom-0 left-0 w-[55%] h-[42%] bg-amber-400/5 rounded-tr-3xl pointer-events-none z-0" />
        <span className="absolute bottom-2 left-3 text-[8px] text-cream-200/25 pointer-events-none z-0 font-medium">거실</span>

        {/* === Adventure Status (floating top-center) === */}
        {isAdventuring && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
            <AdventureStatusIndicator />
          </div>
        )}

        {/* === Furniture pieces (absolutely positioned) === */}

        {/* Bed - top left (bedroom) */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.bed.top}%`, left: `${FURNITURE_POSITIONS.bed.left}%` }}>
          <FurnitureWrapper
            label="침대"
            highlight={activeFurniture === 'bed'}
            occupied={sonIsHome && currentAction === SonAction.SLEEPING}
            occupiedLabel={'\uD83D\uDCA4'}
            dimmed={isAdventuring}
          >
            <BedIllustration />
          </FurnitureWrapper>
        </div>

        {/* Desk - top center */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.desk.top}%`, left: `${FURNITURE_POSITIONS.desk.left}%` }}>
          <FurnitureWrapper
            label="책상"
            items={deskItems}
            maxSlots={3}
            onClick={() => setPlacementModal('book')}
            highlight={activeFurniture === 'desk'}
            dimmed={isAdventuring}
          >
            <DeskIllustration />
          </FurnitureWrapper>
        </div>

        {/* Chair - left side */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.chair.top}%`, left: `${FURNITURE_POSITIONS.chair.left}%` }}>
          <FurnitureWrapper
            label="의자"
            highlight={activeFurniture === 'chair'}
            occupied={sonIsHome && currentAction === SonAction.RESTING}
            occupiedLabel={'\uD83D\uDE0C'}
            dimmed={isAdventuring}
          >
            <ChairIllustration />
          </FurnitureWrapper>
        </div>

        {/* Potion Shelf - top right */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.potionShelf.top}%`, left: `${FURNITURE_POSITIONS.potionShelf.left}%` }}>
          <FurnitureWrapper
            label="포션 선반"
            items={potionItems}
            maxSlots={state.unlocks.potionSlots}
            onClick={() => setPlacementModal('potion')}
            highlight={activeFurniture === 'potionShelf'}
            dimmed={isAdventuring}
          >
            <PotionShelfIllustration />
          </FurnitureWrapper>
        </div>

        {/* Equipment Rack - right side */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.equipmentRack.top}%`, left: `${FURNITURE_POSITIONS.equipmentRack.left}%` }}>
          <FurnitureWrapper
            label="장비대"
            items={equipmentItems}
            maxSlots={3}
            onClick={() => setPlacementModal('equipment')}
            highlight={activeFurniture === 'equipmentRack'}
            dimmed={isAdventuring}
          >
            <EquipmentRackIllustration />
          </FurnitureWrapper>
        </div>

        {/* Training Dummy - bottom left */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.dummy.top}%`, left: `${FURNITURE_POSITIONS.dummy.left}%` }}>
          <FurnitureWrapper
            label="허수아비"
            highlight={activeFurniture === 'dummy'}
            occupied={sonIsHome && currentAction === SonAction.TRAINING}
            occupiedLabel={'\u2694\uFE0F'}
            dimmed={isAdventuring}
          >
            <DummyIllustration />
          </FurnitureWrapper>
        </div>

        {/* Table - bottom center */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.table.top}%`, left: `${FURNITURE_POSITIONS.table.left}%` }}>
          <FurnitureWrapper
            label="식탁"
            items={tableItems}
            maxSlots={MAX_TABLE_FOOD}
            onClick={() => setPlacementModal('food')}
            highlight={activeFurniture === 'table'}
            dimmed={isAdventuring}
          >
            <TableIllustration />
          </FurnitureWrapper>
        </div>

        {/* Door - bottom right */}
        <div className="absolute z-10" style={{ top: `${FURNITURE_POSITIONS.door.top}%`, left: `${FURNITURE_POSITIONS.door.left}%` }}>
          <div
            className={`
              flex flex-col items-center gap-0.5 p-1.5 rounded-xl
              border transition-all duration-300 backdrop-blur-sm
              ${isDoorOpen && sonIsHome
                ? 'bg-amber-100/30 border-2 border-cozy-amber/70 shadow-[0_0_16px_rgba(212,137,63,0.5)]'
                : 'bg-white/15 border-white/15'
              }
              ${isAdventuring ? 'opacity-50' : ''}
            `}
          >
            <DoorIllustration isOpen={isDoorOpen && sonIsHome} />
            <span className="text-[9px] text-cream-100 drop-shadow-sm">
              {isDoorOpen && sonIsHome ? '출발!' : '현관문'}
            </span>
          </div>
        </div>

        {/* === Son Character (animated movement) === */}
        {sonIsHome && (
          <div
            className={`absolute z-20 ${isInitialRender.current ? '' : 'transition-all duration-700 ease-in-out'}`}
            style={{
              top: `${sonPosition.top}%`,
              left: `${sonPosition.left}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Interactive dialogue or simple speech bubble */}
            {activeDialogue ? (
              <div className="absolute bottom-full mb-1" style={{
                left: bubbleAlign === 'left' ? '0' : bubbleAlign === 'right' ? 'auto' : '50%',
                right: bubbleAlign === 'right' ? '0' : 'auto',
                transform: bubbleAlign === 'center' ? 'translateX(-50%)' : 'none',
              }}>
                <DialogueBubble
                  activeDialogue={activeDialogue}
                  onRespond={respondDialogue}
                  onDismiss={dismissDlg}
                  align={bubbleAlign}
                  gameTime={state.gameTime}
                />
              </div>
            ) : dialogue ? (
              <div className="absolute bottom-full mb-1 w-[180px]" style={{
                left: bubbleAlign === 'left' ? '0' : bubbleAlign === 'right' ? 'auto' : '50%',
                right: bubbleAlign === 'right' ? '0' : 'auto',
                transform: bubbleAlign === 'center' ? 'translateX(-50%)' : 'none',
              }}>
                <SpeechBubble text={dialogue} align={bubbleAlign} />
              </div>
            ) : null}

            {/* Action indicator chip */}
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className="text-xs animate-pulse drop-shadow-md">{actionInfo.emoji}</span>
                <span className="text-[10px] font-medium text-cream-100 drop-shadow-sm">{actionInfo.label}</span>
                {son.actionTimer > 0 && (
                  <span className="text-[9px] text-cream-200 tabular-nums drop-shadow-sm">
                    {Math.ceil(son.actionTimer)}s
                  </span>
                )}
              </div>
            </div>

            {/* Son avatar */}
            <div className="flex justify-center">
              <div
                className={`
                  w-16 h-16 rounded-full
                  bg-gradient-to-br from-amber-100/90 to-amber-200/90
                  backdrop-blur-sm
                  border-2 border-amber-300/70
                  flex items-center justify-center
                  shadow-lg
                  transition-all duration-500
                  ${currentAction === SonAction.TRAINING ? 'animate-bounce' : ''}
                  ${currentAction === SonAction.SLEEPING ? 'opacity-80' : ''}
                  ${currentAction === SonAction.DEPARTING ? 'animate-pulse' : ''}
                `}
              >
                <span className="text-3xl select-none drop-shadow-md">
                  {SON_STATE_EMOJI[currentAction] ?? '\uD83E\uDDD1'}
                </span>
              </div>
            </div>

            {/* Injury indicator */}
            {son.isInjured && (
              <div className="flex justify-center mt-0.5">
                <span className="text-[9px] bg-cozy-red/40 text-cream-100 px-1.5 py-0.5 rounded-full border border-cozy-red/40 backdrop-blur-sm">
                  {'\uD83E\uDE79'} 부상
                </span>
              </div>
            )}
          </div>
        )}

        {/* === Empty house overlay (adventuring) === */}
        {isAdventuring && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-center bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <span className="text-4xl drop-shadow-lg block mb-2">{'\uD83D\uDEB6'}</span>
              <p className="text-sm text-cream-100 font-serif drop-shadow-sm">
                아들이 모험을 떠났습니다...
              </p>
            </div>
          </div>
        )}

        {/* Empty house (not adventuring, not home - brief transition) */}
        {!son.isHome && !isAdventuring && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-center">
              <span className="text-5xl drop-shadow-lg">{'\uD83D\uDEB6'}</span>
              <p className="text-lg text-cream-100 font-serif drop-shadow-sm">
                아들이 모험을 떠났습니다...
              </p>
            </div>
          </div>
        )}

        {/* Quest Badge (top-right) */}
        <QuestBadge
          count={quests.length}
          onClick={() => setShowQuestPanel(prev => !prev)}
        />

        {/* Quest Panel (bottom) */}
        {showQuestPanel && (
          <div className="absolute bottom-0 left-0 right-0 z-30">
            <QuestPanel quests={allQuests} gameTime={state.gameTime} />
          </div>
        )}
      </div>

      {/* Placement Modal */}
      {placementModal && (
        <PlacementModal
          type={placementModal}
          isOpen={true}
          onClose={() => setPlacementModal(null)}
        />
      )}

      {/* Return Modal */}
      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
      />
    </>
  );
}

// Helper for default son position
function SonPositionDefault(): Position {
  return { top: 40, left: 48 };
}
