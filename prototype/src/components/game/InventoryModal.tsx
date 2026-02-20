'use client';

import React, { useState, useMemo } from 'react';
import { useGameState } from '@/lib/gameState';
import { EMOJI_MAP, GRADE_COLORS, fmt } from '@/lib/constants';
import { calculateEquipmentStats } from '@/lib/game/crafting';
import type {
  Equipment,
  EquipmentSlot,
  EquipmentGrade,
  Food,
  Potion,
  Book,
  MaterialKey,
  StatType,
} from '@/lib/types';
import Modal from '@/components/ui/Modal';
import ItemSlot from '@/components/ui/ItemSlot';

// ============================================================
// Constants
// ============================================================

type TabId = 'equipment' | 'food' | 'potions' | 'materials' | 'books';

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'equipment', label: '장비', emoji: '\u2694\uFE0F' },
  { id: 'food', label: '음식', emoji: '\uD83C\uDF5E' },
  { id: 'potions', label: '포션', emoji: '\uD83E\uDDEA' },
  { id: 'materials', label: '재료', emoji: '\uD83D\uDCE6' },
  { id: 'books', label: '책', emoji: '\uD83D\uDCDA' },
];

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구',
};

const SLOT_EMOJI: Record<EquipmentSlot, string> = {
  weapon: '\u2694\uFE0F',
  armor: '\uD83D\uDEE1\uFE0F',
  accessory: '\uD83D\uDC8D',
};

const GRADE_LABEL: Record<EquipmentGrade, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '전설',
};

const STAT_EMOJI: Record<string, string> = {
  str: '\u2694\uFE0F',
  def: '\uD83D\uDEE1\uFE0F',
  agi: '\uD83D\uDCA8',
  int: '\uD83D\uDCD6',
  hp: '\u2764\uFE0F',
};

const STAT_LABEL: Record<string, string> = {
  str: 'STR',
  def: 'DEF',
  agi: 'AGI',
  int: 'INT',
  hp: 'HP',
};

const EFFECT_LABEL: Record<string, string> = {
  instant: '즉시',
  buff: '버프',
};

const STAT_NAME_KR: Record<string, string> = {
  str: '힘',
  def: '방어',
  agi: '민첩',
  int: '지능',
  hp: 'HP',
  all: '전체',
};

const MATERIAL_NAMES: Record<MaterialKey, string> = {
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
  refiningStone: '제련석',
  seed: '씨앗',
};

// Material category grouping for display
const MATERIAL_GROUPS: { label: string; keys: MaterialKey[] }[] = [
  {
    label: '화폐 & 강화',
    keys: ['gold', 'enhancementStones', 'specialOre', 'gems'],
  },
  {
    label: '기본 재료',
    keys: ['wood', 'leather', 'ironOre', 'mithril'],
  },
  {
    label: '몬스터 소재',
    keys: ['monsterTeeth', 'monsterShell'],
  },
  {
    label: '식재료',
    keys: ['meat', 'wheat', 'potato', 'carrot', 'apple'],
  },
  {
    label: '약초',
    keys: ['redHerb', 'blueHerb', 'yellowHerb'],
  },
  {
    label: '씨앗 & 제련',
    keys: ['seed', 'refiningStone'],
  },
];

// ============================================================
// InventoryModal Component
// ============================================================

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
  const { state } = useGameState();
  const [activeTab, setActiveTab] = useState<TabId>('equipment');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-3 -mt-1">
        {/* Title */}
        <h2 className="font-serif font-bold text-lg text-cream-950 pr-8">
          {'\uD83C\uDF92'} 인벤토리
        </h2>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedEquipment(null);
              }}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                text-xs font-bold whitespace-nowrap
                transition-all duration-150
                ${activeTab === tab.id
                  ? 'bg-cozy-amber text-cream-50 shadow-sm'
                  : 'bg-cream-300 text-cream-700 hover:bg-cream-400'
                }
              `}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[280px] max-h-[400px] overflow-y-auto -mx-1 px-1">
          {activeTab === 'equipment' && (
            <EquipmentTab
              selected={selectedEquipment}
              onSelect={setSelectedEquipment}
            />
          )}
          {activeTab === 'food' && <FoodTab />}
          {activeTab === 'potions' && <PotionTab />}
          {activeTab === 'materials' && <MaterialsTab />}
          {activeTab === 'books' && <BooksTab />}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Equipment Tab
// ============================================================

function EquipmentTab({
  selected,
  onSelect,
}: {
  selected: Equipment | null;
  onSelect: (eq: Equipment | null) => void;
}) {
  const { state } = useGameState();
  const { inventory, son, home } = state;

  // Collect all equipment: inventory + equipped on son + on rack
  const allEquipment = useMemo(() => {
    const items: { equipment: Equipment; location: 'inventory' | 'equipped' | 'rack' }[] = [];

    // Equipped on son
    const equipped = son.equipment;
    if (equipped.weapon) items.push({ equipment: equipped.weapon, location: 'equipped' });
    if (equipped.armor) items.push({ equipment: equipped.armor, location: 'equipped' });
    if (equipped.accessory) items.push({ equipment: equipped.accessory, location: 'equipped' });

    // On rack
    for (const eq of home.equipmentRack) {
      items.push({ equipment: eq, location: 'rack' });
    }

    // In inventory
    for (const eq of inventory.equipment) {
      items.push({ equipment: eq, location: 'inventory' });
    }

    return items;
  }, [inventory.equipment, son.equipment, home.equipmentRack]);

  if (allEquipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-cream-500">
        <span className="text-3xl mb-2">{'\u2694\uFE0F'}</span>
        <span className="text-sm">보유 중인 장비가 없습니다</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Equipment grid */}
      <div className="grid grid-cols-5 gap-2">
        {allEquipment.map(({ equipment: eq, location }) => {
          const isSelected = selected?.id === eq.id;
          const isUsed = location === 'equipped' || location === 'rack';

          return (
            <div key={eq.id} className="relative">
              <ItemSlot
                emoji={SLOT_EMOJI[eq.slot]}
                grade={eq.grade}
                enhanceLevel={eq.enhanceLevel}
                onClick={() => onSelect(isSelected ? null : eq)}
                size="md"
                className={isSelected ? 'ring-2 ring-cozy-amber' : ''}
              />
              {isUsed && (
                <span className="absolute -top-1 -left-1 bg-green-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-md shadow-sm leading-none">
                  {location === 'equipped' ? '착용' : '거치'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <EquipmentDetail equipment={selected} allEquipment={allEquipment} />
      )}
    </div>
  );
}

function EquipmentDetail({
  equipment,
  allEquipment,
}: {
  equipment: Equipment;
  allEquipment: { equipment: Equipment; location: string }[];
}) {
  const stats = useMemo(() => calculateEquipmentStats(equipment), [equipment]);
  const locationInfo = allEquipment.find((e) => e.equipment.id === equipment.id);
  const location = locationInfo?.location ?? 'inventory';

  const locationLabel =
    location === 'equipped'
      ? '아들 착용 중'
      : location === 'rack'
        ? '장비 거치대'
        : '인벤토리';

  return (
    <div
      className="bg-cream-100 border-2 rounded-xl p-3 flex flex-col gap-2"
      style={{ borderColor: GRADE_COLORS[equipment.grade] }}
    >
      {/* Name + grade */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{SLOT_EMOJI[equipment.slot]}</span>
          <div>
            <div className="font-bold text-sm text-cream-950">
              {equipment.name}
              {equipment.enhanceLevel > 0 && (
                <span className="text-cozy-amber ml-1">+{equipment.enhanceLevel}</span>
              )}
            </div>
            <div className="text-[10px] text-cream-600">
              {SLOT_LABEL[equipment.slot]} &middot;{' '}
              <span style={{ color: GRADE_COLORS[equipment.grade] }}>
                {GRADE_LABEL[equipment.grade]}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[10px] bg-cream-300 text-cream-700 px-1.5 py-0.5 rounded-md font-bold">
          {locationLabel}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(stats).map(([stat, value]) => (
          <div key={stat} className="flex items-center gap-1 text-sm">
            <span className="text-xs">{STAT_EMOJI[stat] ?? ''}</span>
            <span className="text-cream-600 text-xs">{STAT_LABEL[stat] ?? stat}</span>
            <span className="font-bold text-cream-900">+{fmt(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Food Tab
// ============================================================

function FoodTab() {
  const { state } = useGameState();
  const { inventory, home } = state;

  // Combine all food: inventory + table
  const allFood = useMemo(() => {
    const items: { food: Food; location: 'inventory' | 'table' }[] = [];

    for (const f of home.table) {
      items.push({ food: f, location: 'table' });
    }
    for (const f of inventory.food) {
      items.push({ food: f, location: 'inventory' });
    }

    return items;
  }, [inventory.food, home.table]);

  if (allFood.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-cream-500">
        <span className="text-3xl mb-2">{'\uD83C\uDF5E'}</span>
        <span className="text-sm">보유 중인 음식이 없습니다</span>
      </div>
    );
  }

  // Group by food name
  const grouped = useMemo(() => {
    const map = new Map<string, { food: Food; count: number; onTable: number }>();
    for (const { food, location } of allFood) {
      const existing = map.get(food.name);
      if (existing) {
        existing.count++;
        if (location === 'table') existing.onTable++;
      } else {
        map.set(food.name, {
          food,
          count: 1,
          onTable: location === 'table' ? 1 : 0,
        });
      }
    }
    return Array.from(map.values());
  }, [allFood]);

  return (
    <div className="flex flex-col gap-2">
      {grouped.map(({ food, count, onTable }) => (
        <div
          key={food.name}
          className="bg-cream-100 border-2 border-cream-400 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-cream-200 rounded-lg flex items-center justify-center text-2xl shrink-0">
            {EMOJI_MAP.food}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-cream-950">{food.name}</span>
              <span className="text-xs text-cream-500">x{count}</span>
              {onTable > 0 && (
                <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold">
                  식탁 {onTable}개
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-xs text-cream-600">
                {EMOJI_MAP.hunger} 포만감 +{fmt(food.hungerRestore)}
              </span>
              {food.hpRestore != null && food.hpRestore > 0 && (
                <span className="text-xs text-cream-600">
                  {EMOJI_MAP.hp} HP +{fmt(food.hpRestore)}
                </span>
              )}
              {food.tempBuff && (
                <span className="text-xs text-cozy-amber font-bold">
                  {STAT_EMOJI[food.tempBuff.stat] ?? ''} {STAT_NAME_KR[food.tempBuff.stat] ?? food.tempBuff.stat} +{fmt(food.tempBuff.value)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Potion Tab
// ============================================================

function PotionTab() {
  const { state } = useGameState();
  const { inventory, home } = state;

  // Combine potions from inventory + shelf
  const allPotions = useMemo(() => {
    const items: { potion: Potion; location: 'inventory' | 'shelf' }[] = [];

    for (const p of home.potionShelf) {
      items.push({ potion: p, location: 'shelf' });
    }
    for (const p of inventory.potions) {
      items.push({ potion: p, location: 'inventory' });
    }

    return items;
  }, [inventory.potions, home.potionShelf]);

  if (allPotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-cream-500">
        <span className="text-3xl mb-2">{'\uD83E\uDDEA'}</span>
        <span className="text-sm">보유 중인 포션이 없습니다</span>
      </div>
    );
  }

  // Group by potion name
  const grouped = useMemo(() => {
    const map = new Map<string, { potion: Potion; count: number; onShelf: number }>();
    for (const { potion, location } of allPotions) {
      const existing = map.get(potion.name);
      if (existing) {
        existing.count++;
        if (location === 'shelf') existing.onShelf++;
      } else {
        map.set(potion.name, {
          potion,
          count: 1,
          onShelf: location === 'shelf' ? 1 : 0,
        });
      }
    }
    return Array.from(map.values());
  }, [allPotions]);

  return (
    <div className="flex flex-col gap-2">
      {grouped.map(({ potion, count, onShelf }) => (
        <div
          key={potion.name}
          className="bg-cream-100 border-2 border-cream-400 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-cream-200 rounded-lg flex items-center justify-center text-2xl shrink-0">
            {EMOJI_MAP.potion}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-cream-950">{potion.name}</span>
              <span className="text-xs text-cream-500">x{count}</span>
              {onShelf > 0 && (
                <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">
                  진열 {onShelf}개
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-[10px] bg-cream-300 text-cream-600 px-1 py-0.5 rounded">
                {EFFECT_LABEL[potion.effect]}
              </span>
              {potion.stat && potion.value != null && (
                <span className="text-xs text-cream-600">
                  {STAT_EMOJI[potion.stat] ?? ''} {STAT_NAME_KR[potion.stat] ?? potion.stat} +{fmt(potion.value)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Materials Tab
// ============================================================

function MaterialsTab() {
  const { state } = useGameState();
  const { materials } = state.inventory;

  return (
    <div className="flex flex-col gap-3">
      {MATERIAL_GROUPS.map((group) => {
        // Filter: show gold always, otherwise only quantity > 0
        const visibleKeys = group.keys.filter(
          (key) => key === 'gold' || materials[key] > 0
        );

        if (visibleKeys.length === 0) return null;

        return (
          <div key={group.label}>
            <div className="text-[10px] font-bold text-cream-500 uppercase tracking-wider mb-1.5">
              {group.label}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {visibleKeys.map((key) => (
                <div
                  key={key}
                  className="bg-cream-100 border border-cream-400 rounded-lg p-2 flex flex-col items-center gap-0.5"
                >
                  <span className="text-lg">{EMOJI_MAP[key] ?? ''}</span>
                  <span className="text-[10px] text-cream-600 text-center leading-tight">
                    {MATERIAL_NAMES[key]}
                  </span>
                  <span className="text-sm font-bold text-cream-900 tabular-nums">
                    {fmt(materials[key])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Books Tab
// ============================================================

function BooksTab() {
  const { state } = useGameState();
  const { inventory, home } = state;

  // Combine books from inventory + desk
  const allBooks = useMemo(() => {
    const items: { book: Book; location: 'inventory' | 'desk' }[] = [];

    for (const b of home.desk) {
      items.push({ book: b, location: 'desk' });
    }
    for (const b of inventory.books) {
      items.push({ book: b, location: 'inventory' });
    }

    return items;
  }, [inventory.books, home.desk]);

  if (allBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-cream-500">
        <span className="text-3xl mb-2">{'\uD83D\uDCD5'}</span>
        <span className="text-sm">보유 중인 책이 없습니다</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {allBooks.map(({ book, location }) => (
        <div
          key={book.id}
          className="bg-cream-100 border-2 border-cream-400 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-cream-200 rounded-lg flex items-center justify-center text-2xl shrink-0">
            {EMOJI_MAP.book}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-cream-950">{book.name}</span>
              {location === 'desk' && (
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold">
                  책상 위
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-cream-600">
                {STAT_EMOJI[book.statEffect.stat] ?? ''} {STAT_NAME_KR[book.statEffect.stat] ?? book.statEffect.stat} +{fmt(book.statEffect.value)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
