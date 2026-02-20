'use client';

import React from 'react';
import { useGameState } from '@/lib/gameState';

export type PageId = 'home' | 'blacksmith' | 'village' | 'mailbox';

interface NavTab {
  id: PageId;
  label: string;
  emoji: string;
  unlockLevel?: number;
  /** Show a badge with this count when > 0 */
  badgeCount?: (state: ReturnType<typeof useGameState>['state']) => number;
}

const TABS: NavTab[] = [
  { id: 'home', label: '집', emoji: '\uD83C\uDFE0' },
  { id: 'blacksmith', label: '대장간', emoji: '\u2692\uFE0F' },
  { id: 'village', label: '마을', emoji: '\uD83C\uDFD8\uFE0F' },
  {
    id: 'mailbox',
    label: '우편함',
    emoji: '\u2709\uFE0F',
    badgeCount: (state) => {
      const adventureLetterCount = state.adventure?.active ? (state.adventure.letters?.length ?? 0) : 0;
      return adventureLetterCount;
    },
  },
];

interface BottomNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { state } = useGameState();
  const sonLevel = state.son.stats.level;

  return (
    <nav
      className="
        fixed bottom-0 left-1/2 -translate-x-1/2
        w-full max-w-[480px] z-40
        bg-cream-900
        flex items-stretch
        h-16
        shadow-[0_-2px_8px_rgba(44,24,16,0.2)]
      "
    >
      {TABS.map((tab) => {
        const isActive = currentPage === tab.id;
        const isLocked = tab.unlockLevel != null && sonLevel < tab.unlockLevel;
        const badge = tab.badgeCount ? tab.badgeCount(state) : 0;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (!isLocked) onNavigate(tab.id);
            }}
            disabled={isLocked}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5
              relative transition-colors
              ${isActive
                ? 'text-cozy-amber'
                : isLocked
                  ? 'text-cream-700 opacity-40 cursor-not-allowed'
                  : 'text-cream-600 hover:text-cream-300'
              }
            `}
            aria-label={tab.label}
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cozy-amber rounded-full" />
            )}

            {/* Icon */}
            <span className="text-[26px] leading-none relative">
              {isLocked ? '\uD83D\uDD12' : tab.emoji}
              {/* Notification badge */}
              {badge > 0 && !isLocked && (
                <span className="absolute -top-1.5 -right-2.5 bg-cozy-red text-cream-50 text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {badge}
                </span>
              )}
            </span>

            {/* Label */}
            <span className="text-[11px] font-medium leading-none">
              {tab.label}
              {isLocked && tab.unlockLevel && (
                <span className="text-[9px] ml-0.5">Lv.{tab.unlockLevel}</span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
