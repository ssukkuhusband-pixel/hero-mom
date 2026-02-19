'use client';

import React from 'react';

export type ProgressBarColor = 'hp' | 'hunger' | 'exp' | 'default';

interface ProgressBarProps {
  current: number;
  max: number;
  color?: ProgressBarColor;
  label?: string;
  showValues?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLOR_FILLS: Record<ProgressBarColor, { normal: string; low: string }> = {
  hp: {
    normal: 'bg-gradient-to-b from-[#6AAF6A] to-[#528A52]',
    low: 'bg-gradient-to-b from-[#C85454] to-[#A83E3E]',
  },
  hunger: {
    normal: 'bg-gradient-to-b from-[#E8943A] to-[#CC7A28]',
    low: 'bg-gradient-to-b from-[#C85454] to-[#A83E3E]',
  },
  exp: {
    normal: 'bg-gradient-to-b from-[#5AAFA5] to-[#48918A]',
    low: 'bg-gradient-to-b from-[#5AAFA5] to-[#48918A]',
  },
  default: {
    normal: 'bg-gradient-to-b from-cozy-amber to-cozy-amber-dark',
    low: 'bg-gradient-to-b from-cozy-amber to-cozy-amber-dark',
  },
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-2',
  md: 'h-3.5',
  lg: 'h-5',
};

export default function ProgressBar({
  current,
  max,
  color = 'default',
  label,
  showValues = true,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const isLow = percent <= 25;

  const fillColor = isLow ? COLOR_FILLS[color].low : COLOR_FILLS[color].normal;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValues) && (
        <div className="flex items-center justify-between mb-0.5">
          {label && (
            <span className="text-xs font-medium text-cream-800">{label}</span>
          )}
          {showValues && (
            <span className="text-xs tabular-nums text-cream-700">
              {Math.floor(current)}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`${SIZE_CLASSES[size]} bg-cream-400 border border-cream-500 rounded-full overflow-hidden relative`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${fillColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
