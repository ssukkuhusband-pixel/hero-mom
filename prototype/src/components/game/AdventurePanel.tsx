'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useGameState } from '@/lib/gameState';
import { EMOJI_MAP } from '@/lib/constants';

// ============================================================
// AdventurePanel - Minimal adventure status widget
//
// NOTE: As of the mailbox/home visual overhaul, this component
// is no longer used as a full-page replacement. The HomePage now
// always shows the house interior and embeds an inline adventure
// status indicator. All letter display has moved to MailboxPage.
//
// This file is kept for potential reuse as a standalone widget.
// ============================================================

function WaitingDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block w-6 text-left tabular-nums">{dots}</span>
  );
}

export default function AdventurePanel() {
  const { state } = useGameState();
  const { adventure } = state;

  const timeInfo = useMemo(() => {
    if (!adventure?.active) {
      return { remaining: 0, total: 1, percent: 100, display: '0:00' };
    }
    const elapsed = Date.now() - adventure.startTime;
    const remaining = Math.max(0, adventure.duration - elapsed);
    const totalSecs = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const percent = Math.min(100, (elapsed / adventure.duration) * 100);
    return {
      remaining,
      total: adventure.duration,
      percent,
      display: `${mins}:${secs.toString().padStart(2, '0')}`,
    };
  }, [adventure]);

  const battleProgress = adventure
    ? `${adventure.currentBattle}/${adventure.totalBattles}`
    : '0/0';

  if (!adventure?.active) {
    return (
      <div className="px-3 py-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-6xl">{'\uD83C\uDFE0'}</span>
        <p className="text-lg text-cream-600 font-serif text-center">
          아들이 모험을 떠났습니다...
        </p>
        <p className="text-sm text-cream-500">
          다른 탭에서 다음 모험을 준비해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 flex flex-col gap-4">
      {/* Adventure Timer Card */}
      <div className="bg-gradient-to-br from-[#2A3D2B] to-[#1E2E1F] rounded-2xl border-2 border-[#3D5B3E] p-5 text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">{'\uD83D\uDDFA\uFE0F'}</span>
          <span className="text-lg font-serif font-bold text-cream-100">
            모험 진행 중
            <WaitingDots />
          </span>
        </div>

        {/* Timer */}
        <div className="text-3xl font-bold text-cozy-gold tabular-nums mb-3">
          {timeInfo.display}
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-[#1a2a1b] rounded-full overflow-hidden border border-[#3D5B3E] mb-2">
          <div
            className="h-full bg-gradient-to-r from-cozy-forest to-[#7BC67B] rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${timeInfo.percent}%` }}
          />
        </div>

        {/* Battle progress */}
        <div className="flex items-center justify-center gap-4 text-sm text-cream-300">
          <span>
            {EMOJI_MAP.str} 전투 {battleProgress}
          </span>
          <span>
            {EMOJI_MAP.hp} HP {Math.round(adventure.sonHpPercent)}%
          </span>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-cream-200/80 border border-cream-400 rounded-xl px-3 py-2.5 flex items-start gap-2">
        <span className="text-sm shrink-0">{'\uD83D\uDCA1'}</span>
        <p className="text-xs text-cream-700 leading-relaxed">
          편지는 우편함 탭에서 확인할 수 있어요! 모험 중에도 다른 탭에서 다음 모험을 준비할 수 있어요.
        </p>
      </div>
    </div>
  );
}
