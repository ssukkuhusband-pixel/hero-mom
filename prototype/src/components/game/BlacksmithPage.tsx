'use client';
import React, { useState, useMemo } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canCraftEquipment, canEnhance, canGacha, calculateEquipmentStats, enhanceEquipment as enhanceEquipmentFn } from '@/lib/game/crafting';
import { EQUIPMENT_RECIPES, ENHANCEMENT_TABLE, GACHA_RATES, GACHA_COST, EMOJI_MAP, GRADE_COLORS, UNLOCK_LEVELS, SHOP_INVENTORY, SELL_PRICES } from '@/lib/constants';
import type { Equipment, EquipmentSlot, EquipmentGrade, MaterialKey, EquipmentRecipe } from '@/lib/types';
import type { ShopItem } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';

const SLOT_EMOJI: Record<EquipmentSlot, string> = { weapon: '\u2694\uFE0F', armor: '\uD83D\uDEE1\uFE0F', accessory: '\uD83D\uDC8D' };
const STAT_EMOJI: Record<string, string> = { str: '\u2694\uFE0F', def: '\uD83D\uDEE1\uFE0F', agi: '\uD83D\uDCA8', int: '\uD83D\uDCD6', hp: '\u2764\uFE0F' };
const STAT_LABEL: Record<string, string> = { str: 'STR', def: 'DEF', agi: 'AGI', int: 'INT', hp: 'HP' };
const GB: Record<EquipmentGrade, string> = { common: 'border-gray-400/40', uncommon: 'border-green-400/60', rare: 'border-blue-400/60', epic: 'border-purple-400/60' };
type TabType = 'craft' | 'enhance' | 'gacha' | 'shop';
const sellCls = "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border border-cream-500 bg-cream-100 hover:border-red-300 hover:bg-red-50 active:scale-[0.98] transition-all";
const gridCls = (off: boolean) => `flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-95 ${off ? 'opacity-40 border-white/10 bg-white/5' : 'border-white/20 bg-white/10 hover:border-cozy-amber'}`;

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-[380px]" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function MaterialBar({ mk }: { mk: MaterialKey[] }) {
  const { state } = useGameState();
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20">
      {mk.map((k) => (
        <div key={k} className="flex items-center gap-1 text-xs">
          <span className="text-sm">{EMOJI_MAP[k] ?? '?'}</span>
          <span className="font-medium text-cream-200 tabular-nums">{state.inventory.materials[k]}</span>
        </div>
      ))}
    </div>
  );
}

function RecipeGridItem({ recipe: r, onTap }: { recipe: EquipmentRecipe; onTap: () => void }) {
  const { state } = useGameState();
  const ok = state.son.stats.level >= r.unlockLevel || r.unlockLevel === 0;
  const can = canCraftEquipment(state, r.id);
  return (
    <button onClick={onTap} className={`relative flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-xl border-2 transition-all active:scale-95 bg-white/10 backdrop-blur-sm ${!ok ? 'opacity-40 border-white/10' : can ? GB[r.grade] + ' shadow-[0_0_8px_rgba(74,222,128,0.25)]' : GB[r.grade]}`}>
      {can && ok && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />}
      <span className="text-[28px] leading-none">{SLOT_EMOJI[r.slot]}</span>
      <span className="text-[10px] font-medium text-cream-100 leading-tight text-center line-clamp-2 px-1">{r.name}</span>
      {!ok && <span className="text-[9px] text-cream-400">{'\uD83D\uDD12'} Lv.{r.unlockLevel}</span>}
    </button>
  );
}

function RecipeDetailModal({ recipe: r, onClose }: { recipe: EquipmentRecipe; onClose: () => void }) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const ok = state.son.stats.level >= r.unlockLevel || r.unlockLevel === 0;
  const can = canCraftEquipment(state, r.id);
  const stats = Object.entries(r.baseStats).filter(([, v]) => v !== undefined && v > 0).map(([k, v]) => `${STAT_EMOJI[k] ?? ''} ${STAT_LABEL[k] ?? k}+${v}`).join('  ');
  const mats = Object.entries(r.materials) as [MaterialKey, number][];
  const craft = () => { actions.craftEquipment(r.id); addToast(`${r.name} 제작 완료!`, 'success'); onClose(); };
  return (
    <Overlay onClose={onClose}>
      <div className="bg-gradient-to-b from-[#2a1f14] to-[#1a1209] border border-white/20 rounded-2xl p-5 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-cream-400 hover:text-cream-100 text-lg">{'\u2715'}</button>
        <div className="flex flex-col items-center gap-1 mb-4">
          <span className="text-5xl">{SLOT_EMOJI[r.slot]}</span>
          <p className="font-serif font-bold text-cream-100 text-lg drop-shadow">{r.name}</p>
          <p className="text-[11px] text-cream-400 capitalize">{r.grade}</p>
        </div>
        <div className="text-xs text-cream-100 bg-white/10 rounded-lg px-3 py-2 mb-3 text-center">{stats}</div>
        <p className="text-[10px] text-cream-400 mb-1.5">{'\uD83D\uDCE6'} 필요 재료</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
          {mats.map(([k, amt]) => {
            const has = state.inventory.materials[k] ?? 0;
            return (<div key={k} className="flex items-center gap-1 text-xs"><span className="text-sm">{EMOJI_MAP[k] ?? '?'}</span><span className={`tabular-nums font-medium ${has >= amt ? 'text-cream-200' : 'text-red-400'}`}>{has}/{amt}</span></div>);
          })}
        </div>
        <button onClick={craft} disabled={!can} className="btn-wood w-full text-sm !py-2.5">{ok ? '\u2692\uFE0F 제작' : '\uD83D\uDD12 잠김'}</button>
      </div>
    </Overlay>
  );
}

function CraftTab() {
  const [sel, setSel] = useState<EquipmentRecipe | null>(null);
  return (<>
    <div className="grid grid-cols-3 gap-2.5">{EQUIPMENT_RECIPES.map((r) => <RecipeGridItem key={r.id} recipe={r} onTap={() => setSel(r)} />)}</div>
    {sel && <RecipeDetailModal recipe={sel} onClose={() => setSel(null)} />}
  </>);
}

function EnhanceTab() {
  const { state, dispatch } = useGameState();
  const { addToast } = useToast();
  const [sid, setSid] = useState<string | null>(null);
  const allEq = useMemo(() => {
    const it: { eq: Equipment; loc: string }[] = [];
    state.inventory.equipment.forEach((eq) => it.push({ eq, loc: '인벤토리' }));
    state.home.equipmentRack.forEach((eq) => it.push({ eq, loc: '장비대' }));
    const { weapon, armor, accessory } = state.son.equipment;
    if (weapon) it.push({ eq: weapon, loc: '장착 중' });
    if (armor) it.push({ eq: armor, loc: '장착 중' });
    if (accessory) it.push({ eq: accessory, loc: '장착 중' });
    return it;
  }, [state.inventory.equipment, state.home.equipmentRack, state.son.equipment]);
  const sel = allEq.find((i) => i.eq.id === sid)?.eq ?? null;
  const isMax = sel ? sel.enhanceLevel >= 5 : false;
  const nxt = sel ? ENHANCEMENT_TABLE.find((e) => e.level === sel.enhanceLevel + 1) : null;
  const canDo = sel ? canEnhance(state, sel.id) : false;
  const cur = sel ? calculateEquipmentStats(sel) : {};
  const pre = useMemo(() => {
    if (!sel || !nxt) return {};
    return calculateEquipmentStats({ ...sel, enhanceLevel: sel.enhanceLevel + 1 });
  }, [sel, nxt]);
  const doEnhance = () => {
    if (!sel) return;
    const bef = sel.enhanceLevel;
    const res = enhanceEquipmentFn(state, sel.id);
    const aft = [...res.state.inventory.equipment, ...res.state.home.equipmentRack, res.state.son.equipment.weapon, res.state.son.equipment.armor, res.state.son.equipment.accessory].find((e) => e?.id === sel.id);
    dispatch({ type: 'LOAD_STATE', state: res.state });
    if (aft && aft.enhanceLevel > bef) addToast(`${sel.name} +${bef + 1} 강화 성공!`, 'success');
    else addToast(`${sel.name} 강화 실패... 재료가 소모되었습니다`, 'error');
  };
  if (!state.unlocks.systems.enhancement) return <div className="text-center py-6"><p className="text-sm text-cream-300">{'\uD83D\uDD12'} Lv.{UNLOCK_LEVELS.enhancement} 달성 시 해금됩니다</p></div>;
  return (
    <div className="flex flex-col gap-3">
      {allEq.length === 0 ? <p className="text-xs text-cream-400 italic text-center py-4">강화할 장비가 없습니다</p> : (
        <div className="grid grid-cols-3 gap-2">
          {allEq.map(({ eq }) => (
            <button key={eq.id} onClick={() => setSid(eq.id === sid ? null : eq.id)} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border-2 transition-all active:scale-95 ${eq.id === sid ? 'border-cozy-amber bg-amber-900/40 shadow-md' : 'border-white/20 bg-white/10 hover:border-white/40'}`}>
              <span className="text-2xl">{SLOT_EMOJI[eq.slot]}</span>
              <span className="text-[10px] font-medium text-cream-100 truncate max-w-[70px]">{eq.name}</span>
              {eq.enhanceLevel > 0 && <span className="text-[10px] font-bold text-cozy-amber">+{eq.enhanceLevel}</span>}
              {eq.enhanceLevel >= 5 && <span className="text-[8px] bg-cozy-gold text-cream-900 px-1.5 rounded-full font-bold">MAX</span>}
            </button>
          ))}
        </div>
      )}
      {sel && (
        <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{SLOT_EMOJI[sel.slot]}</span>
            <div>
              <p className="font-serif font-bold text-cream-100 text-sm drop-shadow">{sel.name}{sel.enhanceLevel > 0 && <span className="text-cozy-amber ml-1">+{sel.enhanceLevel}</span>}</p>
              <p className="text-[10px]" style={{ color: GRADE_COLORS[sel.grade] }}>{sel.grade}</p>
            </div>
          </div>
          {isMax ? <p className="text-sm font-bold text-cozy-gold text-center py-3">{'\u2728'} 최대 강화 달성! {'\u2728'}</p> : nxt ? (<>
            <div className="flex items-center gap-4 mb-2 text-xs">
              <div className="flex items-center gap-1"><span>{EMOJI_MAP.enhancementStones}</span><span className={`tabular-nums font-medium ${state.inventory.materials.enhancementStones >= nxt.stonesRequired ? 'text-cream-200' : 'text-red-400'}`}>{state.inventory.materials.enhancementStones}/{nxt.stonesRequired}</span></div>
              <div className="flex items-center gap-1"><span>{EMOJI_MAP.gold}</span><span className={`tabular-nums font-medium ${state.inventory.materials.gold >= nxt.goldCost ? 'text-cream-200' : 'text-red-400'}`}>{state.inventory.materials.gold}/{nxt.goldCost}</span></div>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-cream-300">성공률</span><span className="font-bold text-cream-100">{Math.round(nxt.successRate * 100)}%</span></div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-cozy-forest rounded-full transition-all" style={{ width: `${nxt.successRate * 100}%` }} /></div>
            </div>
            <div className="bg-white/10 rounded-lg px-2.5 py-2 mb-3 text-xs">
              <p className="text-cream-300 mb-1 text-[10px]">강화 시 스탯 변화:</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {Object.keys(pre).map((s) => <span key={s} className="text-cream-100">{STAT_EMOJI[s] ?? ''} {STAT_LABEL[s] ?? s} <span className="text-cream-300">{cur[s] ?? 0}</span>{' \u2192 '}<span className="text-green-400 font-bold">{pre[s]}</span></span>)}
              </div>
            </div>
            <button onClick={doEnhance} disabled={!canDo} className="btn-wood w-full text-sm !py-2">{'\uD83D\uDD2E'} +{sel.enhanceLevel} {'\u2192'} +{sel.enhanceLevel + 1} 강화</button>
          </>) : null}
        </div>
      )}
    </div>
  );
}

function GachaTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [last, setLast] = useState<Equipment | null>(null);
  const [anim, setAnim] = useState(false);
  const ore = state.inventory.materials.specialOre;
  const cost = (GACHA_COST as Record<string, number>).specialOre ?? 3;
  const can = canGacha(state);
  const pull = () => { if (!can || anim) return; setAnim(true); setLast(null); actions.performGacha(); setTimeout(() => setAnim(false), 1200); };
  const ref = React.useRef(state.inventory.equipment.length);
  React.useEffect(() => {
    const p = ref.current, c = state.inventory.equipment.length;
    if (c > p && !anim) { const it = state.inventory.equipment[c - 1]; setLast(it); addToast(`${it.name} (${it.grade}) 획득!`, it.grade === 'epic' ? 'success' : 'info'); }
    ref.current = c;
  }, [state.inventory.equipment.length, anim, addToast, state.inventory.equipment]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-2xl">{EMOJI_MAP.specialOre}</span>
        <span className="text-lg font-bold text-cream-100 tabular-nums">{ore}</span>
        <span className="text-sm text-cream-300">/ {cost} 필요</span>
      </div>
      <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3">
        <p className="text-xs text-cream-300 mb-2 font-medium text-center">등급 확률</p>
        <div className="flex flex-col gap-1.5">
          {GACHA_RATES.map((r) => (
            <div key={r.grade} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: GRADE_COLORS[r.grade], borderColor: GRADE_COLORS[r.grade] }} />
              <span className="text-xs text-cream-100 flex-1 capitalize">{r.grade}</span>
              <span className="text-xs font-bold text-cream-100 tabular-nums">{Math.round(r.chance * 100)}%</span>
              <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${r.chance * 100}%`, backgroundColor: GRADE_COLORS[r.grade] }} /></div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={pull} disabled={!can || anim} className={`btn-wood w-full text-lg !py-4 relative overflow-hidden ${anim ? 'animate-pulse' : ''}`}>
        {anim ? <span className="text-xl">{'\u2728'} 두근두근... {'\u2728'}</span> : <span>{'\uD83C\uDFB0'} 뽑기! ({EMOJI_MAP.specialOre}{cost})</span>}
      </button>
      {last && !anim && (
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center animate-fade-in border-2" style={{ borderColor: GRADE_COLORS[last.grade] }}>
          <p className="text-xs text-cream-300 mb-1">획득!</p>
          <span className="text-4xl block mb-2">{SLOT_EMOJI[last.slot]}</span>
          <p className="font-serif font-bold text-cream-100 text-lg drop-shadow">{last.name}</p>
          <p className="text-sm font-bold capitalize mb-2" style={{ color: GRADE_COLORS[last.grade] }}>{last.grade}</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-cream-200">
            {Object.entries(calculateEquipmentStats(last)).filter(([, v]) => v > 0).map(([s, v]) => <span key={s}>{STAT_EMOJI[s] ?? ''} {STAT_LABEL[s] ?? s}+{v}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function ShopTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [sub, setSub] = useState<'buy' | 'sell'>('buy');
  const gold = state.inventory.materials.gold;
  const buy = (it: ShopItem) => { actions.buyItem(it.id); addToast(`${it.name} 구매!`, 'success'); };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['buy', 'sell'] as const).map((t) => (
          <button key={t} onClick={() => setSub(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sub === t ? 'bg-cozy-amber text-cream-50 shadow-md' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>{t === 'buy' ? '\uD83D\uDED2 구매' : '\uD83D\uDCB0 판매'}</button>
        ))}
      </div>
      {sub === 'buy' ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-cream-200">{'\uD83D\uDCDA'} 서적</p>
          <div className="grid grid-cols-3 gap-2">
            {SHOP_INVENTORY.filter(i => i.category === 'book').map((it) => (
              <button key={it.id} onClick={() => buy(it)} disabled={gold < it.goldCost} className={gridCls(gold < it.goldCost)}>
                <span className="text-2xl">{it.emoji}</span><span className="text-[10px] font-medium text-cream-100 text-center line-clamp-1 px-1">{it.name}</span><span className="text-[10px] font-bold text-cozy-amber">{'\uD83D\uDCB0'}{it.goldCost}</span>
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-cream-200">{'\uD83C\uDF31'} 씨앗</p>
          <div className="grid grid-cols-3 gap-2">
            {SHOP_INVENTORY.filter(i => i.category === 'seed').map((it) => (
              <button key={it.id} onClick={() => buy(it)} disabled={gold < it.goldCost} className={gridCls(gold < it.goldCost)}>
                <span className="text-2xl">{it.emoji}</span><span className="text-[10px] font-medium text-cream-100 text-center line-clamp-2 px-1">{it.name}</span><span className="text-[10px] font-bold text-cozy-amber">{'\uD83D\uDCB0'}{it.goldCost}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {state.inventory.food.length > 0 && (<>
            <p className="text-xs font-bold text-cream-200">{'\uD83C\uDF56'} 음식 (개당 {SELL_PRICES.food}G)</p>
            {state.inventory.food.map((f, i) => <button key={`f-${i}`} onClick={() => actions.sellFood(i)} className={sellCls}><span className="text-lg">{'\uD83C\uDF56'}</span><span className="flex-1 text-sm font-medium text-cream-900 truncate">{f.name}</span><span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.food}G</span></button>)}
          </>)}
          {state.inventory.potions.length > 0 && (<>
            <p className="text-xs font-bold text-cream-200 mt-1">{'\uD83E\uDDEA'} 포션 (개당 {SELL_PRICES.potion}G)</p>
            {state.inventory.potions.map((p, i) => <button key={`p-${i}`} onClick={() => actions.sellPotion(i)} className={sellCls}><span className="text-lg">{'\uD83E\uDDEA'}</span><span className="flex-1 text-sm font-medium text-cream-900 truncate">{p.name}</span><span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.potion}G</span></button>)}
          </>)}
          {state.inventory.equipment.length > 0 && (<>
            <p className="text-xs font-bold text-cream-200 mt-1">{'\u2694\uFE0F'} 장비 (등급별 가격)</p>
            {state.inventory.equipment.map((eq) => <button key={`e-${eq.id}`} onClick={() => actions.sellEquipment(eq.id)} className={sellCls}><span className="text-lg">{SLOT_EMOJI[eq.slot]}</span><span className="flex-1 text-sm font-medium text-cream-900 truncate">{eq.name}{eq.enhanceLevel > 0 ? ` +${eq.enhanceLevel}` : ''}</span><span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.equipment[eq.grade]}G</span></button>)}
          </>)}
          {state.inventory.food.length === 0 && state.inventory.potions.length === 0 && state.inventory.equipment.length === 0 && <p className="text-sm text-cream-500 italic text-center py-4">판매할 아이템이 없습니다</p>}
        </div>
      )}
    </div>
  );
}

export default function BlacksmithPage() {
  const { state } = useGameState();
  const [activeTab, setActiveTab] = useState<TabType>('craft');
  const gLock = state.son.stats.level < UNLOCK_LEVELS.gacha;
  const tabs: { key: TabType; label: string; locked?: boolean }[] = [
    { key: 'craft', label: '\u2692\uFE0F 제작' }, { key: 'enhance', label: '\uD83D\uDD2E 강화' },
    { key: 'gacha', label: '\uD83C\uDFB0 가챠', locked: gLock }, { key: 'shop', label: '\uD83D\uDED2 상점' },
  ];
  const mats: MaterialKey[] = ['gold', 'wood', 'ironOre', 'mithril', 'leather', 'gems', 'enhancementStones', 'specialOre'];
  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/blacksmith.png')" }} />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">{'\u2692\uFE0F'} 대장간</h1>
        <div className="flex gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-white/10">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => !t.locked && setActiveTab(t.key)} disabled={t.locked} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white/20 text-cream-100 shadow-sm' : t.locked ? 'text-cream-500 cursor-not-allowed' : 'text-cream-300 hover:bg-white/10'}`}>
              {t.label}{t.locked && <span className="block text-[9px] text-cream-500">Lv.{UNLOCK_LEVELS.gacha}</span>}
            </button>
          ))}
        </div>
        {activeTab === 'craft' && <CraftTab />}
        {activeTab === 'enhance' && <EnhanceTab />}
        {activeTab === 'gacha' && !gLock && <GachaTab />}
        {activeTab === 'gacha' && gLock && <div className="text-center py-8"><p className="text-sm text-cream-300">{'\uD83D\uDD12'} Lv.{UNLOCK_LEVELS.gacha} 달성 시 해금됩니다</p></div>}
        {activeTab === 'shop' && <ShopTab />}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30"><MaterialBar mk={mats} /></div>
      </div>
    </div>
  );
}
