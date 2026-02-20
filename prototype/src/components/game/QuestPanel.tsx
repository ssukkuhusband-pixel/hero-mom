'use client';

import { useState } from 'react';
import type { Quest } from '../../lib/types';
import { fmt } from '@/lib/constants';

interface QuestPanelProps {
  quests: Quest[];
  gameTime: number;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function QuestPanel({ quests, gameTime }: QuestPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (quests.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-cream-300 bg-cream-100/90 backdrop-blur-sm rounded-t-xl">
      {/* Collapsed header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-cream-800"
      >
        <span>📋 아들의 부탁 ({quests.length})</span>
        <span
          className="transition-transform duration-200 text-[10px]"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▲
        </span>
      </button>

      {/* Expanded quest list */}
      {expanded && (
        <div className="max-h-[180px] overflow-y-auto px-2 pb-2 space-y-1.5">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} gameTime={gameTime} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestCard({ quest, gameTime }: { quest: Quest; gameTime: number }) {
  const remaining = quest.deadline - gameTime;
  const isUrgent = remaining < 30 && quest.status === 'active';

  return (
    <div className="bg-cream-50/80 rounded-lg p-2 border border-cream-300">
      {/* Title row */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-medium text-cream-800 truncate flex-1">
          {quest.requestText}
        </span>
        {quest.status === 'completed' && (
          <span className="text-[10px] text-green-600 font-bold whitespace-nowrap">
            ✅ 완료!
          </span>
        )}
        {quest.status === 'failed' && (
          <span className="text-[10px] text-red-500 font-bold whitespace-nowrap">
            ❌ 실패
          </span>
        )}
        {quest.status === 'active' && (
          <span
            className={`text-[10px] font-mono whitespace-nowrap ${
              isUrgent ? 'text-red-500 font-bold' : 'text-cream-600'
            }`}
          >
            ⏰ {formatTime(remaining)}
          </span>
        )}
      </div>

      {/* Objectives */}
      <div className="space-y-1">
        {quest.objectives.map((obj, i) => {
          const progress = Math.min(obj.currentAmount / obj.targetAmount, 1);
          return (
            <div key={i} className="flex items-center gap-1.5">
              {/* Progress bar */}
              <div className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cozy-forest rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              {/* Count */}
              <span className="text-[10px] text-cream-600 tabular-nums whitespace-nowrap">
                {fmt(obj.currentAmount)}/{fmt(obj.targetAmount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
