'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { SonAction } from '@/lib/types';
import type { Food, Potion, Book, Equipment } from '@/lib/types';
import {
  EMOJI_MAP,
  SON_DIALOGUES,
  MAX_TABLE_FOOD,
} from '@/lib/constants';
import ItemSlot from '@/components/ui/ItemSlot';
import Modal from '@/components/ui/Modal';
import AdventurePanel from './AdventurePanel';
import ReturnModal from './ReturnModal';

// ============================================================
// Son character emoji states
// ============================================================

const SON_STATE_EMOJI: Record<string, string> = {
  [SonAction.IDLE]: '\uD83E\uDDD1',       // standing
  [SonAction.SLEEPING]: '\uD83D\uDE34',    // sleeping face
  [SonAction.TRAINING]: '\uD83D\uDE24',    // determined
  [SonAction.EATING]: '\uD83D\uDE0B',      // yum face
  [SonAction.READING]: '\uD83E\uDD13',     // nerd face
  [SonAction.RESTING]: '\uD83D\uDE0C',     // relieved
  [SonAction.HEALING]: '\uD83E\uDE79',     // bandaged
  [SonAction.DRINKING_POTION]: '\uD83D\uDE32', // astonished
  [SonAction.DEPARTING]: '\uD83D\uDEB6',   // walking
  [SonAction.ADVENTURING]: '\uD83D\uDDFA\uFE0F', // map
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
// Placement modal types
// ============================================================

type PlacementType = 'food' | 'potion' | 'book' | 'equipment';

// ============================================================
// Furniture Item Component
// ============================================================

interface FurnitureProps {
  emoji: string;
  label: string;
  items?: Array<{ emoji: string; name: string }>;
  maxSlots?: number;
  onClick?: () => void;
  highlight?: boolean;
  occupied?: boolean;
  occupiedLabel?: string;
  className?: string;
}

function FurnitureItem({
  emoji,
  label,
  items = [],
  maxSlots,
  onClick,
  highlight = false,
  occupied = false,
  occupiedLabel,
  className = '',
}: FurnitureProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative flex flex-col items-center gap-1 p-2 rounded-xl
        bg-gradient-to-br from-cream-200/80 to-cream-300/80
        border-2 transition-all duration-200
        ${highlight
          ? 'border-cozy-amber shadow-[0_0_12px_rgba(212,137,63,0.3)]'
          : 'border-cream-500/50'
        }
        ${onClick ? 'cursor-pointer hover:border-cozy-amber hover:shadow-md active:scale-95' : 'cursor-default'}
        ${className}
      `}
    >
      {/* Furniture emoji */}
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-[10px] text-cream-700 font-medium">{label}</span>

      {/* Occupied overlay */}
      {occupied && occupiedLabel && (
        <span className="absolute -top-1 -right-1 text-[10px] bg-cozy-amber text-cream-50 px-1.5 py-0.5 rounded-full font-bold">
          {occupiedLabel}
        </span>
      )}

      {/* Item slots preview */}
      {items.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {items.map((item, i) => (
            <span key={i} className="text-sm" title={item.name}>
              {item.emoji}
            </span>
          ))}
          {maxSlots && items.length < maxSlots && (
            <span className="text-sm text-cream-500">+</span>
          )}
        </div>
      )}
      {items.length === 0 && maxSlots && (
        <span className="text-[9px] text-cream-500">
          {onClick ? '클릭하여 배치' : '비어있음'}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Speech Bubble Component
// ============================================================

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="relative max-w-[280px] mx-auto animate-fade-in">
      <div className="bg-cream-50 border-2 border-cream-500 rounded-xl px-4 py-2.5 shadow-md">
        <p className="text-sm font-serif text-cream-900 text-center italic">
          &ldquo;{text}&rdquo;
        </p>
      </div>
      {/* Triangle pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0
                      border-l-[8px] border-l-transparent
                      border-b-[8px] border-b-cream-500
                      border-r-[8px] border-r-transparent
                      rotate-180" />
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
          onPlace: (idx: number) => {
            actions.placeFood(idx);
          },
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
          onPlace: (idx: number) => {
            actions.placePotion(idx);
          },
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
          onPlace: (idx: number) => {
            actions.placeBook(idx);
          },
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
        };
    }
  }, [type, state.inventory, state.home, state.unlocks.potionSlots, actions]);

  const isFull = config.placed.length >= config.maxSlots;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title}>
      {/* Currently placed items */}
      <div className="mb-4">
        <p className="text-xs text-cream-700 mb-2">
          배치됨 ({config.placed.length}/{config.maxSlots})
        </p>
        <div className="flex flex-wrap gap-2">
          {config.placed.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-cream-200 border border-cream-500 rounded-lg px-2.5 py-1.5"
            >
              <span className="text-lg">{config.getEmoji(item as never)}</span>
              <span className="text-xs font-medium text-cream-800">
                {config.getName(item as never)}
              </span>
            </div>
          ))}
          {config.placed.length === 0 && (
            <p className="text-xs text-cream-500 italic">아직 배치된 아이템이 없습니다</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-cream-400 my-3" />

      {/* Inventory items to place */}
      <div>
        <p className="text-xs text-cream-700 mb-2">
          인벤토리 ({config.items.length}개)
        </p>
        {config.items.length === 0 ? (
          <p className="text-xs text-cream-500 italic">배치할 수 있는 아이템이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {config.items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  config.onPlace(idx);
                }}
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
                  <p className="text-sm font-medium text-cream-900 truncate">
                    {config.getName(item as never)}
                  </p>
                  <p className="text-[11px] text-cream-600">
                    {config.getDesc(item as never)}
                  </p>
                </div>
                {!isFull && (
                  <span className="text-xs text-cozy-amber font-bold shrink-0">
                    배치
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFull && (
        <p className="text-xs text-cozy-red mt-2 text-center">
          슬롯이 가득 찼습니다
        </p>
      )}
    </Modal>
  );
}

// ============================================================
// Main HomePage Component
// ============================================================

export default function HomePage() {
  const { state } = useGameState();
  const { son, home, adventure, letters } = state;

  const [placementModal, setPlacementModal] = useState<PlacementType | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Track when son returns from adventure
  const prevAdventureRef = useRef(adventure?.active ?? false);
  useEffect(() => {
    const wasAdventuring = prevAdventureRef.current;
    const isAdventuring = adventure?.active ?? false;

    // Son just returned (was adventuring, now not)
    if (wasAdventuring && !isAdventuring && son.isHome) {
      setShowReturnModal(true);
    }
    prevAdventureRef.current = isAdventuring;
  }, [adventure?.active, son.isHome]);

  const isAdventuring = adventure?.active ?? false;
  const currentAction = son.currentAction;

  // Get the furniture highlight based on son's current action
  const activeFurniture = useMemo(() => {
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
  }, [currentAction]);

  // Prepare table items preview
  const tableItems = home.table.map((f) => ({
    emoji: EMOJI_MAP.food,
    name: f.name,
  }));

  const potionItems = home.potionShelf.map((p) => ({
    emoji: EMOJI_MAP.potion,
    name: p.name,
  }));

  const deskItems = home.desk.map((b) => ({
    emoji: EMOJI_MAP.book,
    name: b.name,
  }));

  const equipmentItems = home.equipmentRack.map((e) => ({
    emoji: EMOJI_MAP[e.slot] ?? '\u2694\uFE0F',
    name: e.name,
  }));

  // Son's current dialogue
  const dialogue = son.dialogue;

  // Action indicator
  const actionInfo = ACTION_INDICATOR[currentAction] ?? ACTION_INDICATOR[SonAction.IDLE];

  // Is door open (son departing)?
  const isDoorOpen = currentAction === SonAction.DEPARTING;

  // If son is adventuring, show adventure panel
  if (isAdventuring) {
    return (
      <>
        <AdventurePanel />
        <ReturnModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="px-3 py-4 flex flex-col gap-4">
        {/* === Son Display Area === */}
        <div className="relative bg-gradient-to-b from-cream-200 to-cream-300 rounded-2xl border-2 border-cream-500 p-4 shadow-inner">
          {/* Action indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-lg animate-pulse">{actionInfo.emoji}</span>
            <span className="text-sm font-medium text-cream-700">{actionInfo.label}</span>
            {son.actionTimer > 0 && (
              <span className="text-xs text-cream-600 tabular-nums ml-1">
                ({Math.ceil(son.actionTimer)}s)
              </span>
            )}
          </div>

          {/* Son character */}
          <div className="flex justify-center mb-3">
            <div
              className={`
                w-24 h-24 rounded-full
                bg-gradient-to-br from-amber-100 to-amber-200
                border-3 border-amber-300
                flex items-center justify-center
                shadow-lg
                transition-all duration-500
                ${currentAction === SonAction.TRAINING ? 'animate-bounce' : ''}
                ${currentAction === SonAction.SLEEPING ? 'opacity-80' : ''}
                ${currentAction === SonAction.DEPARTING ? 'animate-pulse' : ''}
              `}
            >
              <span className="text-5xl select-none">
                {SON_STATE_EMOJI[currentAction] ?? '\uD83E\uDDD1'}
              </span>
            </div>
          </div>

          {/* Injury indicator */}
          {son.isInjured && (
            <div className="flex justify-center mb-2">
              <span className="text-xs bg-cozy-red/20 text-cozy-red px-2 py-0.5 rounded-full border border-cozy-red/30">
                {'\uD83E\uDE79'} 부상 상태
              </span>
            </div>
          )}

          {/* Speech bubble */}
          {dialogue && <SpeechBubble text={dialogue} />}
        </div>

        {/* === Furniture Grid === */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1: Bed, Dummy, Desk, Chair */}
          <FurnitureItem
            emoji={'\uD83D\uDECF\uFE0F'}
            label="침대"
            highlight={activeFurniture === 'bed'}
            occupied={currentAction === SonAction.SLEEPING}
            occupiedLabel={'\uD83D\uDCA4'}
          />
          <FurnitureItem
            emoji={'\uD83C\uDFAF'}
            label="허수아비"
            highlight={activeFurniture === 'dummy'}
            occupied={currentAction === SonAction.TRAINING}
            occupiedLabel={'\u2694\uFE0F'}
          />
          <FurnitureItem
            emoji={'\uD83D\uDCDA'}
            label="책상"
            items={deskItems}
            maxSlots={3}
            onClick={() => setPlacementModal('book')}
            highlight={activeFurniture === 'desk'}
          />
          <FurnitureItem
            emoji={'\uD83E\uDE91'}
            label="의자"
            highlight={activeFurniture === 'chair'}
            occupied={currentAction === SonAction.RESTING}
            occupiedLabel={'\uD83D\uDE0C'}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Row 2: Table, Potion Shelf, Equipment Rack */}
          <FurnitureItem
            emoji={'\uD83C\uDF7D\uFE0F'}
            label="식탁"
            items={tableItems}
            maxSlots={MAX_TABLE_FOOD}
            onClick={() => setPlacementModal('food')}
            highlight={activeFurniture === 'table'}
            className="col-span-1"
          />
          <FurnitureItem
            emoji={'\uD83E\uDDEA'}
            label="포션 선반"
            items={potionItems}
            maxSlots={state.unlocks.potionSlots}
            onClick={() => setPlacementModal('potion')}
            highlight={activeFurniture === 'potionShelf'}
            className="col-span-1"
          />
          <FurnitureItem
            emoji={'\u2694\uFE0F'}
            label="장비대"
            items={equipmentItems}
            maxSlots={3}
            onClick={() => setPlacementModal('equipment')}
            highlight={false}
            className="col-span-1"
          />
        </div>

        {/* Door */}
        <div className="flex justify-end">
          <div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl
              border-2 transition-all duration-300
              ${isDoorOpen
                ? 'bg-amber-100 border-cozy-amber shadow-[0_0_12px_rgba(212,137,63,0.3)]'
                : 'bg-cream-200/80 border-cream-500/50'
              }
            `}
          >
            <span className="text-2xl">
              {isDoorOpen ? '\uD83D\uDEAA' : '\uD83D\uDEAA'}
            </span>
            <span className="text-xs text-cream-700">
              {isDoorOpen ? '출발 중...' : '현관문'}
            </span>
            {isDoorOpen && (
              <span className="text-lg animate-bounce">{'\uD83D\uDEB6'}</span>
            )}
          </div>
        </div>

        {/* Son not home message (brief empty state between adventure end and return) */}
        {!son.isHome && !isAdventuring && (
          <div className="text-center py-8">
            <p className="text-lg text-cream-600 font-serif">
              {'\uD83D\uDEB6'} 아들이 모험을 떠났습니다...
            </p>
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
