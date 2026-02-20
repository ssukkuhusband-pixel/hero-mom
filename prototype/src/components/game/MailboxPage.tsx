'use client';

import React, { useMemo } from 'react';
import { useGameState } from '@/lib/gameState';
import type { Letter } from '@/lib/types';
import { EMOJI_MAP } from '@/lib/constants';

// ============================================================
// Letter Card Component (parchment-styled)
// ============================================================

function LetterCard({ letter }: { letter: Letter }) {
  const timeStr = useMemo(() => {
    const date = new Date(letter.timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [letter.timestamp]);

  return (
    <div
      className="
        relative
        bg-gradient-to-br from-cream-50 to-cream-300
        border-2 border-cream-500
        rounded-sm
        px-5 py-4
        font-serif text-sm leading-relaxed text-cream-900
        shadow-[2px_3px_8px_rgba(61,43,31,0.12),inset_0_0_20px_rgba(212,196,168,0.3)]
      "
    >
      {/* Dashed inner border */}
      <div className="absolute top-2.5 left-2.5 right-2.5 bottom-2.5 border border-dashed border-cream-500 rounded-sm pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-xs text-cream-600">
          {EMOJI_MAP.letter} 아들의 편지
        </span>
        <span className="text-[10px] text-cream-500 tabular-nums">
          {timeStr}
        </span>
      </div>

      {/* Body */}
      <p className="relative z-10 mb-2 italic">
        {letter.text}
      </p>

      {/* Attached image */}
      {letter.imageUrl && (
        <div className="relative z-10 mb-2">
          <div className="rounded-lg overflow-hidden border-2 border-cream-400 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={letter.imageUrl}
              alt="아들이 보낸 사진"
              className="w-full max-w-[280px] mx-auto block rounded-lg"
              loading="lazy"
            />
          </div>
          <p className="text-[10px] text-cream-500 text-center mt-1 italic">
            {'\uD83D\uDCF7'} 아들이 보낸 사진
          </p>
        </div>
      )}

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
              {EMOJI_MAP.str} 전투 {letter.battlesCompleted}회 완료
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main MailboxPage Component
// ============================================================

export default function MailboxPage() {
  const { state } = useGameState();
  const { letters: savedLetters, adventure } = state;

  // Combine saved letters with current adventure letters, newest first
  const allLetters = useMemo(() => {
    const combined: Letter[] = [...savedLetters];
    // Add current adventure letters if active
    if (adventure?.active && adventure.letters) {
      combined.push(...adventure.letters);
    }
    // Sort newest first
    combined.sort((a, b) => b.timestamp - a.timestamp);
    return combined;
  }, [savedLetters, adventure]);

  const totalCount = allLetters.length;

  return (
    <div
      className="relative min-h-[calc(100vh-140px)] flex flex-col"
      style={{
        backgroundImage: "url('/hero-mom/assets/backgrounds/mailbox.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col flex-1 px-3 py-4 gap-3">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="text-2xl drop-shadow-md">{'\uD83D\uDCEC'}</span>
          <h2 className="font-serif font-bold text-cream-100 text-lg drop-shadow-sm">
            우편함
          </h2>
          <span className="text-xs text-cream-300 drop-shadow-sm">
            ({totalCount}통)
          </span>
          {adventure?.active && (
            <span className="ml-auto text-[10px] bg-cozy-forest/70 text-cream-100 px-2 py-0.5 rounded-full border border-cozy-forest/50 backdrop-blur-sm">
              {'\u2694\uFE0F'} 모험 진행 중
            </span>
          )}
        </div>

        {/* Letter list */}
        {totalCount === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-6xl drop-shadow-lg">{'\uD83D\uDCEE'}</span>
            <p className="text-base text-cream-200 font-serif italic drop-shadow-sm">
              아직 편지가 없습니다
            </p>
            <p className="text-xs text-cream-400 text-center drop-shadow-sm">
              아들이 모험을 떠나면 편지를 보내올 거예요!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-2 pr-0.5">
            {allLetters.map((letter) => (
              <LetterCard key={letter.id} letter={letter} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
