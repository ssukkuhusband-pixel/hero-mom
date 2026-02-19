'use client';

import { GameProvider } from '@/lib/gameState';
import { ToastProvider } from '@/components/ui/Toast';
import GameLayout from '@/components/ui/GameLayout';

export default function Home() {
  return (
    <GameProvider>
      <ToastProvider>
        <GameLayout />
      </ToastProvider>
    </GameProvider>
  );
}
