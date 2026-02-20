'use client';
import React, { useState, useMemo } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canEnhance, canMaintainEquipment, canRefineEquipment, calculateEquipmentStats, enhanceEquipment as enhanceEquipmentFn, getAllEquipment } from '@/lib/game/crafting';
import { ENHANCEMENT_TABLE, EMOJI_MAP, GRADE_COLORS, UNLOCK_LEVELS, MAINTENANCE_RECIPES, DURABILITY_MAX, DURABILITY_PENALTY_THRESHOLD, REFINING_COST, REFINING_GRADE_RATES, getSmeltingStones, fmt } from '@/lib/constants';
import type { Equipment, EquipmentSlot, EquipmentGrade, MaterialKey } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

const SLOT_EMOJI: Record<EquipmentSlot, string> = { weapon: '\u2694\uFE0F', armor: '\uD83D\uDEE1\uFE0F', accessory: '\uD83D\uDC8D' };
const STAT_EMOJI: Record<string, string> = { str: '\u2694\uFE0F', def: '\uD83D\uDEE1\uFE0F', agi: '\uD83D\uDCA8', int: '\uD83D\uDCD6', hp: '\u2764\uFE0F' };
const STAT_LABEL: Record<string, string> = { str: 'STR', def: 'DEF', agi: 'AGI', int: 'INT', hp: 'HP' };
const GB: Record<EquipmentGrade, string> = { common: 'border-gray-400/40', uncommon: 'border-green-400/60', rare: 'border-blue-400/60', epic: 'border-purple-400/60' };
const GRADE_TEXT_COLOR: Record<EquipmentGrade, string> = { common: 'text-gray-400', uncommon: 'text-green-400', rare: 'text-blue-400', epic: 'text-purple-400' };
const GRADE_BG: Record<EquipmentGrade, string> = { common: 'bg-gray-400', uncommon: 'bg-green-400', rare: 'bg-blue-400', epic: 'bg-purple-400' };
const GRADE_LABEL: Record<EquipmentGrade, string> = { common: '일반', uncommon: '고급', rare: '희귀', epic: '전설' };
type TabType = 'refine' | 'maintain' | 'enhance';

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
          <span className="font-medium text-cream-200 tabular-nums">{fmt(state.inventory.materials[k])}</span>
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

/* ===== REFINE TAB (제련 + 용해 합침) ===== */
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
          <span className="text-[10px] text-cream-300 tabular-nums shrink-0">{fmt(mom.refiningExp)}/{fmt(mom.refiningMaxExp)}</span>
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
                    {STAT_EMOJI[k] ?? ''} {STAT_LABEL[k] ?? k}+{fmt(v)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smelting Section (용해) */}
      {state.unlocks.systems.smelting && (
        <SmeltSection />
      )}
    </div>
  );
}

/* ===== SMELT SECTION (inline in refine tab) ===== */
function SmeltSection() {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const doSmelt = (eq: Equipment) => {
    const stones = getSmeltingStones(eq.grade, eq.level ?? 1);
    actions.smeltEquipment(eq.id);
    addToast(`${eq.name} 용해! ⚗️ x${stones}`, 'success');
  };

  if (state.inventory.equipment.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{'🔥'}</span>
          <span className="font-serif font-bold text-cream-100 text-sm">용해</span>
        </div>
        <p className="text-xs text-cream-400 italic text-center py-2">용해할 장비가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{'🔥'}</span>
        <span className="font-serif font-bold text-cream-100 text-sm">용해</span>
        <span className="text-[10px] text-cream-400 ml-auto">불필요한 장비를 녹여 제련석 회수</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {state.inventory.equipment.map((eq) => (
          <button
            key={eq.id}
            onClick={() => doSmelt(eq)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:border-orange-400/40 hover:bg-orange-900/20 active:scale-[0.98] transition-all"
          >
            <span className="text-lg">{SLOT_EMOJI[eq.slot]}</span>
            <span className="flex-1 text-xs font-medium text-cream-100 truncate">
              {eq.name}{eq.enhanceLevel > 0 ? ` +${eq.enhanceLevel}` : ''}
            </span>
            <span className="text-[10px] text-blue-300 font-medium shrink-0">
              {'⚗️'} x{getSmeltingStones(eq.grade, eq.level ?? 1)}
            </span>
          </button>
        ))}
      </div>
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
                  <span className="text-[9px] text-cream-300 tabular-nums shrink-0">{fmt(eq.durability)}/{fmt(maxDur)}</span>
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
                {Object.keys(pre).map((s) => <span key={s} className="text-cream-100">{STAT_EMOJI[s] ?? ''} {STAT_LABEL[s] ?? s} <span className="text-cream-300">{fmt(cur[s] ?? 0)}</span>{' \u2192 '}<span className="text-green-400 font-bold">{fmt(pre[s])}</span></span>)}
              </div>
            </div>
            <button onClick={doEnhance} disabled={!canDo} className="btn-wood w-full text-sm !py-2">{'🔮'} +{sel.enhanceLevel} {'\u2192'} +{sel.enhanceLevel + 1} 강화</button>
          </>) : null}
        </div>
      )}
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function BlacksmithPage() {
  const [activeTab, setActiveTab] = useState<TabType>('refine');
  const tabs: { key: TabType; label: string }[] = [
    { key: 'refine', label: '\u2697\uFE0F 제련/용해' },
    { key: 'maintain', label: '\uD83D\uDD27 정비' },
    { key: 'enhance', label: '\uD83D\uDD2E 강화' },
  ];
  const mats: MaterialKey[] = ['gold', 'ironOre', 'mithril', 'leather', 'gems', 'enhancementStones', 'specialOre', 'refiningStone'];
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
        {activeTab === 'refine' && <RefineTab />}
        {activeTab === 'maintain' && <MaintainTab />}
        {activeTab === 'enhance' && <EnhanceTab />}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30"><MaterialBar mk={mats} /></div>
      </div>
    </div>
  );
}
