'use client';
import React, { useState, useMemo } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canCraftEquipment, canEnhance, canMaintainEquipment, canRefineEquipment, calculateEquipmentStats, enhanceEquipment as enhanceEquipmentFn, getAllEquipment } from '@/lib/game/crafting';
import { EQUIPMENT_RECIPES, ENHANCEMENT_TABLE, EMOJI_MAP, GRADE_COLORS, UNLOCK_LEVELS, SHOP_INVENTORY, SELL_PRICES, MAINTENANCE_RECIPES, DURABILITY_MAX, DURABILITY_PENALTY_THRESHOLD, REFINING_COST, REFINING_GRADE_RATES, getSmeltingStones } from '@/lib/constants';
import type { Equipment, EquipmentSlot, EquipmentGrade, MaterialKey, EquipmentRecipe } from '@/lib/types';
import type { ShopItem } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';

const SLOT_EMOJI: Record<EquipmentSlot, string> = { weapon: '\u2694\uFE0F', armor: '\uD83D\uDEE1\uFE0F', accessory: '\uD83D\uDC8D' };
const STAT_EMOJI: Record<string, string> = { str: '\u2694\uFE0F', def: '\uD83D\uDEE1\uFE0F', agi: '\uD83D\uDCA8', int: '\uD83D\uDCD6', hp: '\u2764\uFE0F' };
const STAT_LABEL: Record<string, string> = { str: 'STR', def: 'DEF', agi: 'AGI', int: 'INT', hp: 'HP' };
const GB: Record<EquipmentGrade, string> = { common: 'border-gray-400/40', uncommon: 'border-green-400/60', rare: 'border-blue-400/60', epic: 'border-purple-400/60' };
const GRADE_TEXT_COLOR: Record<EquipmentGrade, string> = { common: 'text-gray-400', uncommon: 'text-green-400', rare: 'text-blue-400', epic: 'text-purple-400' };
const GRADE_BG: Record<EquipmentGrade, string> = { common: 'bg-gray-400', uncommon: 'bg-green-400', rare: 'bg-blue-400', epic: 'bg-purple-400' };
const GRADE_LABEL: Record<EquipmentGrade, string> = { common: '일반', uncommon: '고급', rare: '희귀', epic: '전설' };
type TabType = 'craft' | 'refine' | 'maintain' | 'enhance' | 'shop';
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

function DurabilityBar({ dur, max, small }: { dur: number; max?: number; small?: boolean }) {
  const m = max ?? DURABILITY_MAX;
  const pct = Math.max(0, Math.min(100, (dur / m) * 100));
  const color = dur < 10 ? 'bg-red-500' : dur < DURABILITY_PENALTY_THRESHOLD ? 'bg-yellow-400' : 'bg-green-400';
  const h = small ? 'h-1' : 'h-1.5';
  return (
    <div className={`w-full ${h} bg-white/20 rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ===== CRAFT TAB ===== */
function CraftTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [sel, setSel] = useState<EquipmentRecipe | null>(null);

  const allEq = useMemo(() => getAllEquipment(state), [state.inventory.equipment, state.home.equipmentRack, state.son.equipment]);
  const slotHas = (slot: EquipmentSlot) => allEq.some(e => e.slot === slot);

  const craft = (r: EquipmentRecipe) => { actions.craftEquipment(r.id); addToast(`${r.name} 제작 완료!`, 'success'); setSel(null); };

  return (<>
    {/* Base recipes */}
    <div className="grid grid-cols-3 gap-2.5">
      {EQUIPMENT_RECIPES.map((r) => {
        const owned = slotHas(r.slot);
        const can = canCraftEquipment(state, r.id);
        return (
          <button key={r.id} onClick={() => !owned && setSel(r)} className={`relative flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-xl border-2 transition-all active:scale-95 bg-white/10 backdrop-blur-sm ${owned ? 'opacity-50 border-white/10' : can ? GB[r.grade] + ' shadow-[0_0_8px_rgba(74,222,128,0.25)]' : GB[r.grade]}`}>
            {owned && <span className="absolute top-1 right-1 text-[8px] bg-cream-600 text-cream-100 px-1.5 rounded-full font-bold">보유 중</span>}
            {can && !owned && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />}
            <span className="text-[28px] leading-none">{SLOT_EMOJI[r.slot]}</span>
            <span className="text-[10px] font-medium text-cream-100 leading-tight text-center line-clamp-2 px-1">{r.name}</span>
          </button>
        );
      })}
    </div>

    {/* Recipe detail modal */}
    {sel && (
      <Overlay onClose={() => setSel(null)}>
        <div className="bg-gradient-to-b from-[#2a1f14] to-[#1a1209] border border-white/20 rounded-2xl p-5 shadow-2xl">
          <button onClick={() => setSel(null)} className="absolute top-3 right-3 text-cream-400 hover:text-cream-100 text-lg">{'✕'}</button>
          <div className="flex flex-col items-center gap-1 mb-4">
            <span className="text-5xl">{SLOT_EMOJI[sel.slot]}</span>
            <p className="font-serif font-bold text-cream-100 text-lg drop-shadow">{sel.name}</p>
            <p className="text-[11px] text-cream-400 capitalize">{sel.grade}</p>
          </div>
          <div className="text-xs text-cream-100 bg-white/10 rounded-lg px-3 py-2 mb-3 text-center">
            {Object.entries(sel.baseStats).filter(([, v]) => v !== undefined && v > 0).map(([k, v]) => `${STAT_EMOJI[k] ?? ''} ${STAT_LABEL[k] ?? k}+${v}`).join('  ')}
          </div>
          <p className="text-[10px] text-cream-400 mb-1.5">{'📦'} 필요 재료</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {(Object.entries(sel.materials) as [MaterialKey, number][]).map(([k, amt]) => {
              const has = state.inventory.materials[k] ?? 0;
              return <div key={k} className="flex items-center gap-1 text-xs"><span className="text-sm">{EMOJI_MAP[k] ?? '?'}</span><span className={`tabular-nums font-medium ${has >= amt ? 'text-cream-200' : 'text-red-400'}`}>{has}/{amt}</span></div>;
            })}
          </div>
          <button onClick={() => craft(sel)} disabled={!canCraftEquipment(state, sel.id)} className="btn-wood w-full text-sm !py-2.5">{'🔨'} 제작</button>
        </div>
      </Overlay>
    )}
  </>);
}

/* ===== REFINE TAB ===== */
function RefineTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [lastResult, setLastResult] = useState<Equipment | null>(null);
  const [animating, setAnimating] = useState(false);

  const mom = state.mom;
  const stones = state.inventory.materials.refiningStone;
  const canRefine = canRefineEquipment(state);

  // Find current grade rates based on mom's refining level
  const currentRates = useMemo(() => {
    const entry = REFINING_GRADE_RATES.find(
      r => mom.refiningLevel >= r.minLevel && mom.refiningLevel <= r.maxLevel
    ) ?? REFINING_GRADE_RATES[REFINING_GRADE_RATES.length - 1];
    return entry.rates;
  }, [mom.refiningLevel]);

  const expPct = mom.refiningMaxExp > 0 ? Math.min(100, (mom.refiningExp / mom.refiningMaxExp) * 100) : 0;

  const doRefine = () => {
    setAnimating(true);
    setLastResult(null);
    // Small delay for visual feedback
    setTimeout(() => {
      actions.refineEquipment();
      setAnimating(false);
    }, 300);
  };

  // Watch for newly added equipment after refining
  const allEq = useMemo(() => getAllEquipment(state), [state.inventory.equipment, state.home.equipmentRack, state.son.equipment]);

  // After action dispatched, find the latest equipment in inventory as result
  useMemo(() => {
    if (!animating && state.inventory.equipment.length > 0) {
      const latest = state.inventory.equipment[state.inventory.equipment.length - 1];
      if (lastResult === null && latest) {
        // Only set if we're actively refining (detected by state change)
      }
    }
  }, [state.inventory.equipment, animating, lastResult]);

  const handleRefine = () => {
    if (!canRefine) return;
    const prevLen = state.inventory.equipment.length;
    actions.refineEquipment();
    // We need to get the result from state on next render
    // Use a timeout to let the state update
    setTimeout(() => {
      // The result will be shown via the effect-like pattern below
    }, 50);
  };

  // Track equipment changes to detect refine result
  const [prevEqCount, setPrevEqCount] = useState(state.inventory.equipment.length);
  useMemo(() => {
    if (state.inventory.equipment.length > prevEqCount) {
      const newEq = state.inventory.equipment[state.inventory.equipment.length - 1];
      if (newEq) {
        setLastResult(newEq);
        addToast(`${newEq.name} 제련 완료!`, 'success');
      }
    }
    setPrevEqCount(state.inventory.equipment.length);
  }, [state.inventory.equipment.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Mom's Refining Level */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'⚗️'}</span>
            <span className="font-serif font-bold text-cream-100 text-sm">제련 레벨</span>
          </div>
          <span className="text-lg font-bold text-cozy-amber">Lv.{mom.refiningLevel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cozy-amber to-yellow-300 rounded-full transition-all"
              style={{ width: `${expPct}%` }}
            />
          </div>
          <span className="text-[10px] text-cream-300 tabular-nums shrink-0">{mom.refiningExp}/{mom.refiningMaxExp}</span>
        </div>
      </div>

      {/* Grade Probabilities */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <p className="text-xs font-bold text-cream-200 mb-2.5">{'🎲'} 등급 확률</p>
        <div className="flex flex-col gap-1.5">
          {(Object.entries(currentRates) as [EquipmentGrade, number][]).map(([grade, rate]) => (
            <div key={grade} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold w-10 ${GRADE_TEXT_COLOR[grade]}`}>{GRADE_LABEL[grade]}</span>
              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${GRADE_BG[grade]}`}
                  style={{ width: `${rate * 100}%`, opacity: rate > 0 ? 1 : 0 }}
                />
              </div>
              <span className={`text-[10px] tabular-nums w-10 text-right font-medium ${rate > 0 ? 'text-cream-200' : 'text-cream-500'}`}>{Math.round(rate * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refine Action */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{'⚗️'}</span>
            <span className="text-xs text-cream-300">제련석 비용</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${stones >= REFINING_COST ? 'text-cream-100' : 'text-red-400'}`}>
            {'⚗️'} {stones} / {REFINING_COST}
          </span>
        </div>
        <button
          onClick={handleRefine}
          disabled={!canRefine}
          className="btn-wood w-full text-sm !py-3 font-bold"
        >
          {'⚗️'} 제련하기
        </button>
        <p className="text-[10px] text-cream-400 text-center mt-1.5">
          제련석 {REFINING_COST}개를 소모하여 랜덤 장비를 생성합니다
        </p>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className={`bg-white/15 backdrop-blur-sm border-2 rounded-xl p-4 ${GB[lastResult.grade]} shadow-lg`}>
          <p className="text-[10px] text-cream-300 mb-2 text-center">{'✨'} 제련 결과</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{SLOT_EMOJI[lastResult.slot]}</span>
            <div className="flex-1">
              <p className="font-serif font-bold text-cream-100 text-sm drop-shadow">{lastResult.name}</p>
              <p className={`text-[11px] font-bold ${GRADE_TEXT_COLOR[lastResult.grade]}`}>{GRADE_LABEL[lastResult.grade]}</p>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                {Object.entries(calculateEquipmentStats(lastResult)).map(([k, v]) => (
                  <span key={k} className="text-[10px] text-cream-200">
                    {STAT_EMOJI[k] ?? ''} {STAT_LABEL[k] ?? k}+{v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== MAINTAIN TAB ===== */
function MaintainTab() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const allEq = useMemo(() => getAllEquipment(state), [state.inventory.equipment, state.home.equipmentRack, state.son.equipment]);

  const allMax = allEq.every(eq => eq.durability >= (eq.maxDurability ?? DURABILITY_MAX));

  const maintain = (eq: Equipment) => {
    actions.maintainEquipment(eq.id);
    addToast(`${eq.name} 정비 완료!`, 'success');
  };

  if (allEq.length === 0) return <p className="text-sm text-cream-400 italic text-center py-6">보유한 장비가 없습니다</p>;
  if (allMax) return <p className="text-sm text-cream-300 text-center py-6">{'✨'} 모든 장비가 최상 상태입니다!</p>;

  return (
    <div className="flex flex-col gap-2">
      {allEq.map(eq => {
        const maxDur = eq.maxDurability ?? DURABILITY_MAX;
        const needRepair = eq.durability < maxDur;
        const recipe = MAINTENANCE_RECIPES[eq.slot];
        const can = canMaintainEquipment(state, eq.id);
        const mats = Object.entries(recipe.materials) as [MaterialKey, number][];
        return (
          <div key={eq.id} className={`bg-white/10 backdrop-blur-sm border rounded-xl p-3 ${needRepair ? 'border-white/20' : 'border-white/10 opacity-60'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{SLOT_EMOJI[eq.slot]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-cream-100 truncate">{eq.name}{eq.enhanceLevel > 0 && <span className="text-cozy-amber ml-1">+{eq.enhanceLevel}</span>}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <DurabilityBar dur={eq.durability} max={maxDur} />
                  <span className="text-[9px] text-cream-300 tabular-nums shrink-0">{eq.durability}/{maxDur}</span>
                </div>
              </div>
            </div>
            {needRepair && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 flex-1">
                  {mats.map(([k, amt]) => {
                    const has = state.inventory.materials[k] ?? 0;
                    return <span key={k} className="flex items-center gap-0.5 text-[10px]"><span>{EMOJI_MAP[k] ?? '?'}</span><span className={`tabular-nums ${has >= amt ? 'text-cream-200' : 'text-red-400'}`}>{has}/{amt}</span></span>;
                  })}
                </div>
                <button onClick={() => maintain(eq)} disabled={!can} className="btn-wood text-[10px] !py-1 !px-3 shrink-0">정비하기</button>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[10px] text-cream-400 text-center mt-1">정비 시 내구도 +{MAINTENANCE_RECIPES.weapon.restore} 회복</p>
    </div>
  );
}

/* ===== ENHANCE TAB ===== */
function EnhanceTab() {
  const { state, dispatch } = useGameState();
  const { addToast } = useToast();
  const [sid, setSid] = useState<string | null>(null);
  const allEq = useMemo(() => {
    const it: { eq: Equipment; loc: string }[] = [];
    state.inventory.equipment.forEach((eq) => it.push({ eq, loc: '\uC778\uBCA4\uD1A0\uB9AC' }));
    state.home.equipmentRack.forEach((eq) => it.push({ eq, loc: '\uC7A5\uBE44\uB300' }));
    const { weapon, armor, accessory } = state.son.equipment;
    if (weapon) it.push({ eq: weapon, loc: '\uC7A5\uCC29 \uC911' });
    if (armor) it.push({ eq: armor, loc: '\uC7A5\uCC29 \uC911' });
    if (accessory) it.push({ eq: accessory, loc: '\uC7A5\uCC29 \uC911' });
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
  if (!state.unlocks.systems.enhancement) return <div className="text-center py-6"><p className="text-sm text-cream-300">{'🔒'} Lv.{UNLOCK_LEVELS.enhancement} 달성 시 해금됩니다</p></div>;
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
              <div className="w-10 mt-0.5"><DurabilityBar dur={eq.durability} max={eq.maxDurability} small /></div>
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
          {isMax ? <p className="text-sm font-bold text-cozy-gold text-center py-3">{'✨'} 최대 강화 달성! {'✨'}</p> : nxt ? (<>
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
            <button onClick={doEnhance} disabled={!canDo} className="btn-wood w-full text-sm !py-2">{'🔮'} +{sel.enhanceLevel} {'\u2192'} +{sel.enhanceLevel + 1} 강화</button>
          </>) : null}
        </div>
      )}
    </div>
  );
}

/* ===== SHOP TAB ===== */
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
          <button key={t} onClick={() => setSub(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sub === t ? 'bg-cozy-amber text-cream-50 shadow-md' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>{t === 'buy' ? '\uD83D\uDED2 구매' : '\uD83D\uDCB0 판매'}</button>
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
            <p className="text-xs font-bold text-cream-200 mt-1">{smeltUnlocked ? '\u2697\uFE0F 용해 (제련석 회수)' : '\u2694\uFE0F 장비 (등급별 가격)'}</p>
            {state.inventory.equipment.map((eq) => (
              <button key={`e-${eq.id}`} onClick={() => doSellOrSmelt(eq)} className={sellCls}>
                <span className="text-lg">{SLOT_EMOJI[eq.slot]}</span>
                <span className="flex-1 text-sm font-medium text-cream-900 truncate">{eq.name}{eq.enhanceLevel > 0 ? ` +${eq.enhanceLevel}` : ''}</span>
                {smeltUnlocked ? (
                  <span className="text-[10px] text-blue-600 font-medium shrink-0">
                    {'⚗️'} x{getSmeltingStones(eq.grade, eq.level ?? 1)}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-green-600 shrink-0">+{SELL_PRICES.equipment[eq.grade]}G</span>
                )}
              </button>
            ))}
          </>)}
          {state.inventory.food.length === 0 && state.inventory.potions.length === 0 && state.inventory.equipment.length === 0 && <p className="text-sm text-cream-500 italic text-center py-4">판매할 아이템이 없습니다</p>}
        </div>
      )}
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function BlacksmithPage() {
  const { state } = useGameState();
  const [activeTab, setActiveTab] = useState<TabType>('craft');
  const tabs: { key: TabType; label: string }[] = [
    { key: 'craft', label: '\uD83D\uDD28 제작' },
    { key: 'refine', label: '\u2697\uFE0F 제련' },
    { key: 'maintain', label: '\uD83D\uDD27 정비' },
    { key: 'enhance', label: '\uD83D\uDD2E 강화' },
    { key: 'shop', label: '\uD83D\uDED2 상점' },
  ];
  const mats: MaterialKey[] = ['gold', 'wood', 'ironOre', 'mithril', 'leather', 'gems', 'enhancementStones', 'specialOre', 'refiningStone'];
  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/blacksmith.png')" }} />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">{'\uD83D\uDD28'} 대장간</h1>
        <div className="flex gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-white/10">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-medium transition-all ${activeTab === t.key ? 'bg-white/20 text-cream-100 shadow-sm' : 'text-cream-300 hover:bg-white/10'}`}>{t.label}</button>
          ))}
        </div>
        {activeTab === 'craft' && <CraftTab />}
        {activeTab === 'refine' && <RefineTab />}
        {activeTab === 'maintain' && <MaintainTab />}
        {activeTab === 'enhance' && <EnhanceTab />}
        {activeTab === 'shop' && <ShopTab />}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30"><MaterialBar mk={mats} /></div>
      </div>
    </div>
  );
}
