'use client';

import React, { useMemo } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import type { Food, Potion, Book, Equipment } from '@/lib/types';
import { EMOJI_MAP, MAX_TABLE_FOOD } from '@/lib/constants';
import Modal from '@/components/ui/Modal';

export type PlacementType = 'food' | 'potion' | 'book' | 'equipment';

interface PlacementModalProps {
  type: PlacementType;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlacementModal({ type, isOpen, onClose }: PlacementModalProps) {
  const { state } = useGameState();
  const actions = useGameActions();

  const config = useMemo(() => {
    switch (type) {
      case 'food':
        return {
          title: '\uD83C\uDF7D\uFE0F \uC2DD\uD0C1\uC5D0 \uC74C\uC2DD \uBC30\uCE58',
          items: state.inventory.food,
          placed: state.home.table,
          maxSlots: MAX_TABLE_FOOD,
          getEmoji: (item: Food) => EMOJI_MAP.food,
          getName: (item: Food) => item.name,
          getDesc: (item: Food) =>
            `\uBC30\uACE0\uD514 +${item.hungerRestore}${item.hpRestore ? ` HP +${item.hpRestore}` : ''}${item.tempBuff ? ` ${item.tempBuff.stat === 'all' ? '\uC804\uC2A4\uD0EF' : item.tempBuff.stat.toUpperCase()} +${item.tempBuff.value}` : ''}`,
          onPlace: (idx: number) => { actions.placeFood(idx); },
          onRemove: (idx: number) => { actions.removeFood(idx); },
        };
      case 'potion':
        return {
          title: '\uD83E\uDDEA \uD3EC\uC158 \uC120\uBC18\uC5D0 \uBC30\uCE58',
          items: state.inventory.potions,
          placed: state.home.potionShelf,
          maxSlots: state.unlocks.potionSlots,
          getEmoji: (item: Potion) => EMOJI_MAP.potion,
          getName: (item: Potion) => item.name,
          getDesc: (item: Potion) =>
            item.effect === 'instant'
              ? `HP +${item.value} (\uC989\uC2DC)`
              : `${item.stat === 'all' ? '\uC804\uC2A4\uD0EF' : (item.stat ?? '').toUpperCase()} +${item.value} (1\uBAA8\uD5D8)`,
          onPlace: (idx: number) => { actions.placePotion(idx); },
          onRemove: (idx: number) => { actions.removePotion(idx); },
        };
      case 'book':
        return {
          title: '\uD83D\uDCDA \uCC45\uC0C1\uC5D0 \uCC45 \uBC30\uCE58',
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
          title: '\u2694\uFE0F \uC7A5\uBE44\uB300\uC5D0 \uC7A5\uBE44 \uBC30\uCE58',
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
          \uBC30\uCE58\uB428 ({config.placed.length}/{config.maxSlots})
        </p>
        <div className="flex flex-wrap gap-2">
          {config.placed.map((item, i) => (
            <button
              key={i}
              onClick={() => config.onRemove(i)}
              className="flex items-center gap-1.5 bg-cream-200 border border-cream-500 rounded-lg px-2.5 py-1.5 hover:bg-red-50 hover:border-red-300 transition-colors group cursor-pointer"
              title="\uD074\uB9AD\uD558\uC5EC \uD68C\uC218"
            >
              <span className="text-lg">{config.getEmoji(item as never)}</span>
              <span className="text-xs font-medium text-cream-800 group-hover:text-red-600">{config.getName(item as never)}</span>
              <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">{'\u2715'}</span>
            </button>
          ))}
          {config.placed.length === 0 && (
            <p className="text-xs text-cream-500 italic">\uC544\uC9C1 \uBC30\uCE58\uB41C \uC544\uC774\uD15C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</p>
          )}
        </div>
      </div>

      <div className="border-t border-cream-400 my-3" />

      <div>
        <p className="text-xs text-cream-700 mb-2">\uC778\uBCA4\uD1A0\uB9AC ({config.items.length}\uAC1C)</p>
        {config.items.length === 0 ? (
          <p className="text-xs text-cream-500 italic">\uBC30\uCE58\uD560 \uC218 \uC788\uB294 \uC544\uC774\uD15C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</p>
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
                {!isFull && <span className="text-xs text-cozy-amber font-bold shrink-0">\uBC30\uCE58</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFull && (
        <p className="text-xs text-cozy-red mt-2 text-center">\uC2AC\uB86F\uC774 \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4</p>
      )}
    </Modal>
  );
}
