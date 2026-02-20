'use client';

import React, { useState } from 'react';
import { SonAction } from '@/lib/types';
import type { ActiveDialogue } from '@/lib/types';
import DialogueBubble from './DialogueBubble';
import SpeechBubble from './SpeechBubble';

// Son action indicators
const ACTION_INDICATOR: Record<string, { emoji: string; label: string }> = {
  [SonAction.IDLE]: { emoji: '\uD83E\uDDD1', label: '\uB300\uAE30 \uC911...' },
  [SonAction.SLEEPING]: { emoji: '\uD83D\uDCA4', label: '\uC218\uBA74 \uC911...' },
  [SonAction.TRAINING]: { emoji: '\u2694\uFE0F', label: '\uD6C8\uB828 \uC911...' },
  [SonAction.EATING]: { emoji: '\uD83C\uDF7D\uFE0F', label: '\uC2DD\uC0AC \uC911...' },
  [SonAction.READING]: { emoji: '\uD83D\uDCD6', label: '\uB3C5\uC11C \uC911...' },
  [SonAction.RESTING]: { emoji: '\uD83D\uDE0C', label: '\uD734\uC2DD \uC911...' },
  [SonAction.HEALING]: { emoji: '\uD83E\uDE79', label: '\uD68C\uBCF5 \uC911...' },
  [SonAction.DRINKING_POTION]: { emoji: '\uD83E\uDDEA', label: '\uD3EC\uC158 \uC74C\uC6A9 \uC911...' },
  [SonAction.DEPARTING]: { emoji: '\uD83D\uDEB6', label: '\uCD9C\uBC1C \uC900\uBE44 \uC911...' },
  [SonAction.ADVENTURING]: { emoji: '\u2694\uFE0F', label: '\uBAA8\uD5D8 \uC911...' },
};

interface SonCharacterProps {
  currentAction: SonAction;
  actionTimer: number;
  isInjured: boolean;
  dialogue: string | null;
  activeDialogue: ActiveDialogue | null;
  respondDialogue: (choiceId: string) => void;
  dismissDlg: () => void;
  gameTime: number;
}

export default function SonCharacter({
  currentAction,
  actionTimer,
  isInjured,
  dialogue,
  activeDialogue,
  respondDialogue,
  dismissDlg,
  gameTime,
}: SonCharacterProps) {
  const actionInfo = ACTION_INDICATOR[currentAction] ?? ACTION_INDICATOR[SonAction.IDLE];
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Dialogue / Speech bubble above son */}
      <div className="relative w-full flex justify-center mb-1">
        {activeDialogue ? (
          <DialogueBubble
            activeDialogue={activeDialogue}
            onRespond={respondDialogue}
            onDismiss={dismissDlg}
            align="center"
            gameTime={gameTime}
          />
        ) : dialogue ? (
          <SpeechBubble text={dialogue} align="center" />
        ) : null}
      </div>

      {/* Action indicator chip */}
      <div className="flex items-center justify-center gap-1 mb-1.5">
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className="text-xs animate-pulse drop-shadow-md">{actionInfo.emoji}</span>
          <span className="text-[11px] font-medium text-cream-100 drop-shadow-sm">{actionInfo.label}</span>
          {actionTimer > 0 && (
            <span className="text-[10px] text-cream-200 tabular-nums drop-shadow-sm">
              {Math.ceil(actionTimer)}s
            </span>
          )}
        </div>
      </div>

      {/* Son avatar */}
      <div
        className={`
          w-20 h-20 rounded-full
          bg-gradient-to-br from-amber-100/90 to-amber-200/90
          backdrop-blur-sm
          border-3 border-amber-300/70
          flex items-center justify-center
          shadow-xl
          transition-all duration-500
          overflow-hidden
          ${currentAction === SonAction.TRAINING ? 'animate-bounce' : ''}
          ${currentAction === SonAction.SLEEPING ? 'opacity-80' : ''}
          ${currentAction === SonAction.DEPARTING ? 'animate-pulse' : ''}
        `}
      >
        {!imgError ? (
          <img
            src="/hero-mom/assets/characters/son.png"
            alt="son"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-4xl select-none drop-shadow-md">{'\uD83E\uDDD1'}</span>
        )}
      </div>

      {/* Injury indicator */}
      {isInjured && (
        <div className="flex justify-center mt-1">
          <span className="text-[10px] bg-cozy-red/40 text-cream-100 px-2 py-0.5 rounded-full border border-cozy-red/40 backdrop-blur-sm">
            {'\uD83E\uDE79'} {'\uBD80\uC0C1'}
          </span>
        </div>
      )}
    </div>
  );
}
