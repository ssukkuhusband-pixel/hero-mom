'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { SonAction } from '@/lib/types';
import type { FurnitureKey } from '@/lib/types';
import { EMOJI_MAP } from '@/lib/constants';
import ReturnModal from './ReturnModal';
import QuestPanel from './QuestPanel';
import QuestBadge from './QuestBadge';
import AdventureStatusIndicator from './AdventureStatusIndicator';
import PlacementModal, { type PlacementType } from './PlacementModal';
import SonCharacter from './SonCharacter';
import { FurnitureSlot } from './RoomFurniture';

// ============================================================
// Room Definitions
// ============================================================

type RoomId = 'living' | 'kitchen' | 'study' | 'sonRoom';

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
    name: '\uAC70\uC2E4',
    emoji: '\uD83D\uDECB\uFE0F',
    furniture: ['chair', 'dummy', 'door'],
    bgGradient: 'from-amber-900/80 via-amber-800/60 to-stone-900/80',
  },
  {
    id: 'kitchen',
    name: '\uC8FC\uBC29',
    emoji: '\uD83C\uDF73',
    furniture: ['table'],
    bgGradient: 'from-orange-900/80 via-orange-800/60 to-amber-950/80',
  },
  {
    id: 'study',
    name: '\uC11C\uC7AC',
    emoji: '\uD83D\uDCDA',
    furniture: ['desk'],
    bgGradient: 'from-emerald-900/80 via-teal-900/60 to-stone-900/80',
  },
  {
    id: 'sonRoom',
    name: '\uC544\uB4E4\uBC29',
    emoji: '\uD83D\uDECF\uFE0F',
    furniture: ['bed', 'potionShelf', 'equipmentRack'],
    bgGradient: 'from-indigo-900/80 via-blue-900/60 to-slate-900/80',
  },
];

// Map each furniture to its room
const FURNITURE_TO_ROOM: Record<FurnitureKey, RoomId> = {
  chair: 'living',
  dummy: 'living',
  door: 'living',
  table: 'kitchen',
  desk: 'study',
  bed: 'sonRoom',
  potionShelf: 'sonRoom',
  equipmentRack: 'sonRoom',
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
    emoji: EMOJI_MAP[e.slot] ?? '\u2694\uFE0F', name: e.name,
  }));

  const dialogue = son.dialogue;
  const activeDialogue = son.dialogueState?.activeDialogue ?? null;
  const quests = son.questState?.activeQuests ?? [];
  const completedQuests = son.questState?.completedQuests ?? [];
  const allQuests = [...quests, ...completedQuests.filter(q => state.gameTime - q.deadline < 10)];
  const isDoorOpen = currentAction === SonAction.DEPARTING;
  const sonRoomName = sonRoom ? ROOMS.find(r => r.id === sonRoom)?.name ?? '' : '';

  return (
    <>
      {/* Room tabs */}
      <RoomTabs activeRoom={activeRoom} onSelect={setActiveRoom} sonRoom={sonRoom} />

      {/* Room viewport */}
      <div
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

          {/* Furniture grid */}
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
                  onOpenPlacement={setPlacementModal}
                />
              ))}
            </div>
          </div>

          {/* Son character area */}
          <div className="w-full min-h-[140px] flex flex-col items-center justify-end">
            {sonInThisRoom && sonIsHome ? (
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
            ) : isAdventuring ? (
              <div className="text-center bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                <span className="text-3xl drop-shadow-lg block mb-1">{'\uD83D\uDEB6'}</span>
                <p className="text-xs text-cream-100 font-serif drop-shadow-sm">
                  {'\uC544\uB4E4\uC774 \uBAA8\uD5D8\uC744 \uB5A0\uB0AC\uC2B5\uB2C8\uB2E4...'}
                </p>
              </div>
            ) : sonIsHome && !sonInThisRoom ? (
              <button
                onClick={() => sonRoom && setActiveRoom(sonRoom)}
                className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 hover:bg-black/30 transition-colors"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-cream-200">
                  {'\uC544\uB4E4\uC740'} <strong className="text-cream-100">{sonRoomName}</strong>{'\uC5D0 \uC788\uC2B5\uB2C8\uB2E4'}
                </span>
              </button>
            ) : !son.isHome && !isAdventuring ? (
              <div className="text-center">
                <span className="text-3xl drop-shadow-lg">{'\uD83D\uDEB6'}</span>
                <p className="text-xs text-cream-100 font-serif drop-shadow-sm mt-1">
                  {'\uC544\uB4E4\uC774 \uBAA8\uD5D8\uC744 \uB5A0\uB0AC\uC2B5\uB2C8\uB2E4...'}
                </p>
              </div>
            ) : null}
          </div>
        </div>

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
    </>
  );
}
