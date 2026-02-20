'use client';

import React from 'react';
import { SonAction } from '@/lib/types';
import type { FurnitureKey } from '@/lib/types';
import { MAX_TABLE_FOOD } from '@/lib/constants';
import type { PlacementType } from './PlacementModal';

// ============================================================
// Furniture Illustrations (CSS-based)
// ============================================================

export function BedIllustration() {
  return (
    <div className="relative w-20 h-14 drop-shadow-md">
      <div className="absolute bottom-0 left-1 right-1 h-8 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-md rounded-b-sm border border-amber-600/50" />
      <div className="absolute bottom-2 left-2.5 right-2.5 h-5 bg-gradient-to-b from-cream-100 to-cream-200 rounded-sm" />
      <div className="absolute bottom-2 left-2.5 right-6 h-5 bg-gradient-to-br from-blue-300 to-blue-500 rounded-sm opacity-90" />
      <div className="absolute bottom-4 right-3 w-5 h-4 bg-gradient-to-b from-cream-50 to-cream-200 rounded-md border border-cream-300/50" />
      <div className="absolute top-0 right-1 w-3 h-11 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-md" />
      <span className="absolute -top-1 left-0 text-sm opacity-60">{'\uD83D\uDCA4'}</span>
    </div>
  );
}

export function DummyIllustration() {
  return (
    <div className="relative w-20 h-16 drop-shadow-md flex items-end justify-center">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-14 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-2 bg-gradient-to-b from-amber-700 to-amber-900 rounded-full" />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-full" />
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-6 bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-lg border border-yellow-500/40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-full border border-yellow-400/40" />
      <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] leading-none">{'\u00D7'}</span>
      <span className="absolute top-1 -right-0 text-sm animate-pulse">{'\uD83D\uDCA5'}</span>
    </div>
  );
}

export function DeskIllustration() {
  return (
    <div className="relative w-20 h-14 drop-shadow-md">
      <div className="absolute bottom-4 left-0 right-0 h-3 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm border-t border-amber-500/50" />
      <div className="absolute bottom-0 left-1 right-1 h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-sm" />
      <div className="absolute bottom-6 left-3 w-5 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-sm transform -rotate-3" />
      <div className="absolute bottom-6.5 left-3.5 w-4 h-0.5 bg-cream-100/50 rounded-full" />
      <span className="absolute bottom-6 right-3 text-sm transform rotate-12">{'\uD83D\uDD8A\uFE0F'}</span>
      <span className="absolute top-0 right-2 text-sm">{'\uD83D\uDD6F\uFE0F'}</span>
    </div>
  );
}

export function ChairIllustration() {
  return (
    <div className="relative w-16 h-16 drop-shadow-md">
      <div className="absolute top-0 left-2 right-2 h-7 bg-gradient-to-b from-amber-500 to-amber-700 rounded-t-lg border border-amber-400/30" />
      <div className="absolute top-1 left-4 w-1 h-4 bg-amber-400/40 rounded-full" />
      <div className="absolute top-1 left-6 w-1 h-4 bg-amber-400/40 rounded-full" />
      <div className="absolute top-1 right-4 w-1 h-4 bg-amber-400/40 rounded-full" />
      <div className="absolute top-7 left-1 right-1 h-3.5 bg-gradient-to-b from-red-400 to-red-600 rounded-sm border border-red-300/30" />
      <div className="absolute bottom-0 left-2.5 w-1.5 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-sm" />
      <div className="absolute bottom-0 right-2.5 w-1.5 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-sm" />
    </div>
  );
}

export function TableIllustration() {
  return (
    <div className="relative w-22 h-14 drop-shadow-md">
      <div className="absolute top-3 left-0 right-0 h-3.5 bg-gradient-to-b from-amber-500 to-amber-700 rounded-md border-t border-amber-400/50" />
      <div className="absolute top-6 left-1 right-1 h-1.5 bg-cream-100/30 rounded-b-sm" />
      <div className="absolute bottom-0 left-2 w-2 h-5 bg-gradient-to-b from-amber-600 to-amber-900 rounded-b-sm" />
      <div className="absolute bottom-0 right-2 w-2 h-5 bg-gradient-to-b from-amber-600 to-amber-900 rounded-b-sm" />
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-4 bg-cream-100/80 rounded-full border border-cream-300/50" />
      <span className="absolute top-0 left-1/2 -translate-x-1/2 text-sm">{'\uD83C\uDF56'}</span>
    </div>
  );
}

export function PotionShelfIllustration() {
  return (
    <div className="relative w-20 h-16 drop-shadow-md">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-800 to-amber-950 rounded-md border border-amber-700/30" />
      <div className="absolute top-4 left-1 right-1 h-0.5 bg-amber-600" />
      <div className="absolute top-9 left-1 right-1 h-0.5 bg-amber-600" />
      <span className="absolute top-1 left-1.5 text-sm">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-1 left-6 text-sm hue-rotate-90">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-1 right-1.5 text-sm hue-rotate-180">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-5 left-3 text-sm hue-rotate-60">{'\uD83E\uDDEA'}</span>
      <span className="absolute top-5 right-3 text-sm hue-rotate-270">{'\uD83E\uDDEA'}</span>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-400/20 rounded-full blur-sm" />
    </div>
  );
}

export function EquipmentRackIllustration() {
  return (
    <div className="relative w-20 h-16 drop-shadow-md">
      <div className="absolute bottom-0 left-2 w-1.5 h-14 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-sm" />
      <div className="absolute bottom-0 right-2 w-1.5 h-14 bg-gradient-to-b from-gray-500 to-gray-700 rounded-t-sm" />
      <div className="absolute top-0 left-2 right-2 h-1.5 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 rounded-full" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-600 to-gray-800 rounded-sm" />
      <span className="absolute top-2 left-3 text-base transform -rotate-12">{'\u2694\uFE0F'}</span>
      <span className="absolute top-2 right-2 text-base">{'\uD83D\uDEE1\uFE0F'}</span>
      <span className="absolute top-7 left-1/2 -translate-x-1/2 text-base">{'\uD83E\uDDBE'}</span>
    </div>
  );
}

export function StoveIllustration() {
  return (
    <div className="relative w-20 h-16 drop-shadow-md">
      <div className="absolute bottom-0 left-1 right-1 h-12 bg-gradient-to-b from-gray-600 to-gray-800 rounded-t-md rounded-b-sm border border-gray-500/50" />
      <div className="absolute bottom-2 left-3 right-3 h-5 bg-gradient-to-b from-orange-500 to-red-600 rounded-sm" />
      <div className="absolute bottom-3 left-4 w-3 h-4 bg-gradient-to-t from-yellow-400 to-orange-500 rounded-t-full opacity-80 animate-pulse" />
      <div className="absolute bottom-3 right-4 w-2 h-3 bg-gradient-to-t from-yellow-300 to-red-400 rounded-t-full opacity-70 animate-pulse" style={{ animationDelay: '0.3s' }} />
      <div className="absolute top-2 left-0 right-0 h-3 bg-gradient-to-b from-gray-500 to-gray-600 rounded-md" />
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-sm">{'\uD83C\uDF72'}</span>
    </div>
  );
}

export function FarmIllustration() {
  return (
    <div className="relative w-20 h-16 drop-shadow-md">
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-amber-700 to-amber-900 rounded-md" />
      <div className="absolute bottom-3 left-2 right-2 h-1 bg-amber-950 rounded-full" />
      <div className="absolute bottom-5 left-2 right-2 h-1 bg-amber-950 rounded-full" />
      <span className="absolute top-1 left-2 text-sm">{'\uD83C\uDF31'}</span>
      <span className="absolute top-0 left-7 text-sm">{'\uD83C\uDF3F'}</span>
      <span className="absolute top-1 right-2 text-sm">{'\uD83C\uDF3E'}</span>
      <div className="absolute bottom-0 left-0 w-1.5 h-10 bg-gradient-to-b from-amber-500 to-amber-700 rounded-t-sm" />
      <div className="absolute bottom-0 right-0 w-1.5 h-10 bg-gradient-to-b from-amber-500 to-amber-700 rounded-t-sm" />
    </div>
  );
}

export function DoorIllustration({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative w-14 h-20 drop-shadow-md">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-lg border-2 border-amber-600/50" />
      <div className="absolute top-2 left-2 right-2 h-6 bg-amber-600/60 rounded-sm border border-amber-500/30" />
      <div className="absolute bottom-3 left-2 right-2 h-5 bg-amber-600/60 rounded-sm border border-amber-500/30" />
      <div className="absolute top-1/2 right-2.5 w-2 h-2 bg-yellow-400 rounded-full border border-yellow-300 shadow-sm" />
      {isOpen && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-yellow-100/30 rounded-t-lg animate-pulse" />
      )}
    </div>
  );
}

// ============================================================
// FurnitureCard - A larger, tappable card for room-based display
// ============================================================

export interface FurnitureCardProps {
  children: React.ReactNode;
  label: string;
  items?: Array<{ emoji: string; name: string }>;
  maxSlots?: number;
  onClick?: () => void;
  highlight?: boolean;
  occupied?: boolean;
  occupiedLabel?: string;
  dimmed?: boolean;
}

export function FurnitureCard({
  children,
  label,
  items = [],
  maxSlots,
  onClick,
  highlight = false,
  occupied = false,
  occupiedLabel,
  dimmed = false,
}: FurnitureCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick && !highlight}
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-2xl
        backdrop-blur-sm transition-all duration-300 min-w-[90px]
        ${dimmed
          ? 'bg-white/10 border-2 border-white/10 opacity-40 pointer-events-none'
          : highlight
            ? 'bg-white/30 border-2 border-cozy-amber shadow-[0_0_20px_rgba(212,137,63,0.5)] scale-105'
            : 'bg-white/15 border border-white/20 hover:bg-white/25'
        }
        ${onClick ? 'cursor-pointer hover:border-cozy-amber/50 hover:shadow-md active:scale-95' : 'cursor-default'}
      `}
    >
      {/* Occupied badge */}
      {occupied && occupiedLabel && (
        <span className="absolute -top-2 -right-2 text-base bg-cozy-amber/90 text-cream-50 w-7 h-7 flex items-center justify-center rounded-full font-bold shadow-md border-2 border-white/30 animate-pulse">
          {occupiedLabel}
        </span>
      )}

      {/* Furniture illustration */}
      <div className="flex items-center justify-center min-h-[48px]">
        {children}
      </div>

      {/* Label */}
      <span className="text-[11px] text-cream-100 font-medium drop-shadow-sm leading-tight">{label}</span>

      {/* Placed items preview */}
      {items.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center max-w-[80px]">
          {items.slice(0, 4).map((item, i) => (
            <span key={i} className="text-sm drop-shadow-sm" title={item.name}>
              {item.emoji}
            </span>
          ))}
          {items.length > 4 && (
            <span className="text-[10px] text-cream-300/70">+{items.length - 4}</span>
          )}
        </div>
      )}

      {/* Empty slot hint */}
      {items.length === 0 && maxSlots && onClick && (
        <span className="text-[9px] text-cream-300/60 leading-tight">
          탭하여 배치
        </span>
      )}
    </button>
  );
}

// ============================================================
// FurnitureSlot - renders the right card for each furniture key
// ============================================================

export function FurnitureSlot({
  furnitureKey,
  activeFurniture,
  sonIsHome,
  currentAction,
  isDoorOpen,
  isAdventuring,
  tableItems,
  potionItems,
  deskItems,
  equipmentItems,
  potionSlots,
  onOpenPlacement,
}: {
  furnitureKey: FurnitureKey;
  activeFurniture: FurnitureKey | null;
  sonIsHome: boolean;
  currentAction: SonAction;
  isDoorOpen: boolean;
  isAdventuring: boolean;
  tableItems: Array<{ emoji: string; name: string }>;
  potionItems: Array<{ emoji: string; name: string }>;
  deskItems: Array<{ emoji: string; name: string }>;
  equipmentItems: Array<{ emoji: string; name: string }>;
  potionSlots: number;
  onOpenPlacement: (type: PlacementType) => void;
}) {
  const isHighlighted = activeFurniture === furnitureKey;

  switch (furnitureKey) {
    case 'bed':
      return (
        <FurnitureCard
          label={'\uCE68\uB300'}
          highlight={isHighlighted}
          occupied={sonIsHome && currentAction === SonAction.SLEEPING}
          occupiedLabel={'\uD83D\uDCA4'}
          dimmed={isAdventuring}
        >
          <BedIllustration />
        </FurnitureCard>
      );
    case 'dummy':
      return (
        <FurnitureCard
          label={'\uD5C8\uC218\uC544\uBE44'}
          highlight={isHighlighted}
          occupied={sonIsHome && currentAction === SonAction.TRAINING}
          occupiedLabel={'\u2694\uFE0F'}
          dimmed={isAdventuring}
        >
          <DummyIllustration />
        </FurnitureCard>
      );
    case 'desk':
      return (
        <FurnitureCard
          label={'\uCC45\uC0C1'}
          items={deskItems}
          maxSlots={3}
          onClick={() => onOpenPlacement('book')}
          highlight={isHighlighted}
          dimmed={isAdventuring}
        >
          <DeskIllustration />
        </FurnitureCard>
      );
    case 'chair':
      return (
        <FurnitureCard
          label={'\uC758\uC790'}
          highlight={isHighlighted}
          occupied={sonIsHome && currentAction === SonAction.RESTING}
          occupiedLabel={'\uD83D\uDE0C'}
          dimmed={isAdventuring}
        >
          <ChairIllustration />
        </FurnitureCard>
      );
    case 'table':
      return (
        <FurnitureCard
          label={'\uC2DD\uD0C1'}
          items={tableItems}
          maxSlots={MAX_TABLE_FOOD}
          onClick={() => onOpenPlacement('food')}
          highlight={isHighlighted}
          dimmed={isAdventuring}
        >
          <TableIllustration />
        </FurnitureCard>
      );
    case 'potionShelf':
      return (
        <FurnitureCard
          label={'\uD3EC\uC158 \uC120\uBC18'}
          items={potionItems}
          maxSlots={potionSlots}
          onClick={() => onOpenPlacement('potion')}
          highlight={isHighlighted}
          dimmed={isAdventuring}
        >
          <PotionShelfIllustration />
        </FurnitureCard>
      );
    case 'equipmentRack':
      return (
        <FurnitureCard
          label={'\uC7A5\uBE44\uB300'}
          items={equipmentItems}
          maxSlots={3}
          onClick={() => onOpenPlacement('equipment')}
          highlight={isHighlighted}
          dimmed={isAdventuring}
        >
          <EquipmentRackIllustration />
        </FurnitureCard>
      );
    case 'door':
      return (
        <FurnitureCard
          label={isDoorOpen && sonIsHome ? '\uCD9C\uBC1C!' : '\uD604\uAD00\uBB38'}
          highlight={isDoorOpen && sonIsHome}
          dimmed={isAdventuring}
        >
          <DoorIllustration isOpen={isDoorOpen && sonIsHome} />
        </FurnitureCard>
      );
    case 'stove':
      return (
        <FurnitureCard
          label={'화덕'}
          onClick={() => onOpenPlacement('cooking' as PlacementType)}
          highlight={isHighlighted}
          dimmed={isAdventuring}
        >
          <StoveIllustration />
        </FurnitureCard>
      );
    case 'farm':
      return (
        <FurnitureCard
          label={'농장'}
          onClick={() => onOpenPlacement('farming' as PlacementType)}
          highlight={isHighlighted}
          occupied={sonIsHome && currentAction === SonAction.FARMING}
          occupiedLabel={'\uD83C\uDF31'}
          dimmed={isAdventuring}
        >
          <FarmIllustration />
        </FurnitureCard>
      );
    default:
      return null;
  }
}
