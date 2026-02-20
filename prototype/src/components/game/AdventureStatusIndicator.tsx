'use client';

import { useMemo } from 'react';
import { useGameState } from '@/lib/gameState';

export default function AdventureStatusIndicator() {
  const { state } = useGameState();
  const { adventure } = state;

  const timeInfo = useMemo(() => {
    if (!adventure?.active) {
      return { display: '0:00', percent: 0 };
    }
    const elapsed = Date.now() - adventure.startTime;
    const remaining = Math.max(0, adventure.duration - elapsed);
    const totalSecs = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const percent = Math.min(100, (elapsed / adventure.duration) * 100);
    return {
      display: `${mins}:${secs.toString().padStart(2, '0')}`,
      percent,
    };
  }, [adventure]);

  if (!adventure?.active) return null;

  return (
    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-white/10">
      <span className="text-sm animate-pulse">{'\u2694\uFE0F'}</span>
      <span className="text-xs text-cream-100 font-medium">{'\uBAA8\uD5D8 \uC911'}</span>
      <span className="text-xs text-cozy-gold font-bold tabular-nums">{timeInfo.display}</span>
      <div className="w-10 h-1.5 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cozy-forest to-[#7BC67B] rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${timeInfo.percent}%` }}
        />
      </div>
    </div>
  );
}
