'use client';

import React, { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(44,24,16,0.5)] backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`
          relative z-10 w-full max-w-[440px]
          bg-gradient-to-br from-cream-200 to-cream-300
          border-3 border-cream-700
          rounded-2xl p-7
          shadow-[0_16px_48px_rgba(44,24,16,0.25)]
          modal-enter
          ${className}
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                     rounded-full text-cream-700 hover:bg-cream-400 hover:text-cream-900
                     transition-colors text-lg"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Title */}
        {title && (
          <h2 className="font-serif font-bold text-lg text-cream-950 mb-4 pr-8">
            {title}
          </h2>
        )}

        {/* Body */}
        {children}
      </div>
    </div>
  );
}
