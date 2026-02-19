'use client';

import React from 'react';
import type { EquipmentGrade } from '@/lib/types';

interface ItemSlotProps {
  emoji?: string;
  grade?: EquipmentGrade;
  enhanceLevel?: number;
  quantity?: number;
  onClick?: () => void;
  empty?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const GRADE_BORDER: Record<EquipmentGrade, string> = {
  common: 'border-grade-common',
  uncommon: 'border-grade-uncommon',
  rare: 'border-grade-rare',
  epic: 'border-grade-epic',
};

const GRADE_GLOW: Record<EquipmentGrade, string> = {
  common: '',
  uncommon: 'shadow-[0_0_6px_var(--grade-uncommon-glow)]',
  rare: 'shadow-[0_0_8px_var(--grade-rare-glow)]',
  epic: 'shadow-[inset_0_2px_4px_rgba(61,43,31,0.08),0_0_8px_rgba(155,126,200,0.3)]',
};

const SIZE_CLASSES: Record<string, { container: string; emoji: string }> = {
  sm: { container: 'w-12 h-12', emoji: 'text-xl' },
  md: { container: 'w-16 h-16', emoji: 'text-3xl' },
  lg: { container: 'w-20 h-20', emoji: 'text-4xl' },
};

export default function ItemSlot({
  emoji,
  grade,
  enhanceLevel,
  quantity,
  onClick,
  empty = false,
  size = 'md',
  className = '',
  label,
}: ItemSlotProps) {
  const sizeStyles = SIZE_CLASSES[size];

  if (empty || !emoji) {
    return (
      <button
        onClick={onClick}
        disabled={!onClick}
        className={`
          ${sizeStyles.container}
          bg-gradient-to-br from-cream-200 to-cream-400
          border-2 border-dashed border-cream-500
          rounded-xl
          flex flex-col items-center justify-center
          transition-all duration-150
          ${onClick ? 'cursor-pointer hover:border-cozy-amber hover:bg-cream-300' : 'cursor-default'}
          ${className}
        `}
      >
        {label && (
          <span className="text-[10px] text-cream-600">{label}</span>
        )}
      </button>
    );
  }

  const borderColor = grade ? GRADE_BORDER[grade] : 'border-cream-500';
  const glowEffect = grade ? GRADE_GLOW[grade] : '';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${sizeStyles.container}
        relative
        bg-gradient-to-br from-cream-200 to-cream-400
        border-2 ${borderColor}
        rounded-xl
        flex items-center justify-center
        shadow-[inset_0_2px_4px_rgba(61,43,31,0.08)]
        transition-all duration-150
        ${onClick ? 'cursor-pointer hover:border-cozy-amber hover:shadow-[inset_0_2px_4px_rgba(61,43,31,0.08),0_0_0_2px_rgba(212,137,63,0.2)]' : 'cursor-default'}
        ${glowEffect}
        ${className}
      `}
    >
      {/* Emoji */}
      <span className={`${sizeStyles.emoji} select-none`}>{emoji}</span>

      {/* Enhancement level badge */}
      {enhanceLevel != null && enhanceLevel > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-cozy-amber text-cream-50 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 shadow-sm">
          +{enhanceLevel}
        </span>
      )}

      {/* Quantity badge */}
      {quantity != null && quantity > 1 && (
        <span className="absolute -bottom-1 -right-1 bg-cream-900 text-cream-100 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 shadow-sm">
          {quantity}
        </span>
      )}

      {/* Label */}
      {label && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-cream-700 whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
}
