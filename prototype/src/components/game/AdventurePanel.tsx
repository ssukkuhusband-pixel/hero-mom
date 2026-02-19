'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useGameState } from '@/lib/gameState';
import type { Letter } from '@/lib/types';
import { EMOJI_MAP } from '@/lib/constants';
import ProgressBar from '@/components/ui/ProgressBar';

// ============================================================
// Letter Card Component
// ============================================================

function LetterCard({ letter, isNew }: { letter: Letter; isNew: boolean }) {
  const timeStr = useMemo(() => {
    const date = new Date(letter.timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [letter.timestamp]);

  return (
    <div
      className={`
        relative
        bg-gradient-to-br from-cream-50 to-cream-300
        border-2 border-cream-500
        rounded-sm
        px-5 py-4
        font-serif text-sm leading-relaxed text-cream-900
        shadow-[2px_3px_8px_rgba(61,43,31,0.12),inset_0_0_20px_rgba(212,196,168,0.3)]
        ${isNew ? 'animate-slide-in' : ''}
      `}
    >
      {/* Dashed inner border */}
      <div className="absolute top-2.5 left-2.5 right-2.5 bottom-2.5 border border-dashed border-cream-500 rounded-sm pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-xs text-cream-600">
          {EMOJI_MAP.letter} &#xC544;&#xB4E4;&#xC758; &#xD3B8;&#xC9C0;
        </span>
        <span className="text-[10px] text-cream-500 tabular-nums">
          {timeStr}
        </span>
      </div>

      {/* Body */}
      <p className="relative z-10 mb-2 italic">
        {letter.text}
      </p>

      {/* Status footer */}
      {(letter.hpPercent != null || letter.battlesCompleted != null) && (
        <div className="relative z-10 flex items-center gap-3 text-xs text-cream-600 pt-1 border-t border-cream-400/50">
          {letter.hpPercent != null && (
            <span>
              {EMOJI_MAP.hp} HP {Math.round(letter.hpPercent)}%
            </span>
          )}
          {letter.battlesCompleted != null && (
            <span>
              {EMOJI_MAP.str} &#xC804;&#xD22C; {letter.battlesCompleted}&#xD68C; &#xC644;&#xB8CC;
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Waiting Dots Animation
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

// ============================================================
// Main AdventurePanel Component
// ============================================================

export default function AdventurePanel() {
  const { state } = useGameState();
  const { adventure, letters: allLetters } = state;

  // Compute time remaining (re-render driven by game ticks)
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

  // Adventure letters, newest first
  const adventureLetters = useMemo(() => {
    if (!adventure?.letters) return [];
    return [...adventure.letters].reverse();
  }, [adventure?.letters]);

  const battleProgress = adventure
    ? `${adventure.currentBattle}/${adventure.totalBattles}`
    : '0/0';

  if (!adventure?.active) {
    // Show empty home message when son is away but adventure object is missing
    return (
      <div className="px-3 py-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-6xl">{'\uD83C\uDFE0'}</span>
        <p className="text-lg text-cream-600 font-serif text-center">
          &#xC544;&#xB4E4;&#xC774; &#xBAA8;&#xD5D8;&#xC744; &#xB5A0;&#xB0AC;&#xC2B5;&#xB2C8;&#xB2E4;...
        </p>
        <p className="text-sm text-cream-500">
          &#xB2E4;&#xB978; &#xD0ED;&#xC5D0;&#xC11C; &#xB2E4;&#xC74C; &#xBAA8;&#xD5D8;&#xC744; &#xC900;&#xBE44;&#xD574;&#xBCF4;&#xC138;&#xC694;!
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
            &#xBAA8;&#xD5D8; &#xC9C4;&#xD589; &#xC911;
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
            {EMOJI_MAP.str} &#xC804;&#xD22C; {battleProgress}
          </span>
          <span>
            {EMOJI_MAP.hp} HP {Math.round(adventure.sonHpPercent)}%
          </span>
        </div>
      </div>

      {/* Letters Section */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{'\uD83D\uDCEC'}</span>
          <h3 className="font-serif font-bold text-cream-900">
            &#xBC1B;&#xC740; &#xD3B8;&#xC9C0;
          </h3>
          {adventureLetters.length > 0 && (
            <span className="bg-cozy-red text-cream-50 text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
              {adventureLetters.length}
            </span>
          )}
        </div>

        {adventureLetters.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">{'\u2709\uFE0F'}</span>
            <p className="text-sm text-cream-500 font-serif italic">
              &#xC544;&#xC9C1; &#xD3B8;&#xC9C0;&#xAC00; &#xB3C4;&#xCC29;&#xD558;&#xC9C0; &#xC54A;&#xC558;&#xC2B5;&#xB2C8;&#xB2E4;
              <WaitingDots />
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
            {adventureLetters.map((letter, idx) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                isNew={idx === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-cream-200/80 border border-cream-400 rounded-xl px-3 py-2.5 flex items-start gap-2">
        <span className="text-sm shrink-0">{'\uD83D\uDCA1'}</span>
        <p className="text-xs text-cream-700 leading-relaxed">
          &#xBAA8;&#xD5D8; &#xC911;&#xC5D0;&#xB3C4; &#xB300;&#xC7A5;&#xAC04;, &#xC8FC;&#xBC29; &#xB4F1;&#xC5D0;&#xC11C;
          &#xB2E4;&#xC74C; &#xBAA8;&#xD5D8;&#xC744; &#xC900;&#xBE44;&#xD560; &#xC218; &#xC788;&#xC5B4;&#xC694;!
        </p>
      </div>
    </div>
  );
}
