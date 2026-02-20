'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { SonAction } from '@/lib/types';
import type { FurnitureKey } from '@/lib/types';
import { EMOJI_MAP, DEPARTURE_HUNGER_THRESHOLD, DEPARTURE_HP_THRESHOLD } from '@/lib/constants';
import ReturnModal from './ReturnModal';
import KitchenPage from './KitchenPage';
import FarmPage from './FarmPage';
import QuestPanel from './QuestPanel';
import QuestBadge from './QuestBadge';
import AdventureStatusIndicator from './AdventureStatusIndicator';
import PlacementModal, { type PlacementType } from './PlacementModal';
import SonCharacter from './SonCharacter';
import { FurnitureSlot } from './RoomFurniture';

// ============================================================
// Room Definitions
// ============================================================

type RoomId = 'living' | 'dining' | 'kitchen' | 'study' | 'sonRoom' | 'backyard';

interface RoomDef {
  id: RoomId;
  name: string;
  emoji: string;
  furniture: FurnitureKey[];
  bgGradient: string;
}

const ROOMS: RoomDef[] = [
  {
    id: 'living',
    name: '거실',
    emoji: '🛋️',
    furniture: ['chair', 'dummy', 'door'],
    bgGradient: 'from-amber-900/80 via-amber-800/60 to-stone-900/80',
  },
  {
    id: 'dining',
    name: '식당',
    emoji: '🍽️',
    furniture: ['table'],
    bgGradient: 'from-orange-900/80 via-orange-800/60 to-amber-950/80',
  },
  {
    id: 'kitchen',
    name: '주방',
    emoji: '🍳',
    furniture: [],
    bgGradient: 'from-red-900/80 via-orange-900/60 to-amber-950/80',
  },
  {
    id: 'study',
    name: '서재',
    emoji: '📚',
    furniture: ['desk'],
    bgGradient: 'from-emerald-900/80 via-teal-900/60 to-stone-900/80',
  },
  {
    id: 'sonRoom',
    name: '아들방',
    emoji: '🛏️',
    furniture: ['bed', 'potionShelf', 'equipmentRack'],
    bgGradient: 'from-indigo-900/80 via-blue-900/60 to-slate-900/80',
  },
  {
    id: 'backyard',
    name: '뒷마당',
    emoji: '🌿',
    furniture: ['farm'],
    bgGradient: 'from-green-900/80 via-emerald-800/60 to-stone-900/80',
  },
];

// Map each furniture to its room
const FURNITURE_TO_ROOM: Record<FurnitureKey, RoomId> = {
  chair: 'living',
  dummy: 'living',
  door: 'living',
  table: 'dining',
  desk: 'study',
  bed: 'sonRoom',
  potionShelf: 'sonRoom',
  equipmentRack: 'sonRoom',
  farm: 'backyard',
};

// Map SonAction to which furniture he's using
const ACTION_TO_FURNITURE: Partial<Record<SonAction, FurnitureKey>> = {
  [SonAction.SLEEPING]: 'bed',
  [SonAction.EATING]: 'table',
  [SonAction.TRAINING]: 'dummy',
  [SonAction.READING]: 'desk',
  [SonAction.RESTING]: 'chair',
  [SonAction.DRINKING_POTION]: 'potionShelf',
  [SonAction.DEPARTING]: 'door',
  [SonAction.FARMING]: 'farm',
};

// ============================================================
// Room Tab Bar
// ============================================================

function RoomTabs({
  activeRoom,
  onSelect,
  sonRoom,
}: {
  activeRoom: RoomId;
  onSelect: (id: RoomId) => void;
  sonRoom: RoomId | null;
}) {
  return (
    <div className="flex gap-1 px-2 py-1.5 bg-black/30 backdrop-blur-sm">
      {ROOMS.map((room) => {
        const isActive = activeRoom === room.id;
        const hasSon = sonRoom === room.id;
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`
              relative flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
              text-[11px] font-medium transition-all duration-200
              ${isActive
                ? 'bg-cozy-amber/90 text-cream-50 shadow-md shadow-cozy-amber/30'
                : 'bg-white/10 text-cream-200 hover:bg-white/20'
              }
            `}
          >
            <span className="text-sm">{room.emoji}</span>
            <span>{room.name}</span>
            {hasSon && !isActive && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-green-400 rounded-full shadow-sm animate-pulse" />
            )}
            {hasSon && isActive && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-cream-50 rounded-full shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Departure Readiness Indicator
// ============================================================

function DepartureIndicator({ hp, maxHp, hunger }: { hp: number; maxHp: number; hunger: number }) {
  const hpOk = hp >= maxHp * DEPARTURE_HP_THRESHOLD;
  const hungerOk = hunger >= DEPARTURE_HUNGER_THRESHOLD;
  const ready = hpOk && hungerOk;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm text-[10px] font-medium transition-all ${
      ready
        ? 'bg-green-500/20 border border-green-400/40 text-green-300'
        : 'bg-black/20 border border-white/10 text-cream-300'
    }`}>
      <span>{ready ? '🚀' : '⏳'}</span>
      <span className={hpOk ? 'text-green-300' : 'text-red-400'}>
        HP {Math.round((hp / maxHp) * 100)}%/{Math.round(DEPARTURE_HP_THRESHOLD * 100)}%
      </span>
      <span className="text-cream-500">·</span>
      <span className={hungerOk ? 'text-green-300' : 'text-red-400'}>
        포만감 {hunger}/{DEPARTURE_HUNGER_THRESHOLD}
      </span>
      {ready && <span className="text-green-300 animate-pulse">출발 준비 완료!</span>}
    </div>
  );
}

// ============================================================
// Main HomePage Component
// ============================================================

export default function HomePage() {
  const { state } = useGameState();
  const { son, home, adventure } = state;
  const { respondDialogue, dismissDialogue: dismissDlg } = useGameActions();

  const [activeRoom, setActiveRoom] = useState<RoomId>('living');
  const [placementModal, setPlacementModal] = useState<PlacementType | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showQuestPanel, setShowQuestPanel] = useState(false);
  const [showFarmModal, setShowFarmModal] = useState(false);

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

  // Determine which furniture son is at, and which room
  const activeFurniture = useMemo((): FurnitureKey | null => {
    if (!sonIsHome) return null;
    return ACTION_TO_FURNITURE[currentAction] ?? null;
  }, [currentAction, sonIsHome]);

  const sonRoom = useMemo((): RoomId | null => {
    if (!sonIsHome) return null;
    if (activeFurniture) return FURNITURE_TO_ROOM[activeFurniture];
    return 'living';
  }, [activeFurniture, sonIsHome]);

  // Auto-follow son to his room when he changes action
  useEffect(() => {
    if (sonRoom) setActiveRoom(sonRoom);
  }, [sonRoom]);

  const currentRoomDef = ROOMS.find((r) => r.id === activeRoom)!;
  const sonInThisRoom = sonRoom === activeRoom;

  // Item previews for furniture cards
  const tableItems = home.table.map((f) => ({ emoji: EMOJI_MAP.food, name: f.name }));
  const potionItems = home.potionShelf.map((p) => ({ emoji: EMOJI_MAP.potion, name: p.name }));
  const deskItems = home.desk.map((b) => ({ emoji: EMOJI_MAP.book, name: b.name }));
  const equipmentItems = home.equipmentRack.map((e) => ({
    emoji: EMOJI_MAP[e.slot] ?? '⚔️', name: e.name,
  }));

  const dialogue = son.dialogue;
  const activeDialogue = son.dialogueState?.activeDialogue ?? null;
  const quests = son.questState?.activeQuests ?? [];
  const completedQuests = son.questState?.completedQuests ?? [];
  const allQuests = [...quests, ...completedQuests.filter(q => state.gameTime - q.deadline < 10)];
  const isDoorOpen = currentAction === SonAction.DEPARTING;
  const sonRoomName = sonRoom ? ROOMS.find(r => r.id === sonRoom)?.name ?? '' : '';

  // Track position of active furniture for son overlay
  const roomContainerRef = useRef<HTMLDivElement>(null);
  const [sonPos, setSonPos] = useState<{ x: number; y: number } | null>(null);

  const updateSonPosition = useCallback(() => {
    if (!activeFurniture || !roomContainerRef.current) {
      setSonPos(null);
      return;
    }
    const container = roomContainerRef.current;
    const el = container.querySelector(`[data-furniture="${activeFurniture}"]`);
    if (!el) { setSonPos(null); return; }

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setSonPos({
      x: elRect.left + elRect.width / 2 - containerRect.left,
      y: elRect.bottom - containerRect.top + 4,
    });
  }, [activeFurniture]);

  useEffect(() => {
    updateSonPosition();
  }, [updateSonPosition, activeRoom]);

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener('resize', updateSonPosition);
    return () => window.removeEventListener('resize', updateSonPosition);
  }, [updateSonPosition]);

  return (
    <>
      {/* Room tabs */}
      <RoomTabs activeRoom={activeRoom} onSelect={setActiveRoom} sonRoom={sonRoom} />

      {/* Room viewport */}
      <div
        ref={roomContainerRef}
        className={`relative overflow-hidden bg-gradient-to-b ${currentRoomDef.bgGradient} transition-all duration-500`}
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "url('/hero-mom/assets/backgrounds/home.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Dim overlay for adventuring */}
        {isAdventuring && (
          <div className="absolute inset-0 bg-black/30 pointer-events-none z-10" />
        )}

        {/* Adventure status */}
        {isAdventuring && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
            <AdventureStatusIndicator />
          </div>
        )}

        {/* Room content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-4 px-3">
          {/* Room label */}
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-sm">{currentRoomDef.emoji}</span>
            <span className="text-xs text-cream-100 font-medium">{currentRoomDef.name}</span>
          </div>

          {/* Room body — kitchen renders KitchenPage inline, others show furniture grid */}
          {activeRoom === 'kitchen' ? (
            <div className="flex-1 overflow-y-auto w-full max-w-[480px] mx-auto -mx-3">
              <KitchenPage />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center w-full">
              <div className={`flex flex-wrap gap-3 justify-center items-center ${
                currentRoomDef.furniture.length === 1 ? 'max-w-[140px]' : 'max-w-[300px]'
              }`}>
                {currentRoomDef.furniture.map((fKey) => (
                  <FurnitureSlot
                    key={fKey}
                    furnitureKey={fKey}
                    activeFurniture={activeFurniture}
                    sonIsHome={sonIsHome}
                    currentAction={currentAction}
                    isDoorOpen={isDoorOpen}
                    isAdventuring={isAdventuring}
                    tableItems={tableItems}
                    potionItems={potionItems}
                    deskItems={deskItems}
                    equipmentItems={equipmentItems}
                    potionSlots={state.unlocks.potionSlots}
                    onOpenPlacement={(type) => {
                      if (type === 'farming' as PlacementType) {
                        setShowFarmModal(true);
                      } else {
                        setPlacementModal(type);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Departure readiness indicator */}
          {sonIsHome && !isAdventuring && currentAction !== SonAction.DEPARTING && (
            <DepartureIndicator hp={son.stats.hp} maxHp={son.stats.maxHp} hunger={son.stats.hunger} />
          )}

          {/* Son status when not in this room */}
          <div className="w-full flex flex-col items-center justify-end min-h-[40px]">
            {isAdventuring && (
              <div className="text-center bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                <span className="text-3xl drop-shadow-lg block mb-1">{'🚶'}</span>
                <p className="text-xs text-cream-100 font-serif drop-shadow-sm">
                  {'아들이 모험을 떠났습니다...'}
                </p>
              </div>
            )}
            {sonIsHome && !sonInThisRoom && (
              <button
                onClick={() => sonRoom && setActiveRoom(sonRoom)}
                className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 hover:bg-black/30 transition-colors"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-cream-200">
                  {'아들은'} <strong className="text-cream-100">{sonRoomName}</strong>{'에 있습니다'}
                </span>
              </button>
            )}
            {!son.isHome && !isAdventuring && (
              <div className="text-center">
                <span className="text-3xl drop-shadow-lg">{'🚶'}</span>
                <p className="text-xs text-cream-100 font-serif drop-shadow-sm mt-1">
                  {'아들이 모험을 떠났습니다...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Son character overlay — absolute positioned near active furniture */}
        {sonInThisRoom && sonIsHome && (
          <div
            className="absolute z-20 transition-all duration-500 ease-out"
            style={
              sonPos
                ? { left: sonPos.x, top: sonPos.y, transform: 'translateX(-50%)' }
                : { left: '50%', bottom: 60, transform: 'translateX(-50%)' }
            }
          >
            <SonCharacter
              currentAction={currentAction}
              actionTimer={son.actionTimer}
              isInjured={son.isInjured}
              dialogue={dialogue}
              activeDialogue={activeDialogue}
              respondDialogue={respondDialogue}
              dismissDlg={dismissDlg}
              gameTime={state.gameTime}
            />
          </div>
        )}

        {/* Quest Badge */}
        <QuestBadge
          count={quests.length}
          onClick={() => setShowQuestPanel(prev => !prev)}
        />

        {/* Quest Panel */}
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

      {/* Farm Modal (FarmPage) */}
      {showFarmModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-green-900/90 border-b border-white/10">
            <span className="text-sm font-bold text-cream-100">{'🌾'} 농장</span>
            <button
              onClick={() => setShowFarmModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-cream-100 hover:bg-white/30 transition-colors"
            >
              {'✕'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-w-[480px] mx-auto w-full">
            <FarmPage />
          </div>
        </div>
      )}
    </>
  );
}
