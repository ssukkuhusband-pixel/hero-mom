'use client';

import React, { useState } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canDoJob, getJobCooldownRemaining, getJobReward, getJobCooldownDuration } from '@/lib/game/job';
import { EMOJI_MAP, SHOP_INVENTORY, SELL_PRICES, UNLOCK_LEVELS, getSmeltingStones, fmt } from '@/lib/constants';
import type { MaterialKey, Equipment, EquipmentGrade } from '@/lib/types';
import type { ShopItem } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';
import AlchemyPage from './AlchemyPage';

// ============================================================
// Shared Components
// ============================================================

const SLOT_EMOJI: Record<string, string> = { weapon: '⚔️', armor: '🛡️', accessory: '💍' };
const sellCls = "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border border-cream-500 bg-cream-100 hover:border-red-300 hover:bg-red-50 active:scale-[0.98] transition-all";
const gridCls = (off: boolean) => `flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-95 ${off ? 'opacity-40 border-white/10 bg-white/5' : 'border-white/20 bg-white/10 hover:border-cozy-amber'}`;

type VillageTab = 'job' | 'shop' | 'alchemy';

function MaterialBar({ mk }: { mk: MaterialKey[] }) {
  const { state } = useGameState();
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20">
      {mk.map((k) => (
        <div key={k} className="flex items-center gap-1 text-xs">
          <span className="text-sm">{EMOJI_MAP[k] ?? '?'}</span>
          <span className="font-medium text-cream-200 tabular-nums">{fmt(state.inventory.materials[k])}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Job Tab (from HomePage JobPanel)
// ============================================================

function JobTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const mom = state.mom;
  const ready = canDoJob(state);
  const reward = getJobReward(state);
  const cooldownDuration = getJobCooldownDuration(state);

  const [cooldownMs, setCooldownMs] = React.useState(getJobCooldownRemaining(state));

  React.useEffect(() => {
    if (ready) { setCooldownMs(0); return; }
    const update = () => setCooldownMs(getJobCooldownRemaining(state));
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [state.mom.lastJobAt, ready]);

  const cooldownSec = Math.ceil(cooldownMs / 1000);
  const cooldownPct = cooldownDuration > 0 ? Math.max(0, 100 - (cooldownMs / (cooldownDuration * 1000)) * 100) : 100;

  const handleJob = () => {
    if (!ready) return;
    actions.doJob();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💼</span>
          <span className="font-serif font-bold text-cream-100 text-sm">엄마의 알바</span>
          <span className="text-xs text-cream-300 ml-auto">Lv.{mom.jobLevel}</span>
        </div>

        {/* EXP bar */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-cozy-amber rounded-full transition-all" style={{ width: `${mom.jobMaxExp > 0 ? (mom.jobExp / mom.jobMaxExp) * 100 : 0}%` }} />
          </div>
          <span className="text-[10px] text-cream-400 tabular-nums">{fmt(mom.jobExp)}/{fmt(mom.jobMaxExp)}</span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-cream-300">보수: <span className="text-cozy-amber font-bold text-sm">{reward}G</span></span>
          <span className="text-xs text-cream-400">쿨다운: {cooldownDuration}초</span>
        </div>

        <button
          onClick={handleJob}
          disabled={!ready}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            ready
              ? 'bg-cozy-amber text-cream-50 shadow-md hover:bg-cozy-amber-dark'
              : 'bg-white/10 text-cream-400 cursor-not-allowed'
          }`}
        >
          {ready ? (
            <span>💰 일하기 (+{reward}G)</span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-cream-400">⏳ {cooldownSec}초</span>
              <div className="w-16 h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-cream-400/60 rounded-full transition-all" style={{ width: `${cooldownPct}%` }} />
              </div>
            </span>
          )}
        </button>
      </div>

      <p className="text-[10px] text-cream-400 text-center">
        마을에서 잡일을 하여 금화를 벌어옵니다. 레벨이 오르면 보수가 증가합니다.
      </p>
    </div>
  );
}

// ============================================================
// Shop Tab (from BlacksmithPage ShopTab)
// ============================================================

function ShopTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [sub, setSub] = useState<'buy' | 'sell'>('buy');
  const gold = state.inventory.materials.gold;
  const smeltUnlocked = state.unlocks.systems.smelting;
  const buy = (it: ShopItem) => { actions.buyItem(it.id); addToast(`${it.name} 구매!`, 'success'); };

  const doSellOrSmelt = (eq: Equipment) => {
    if (smeltUnlocked) {
      actions.smeltEquipment(eq.id);
      const stones = getSmeltingStones(eq.grade, eq.level ?? 1);
      addToast(`${eq.name} 용해! ⚗️ x${stones}`, 'success');
    } else {
      actions.sellEquipment(eq.id);
      addToast(`${eq.name} 판매! +${SELL_PRICES.equipment[eq.grade]}G`, 'success');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['buy', 'sell'] as const).map((t) => (
          <button key={t} onClick={() => setSub(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sub === t ? 'bg-cozy-amber text-cream-50 shadow-md' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>{t === 'buy' ? '🛒 구매' : '💰 판매'}</button>
        ))}
      </div>
      {sub === 'buy' ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-cream-200">{'📚'} 서적</p>
          <div className="grid grid-cols-3 gap-2">
            {SHOP_INVENTORY.filter(i => i.category === 'book').map((it) => (
              <button key={it.id} onClick={() => buy(it)} disabled={gold < it.goldCost} className={gridCls(gold < it.goldCost)}>
                <span className="text-2xl">{it.emoji}</span><span className="text-[10px] font-medium text-cream-100 text-center line-clamp-1 px-1">{it.name}</span><span className="text-[10px] font-bold text-cozy-amber">{'💰'}{it.goldCost}</span>
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-cream-200">{'🌱'} 씨앗</p>
          <div className="grid grid-cols-3 gap-2">
            {SHOP_INVENTORY.filter(i => i.category === 'seed').map((it) => (
              <button key={it.id} onClick={() => buy(it)} disabled={gold < it.goldCost} className={gridCls(gold < it.goldCost)}>
                <span className="text-2xl">{it.emoji}</span><span className="text-[10px] font-medium text-cream-100 text-center line-clamp-2 px-1">{it.name}</span><span className="text-[10px] font-bold text-cozy-amber">{'💰'}{it.goldCost}</span>
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-cream-200">{'⚗️'} 재료</p>
          <div className="grid grid-cols-3 gap-2">
            {SHOP_INVENTORY.filter(i => i.category === 'material').map((it) => (
              <button key={it.id} onClick={() => buy(it)} disabled={gold < it.goldCost} className={gridCls(gold < it.goldCost)}>
                <span className="text-2xl">{it.emoji}</span><span className="text-[10px] font-medium text-cream-100 text-center line-clamp-2 px-1">{it.name}</span><span className="text-[10px] font-bold text-cozy-amber">{'💰'}{it.goldCost}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {state.inventory.food.length > 0 && (<>
            <p className="text-xs font-bold text-cream-200">{'🍖'} 음식 (개당 {SELL_PRICES.food}G)</p>
            {state.inventory.food.map((f, i) => <button key={`f-${i}`} onClick={() => actions.sellFood(i)} className={sellCls}><span className="text-lg">{'🍖'}</span><span className="flex-1 text-sm font-medium text-cream-900 truncate">{f.name}</span><span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.food}G</span></button>)}
          </>)}
          {state.inventory.potions.length > 0 && (<>
            <p className="text-xs font-bold text-cream-200 mt-1">{'🧪'} 포션 (개당 {SELL_PRICES.potion}G)</p>
            {state.inventory.potions.map((p, i) => <button key={`p-${i}`} onClick={() => actions.sellPotion(i)} className={sellCls}><span className="text-lg">{'🧪'}</span><span className="flex-1 text-sm font-medium text-cream-900 truncate">{p.name}</span><span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.potion}G</span></button>)}
          </>)}
          {state.inventory.equipment.length > 0 && (<>
            <p className="text-xs font-bold text-cream-200 mt-1">{'⚔️'} 장비 (등급별 가격)</p>
            {state.inventory.equipment.map((eq) => (
              <button key={`e-${eq.id}`} onClick={() => doSellOrSmelt(eq)} className={sellCls}>
                <span className="text-lg">{SLOT_EMOJI[eq.slot] ?? '⚔️'}</span>
                <span className="flex-1 text-sm font-medium text-cream-900 truncate">{eq.name}{eq.enhanceLevel > 0 ? ` +${eq.enhanceLevel}` : ''}</span>
                <span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.equipment[eq.grade]}G</span>
              </button>
            ))}
          </>)}
          {state.inventory.food.length === 0 && state.inventory.potions.length === 0 && state.inventory.equipment.length === 0 && <p className="text-sm text-cream-500 italic text-center py-4">판매할 아이템이 없습니다</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main VillagePage
// ============================================================

export default function VillagePage() {
  const [activeTab, setActiveTab] = useState<VillageTab>('job');

  const tabs: { key: VillageTab; label: string }[] = [
    { key: 'job', label: '💼 알바' },
    { key: 'shop', label: '🛒 상점' },
    { key: 'alchemy', label: '⚗️ 연금술' },
  ];

  const mats: MaterialKey[] = ['gold', 'redHerb', 'blueHerb', 'yellowHerb', 'monsterTeeth', 'monsterShell'];

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {/* Background - village scene */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-800/90 via-amber-700/70 to-stone-900/90" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">
          {'🏘️'} 마을
        </h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 px-1 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === t.key
                  ? 'bg-white/20 text-cream-100 shadow-sm'
                  : 'text-cream-300 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'job' && <JobTab />}
        {activeTab === 'shop' && <ShopTab />}
        {activeTab === 'alchemy' && (
          <div className="-mx-3 -mt-4">
            <AlchemyPage />
          </div>
        )}

        {/* Material bar */}
        {activeTab !== 'alchemy' && (
          <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
            <MaterialBar mk={mats} />
          </div>
        )}
      </div>
    </div>
  );
}
