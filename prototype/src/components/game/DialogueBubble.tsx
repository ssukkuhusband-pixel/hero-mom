'use client';

import type { ActiveDialogue } from '../../lib/types';
import { DIALOGUE_AUTO_DISMISS } from '../../lib/constants';

interface DialogueBubbleProps {
  activeDialogue: ActiveDialogue;
  onRespond: (choiceId: string) => void;
  onDismiss: () => void;
  align: 'left' | 'center' | 'right';
  gameTime: number;
}

function effectHint(effect?: { type: string; stat?: string; value: number }): string | null {
  if (!effect) return null;
  const sign = effect.value >= 0 ? '+' : '';
  const label = effect.stat === 'hp' ? 'HP' : effect.stat === 'all' ? 'ALL' : (effect.stat ?? effect.type).toUpperCase();
  return `${label}${sign}${effect.value}`;
}

export default function DialogueBubble({ activeDialogue, onRespond, onDismiss, align, gameTime }: DialogueBubbleProps) {
  const { template, startedAt, responded } = activeDialogue;
  const isBedtime = template.type === 'bedtime';
  const elapsed = gameTime - startedAt;
  const remaining = Math.max(0, DIALOGUE_AUTO_DISMISS - elapsed);
  const progress = (remaining / DIALOGUE_AUTO_DISMISS) * 100;

  const bgClass = isBedtime ? 'bg-indigo-50/95 border-indigo-300/80' : 'bg-cream-50/95 border-cream-500/80';

  return (
    <div className={`
      relative max-w-[240px] animate-fade-in whitespace-normal
      ${align === 'left' ? 'left-0' : align === 'right' ? 'right-0 -translate-x-full' : 'left-1/2 -translate-x-1/2'}
    `}>
      <div className={`${bgClass} backdrop-blur-sm border-2 rounded-xl shadow-lg overflow-hidden`}>
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-1 right-1.5 z-10 text-[10px] text-cream-400 hover:text-cream-600 leading-none"
        >
          &times;
        </button>

        {/* Son's line */}
        <div className="px-3 py-2">
          <p className="text-xs font-serif italic text-cream-900 leading-tight">
            {isBedtime && <span className="mr-0.5">&#127769;</span>}
            &ldquo;{template.sonText}&rdquo;
          </p>
        </div>

        {/* Choice buttons */}
        {!responded && (
          <div className={`flex flex-col gap-1.5 px-2.5 pb-2 ${isBedtime ? 'border-t border-indigo-200/60' : 'border-t border-cream-300/60'} pt-1.5`}>
            {template.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onRespond(choice.id)}
                className="group relative text-[10px] px-2.5 py-1.5 rounded-lg bg-cozy-amber/20 hover:bg-cozy-amber/40 text-cream-800 text-left transition-colors leading-snug"
              >
                {choice.text}
                {choice.effect && (
                  <span className="ml-1 text-[9px] text-cozy-forest/70 font-medium">
                    {effectHint(choice.effect)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Auto-dismiss progress bar */}
        <div className="h-[2px] w-full bg-cream-200/30">
          <div
            className="h-full bg-cozy-amber/30 transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tail / pointer triangle */}
      <div className={`
        absolute -bottom-2 w-0 h-0
        border-l-[6px] border-l-transparent
        border-t-[6px] ${isBedtime ? 'border-t-indigo-300/80' : 'border-t-cream-500/80'}
        border-r-[6px] border-r-transparent
        ${align === 'left' ? 'left-4' : align === 'right' ? 'right-4' : 'left-1/2 -translate-x-1/2'}
      `} />
    </div>
  );
}
