'use client';

import React, { useState } from 'react';
import StatusBar from './StatusBar';
import BottomNav, { type PageId } from './BottomNav';
import HomePage from '@/components/game/HomePage';
import MailboxPage from '@/components/game/MailboxPage';
import BlacksmithPage from '@/components/game/BlacksmithPage';
import KitchenPage from '@/components/game/KitchenPage';
import AlchemyPage from '@/components/game/AlchemyPage';
import FarmPage from '@/components/game/FarmPage';
import InventoryModal from '@/components/game/InventoryModal';
import SonStatusPanel from '@/components/game/SonStatusPanel';

interface GameLayoutProps {
  /** Optional: override pages externally. If not provided, uses internal state. */
  currentPage?: PageId;
  onNavigate?: (page: PageId) => void;
  children?: React.ReactNode;
  /** Map of page IDs to their React node content */
  pages?: Partial<Record<PageId, React.ReactNode>>;
}

/** Built-in page component lookup */
const DEFAULT_PAGES: Record<PageId, React.ComponentType> = {
  home: HomePage,
  mailbox: MailboxPage,
  blacksmith: BlacksmithPage,
  kitchen: KitchenPage,
  alchemy: AlchemyPage,
  farm: FarmPage,
};

/**
 * Main game layout wrapper.
 * - StatusBar fixed at top
 * - Scrollable content area
 * - BottomNav fixed at bottom
 * - Mobile-first: max-width 480px, centered
 */
export default function GameLayout({
  currentPage: controlledPage,
  onNavigate: controlledNavigate,
  children,
  pages,
}: GameLayoutProps) {
  const [internalPage, setInternalPage] = useState<PageId>('home');

  const currentPage = controlledPage ?? internalPage;
  const onNavigate = controlledNavigate ?? setInternalPage;

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [sonStatusOpen, setSonStatusOpen] = useState(false);

  // Determine what to render in the content area
  // Priority: explicit pages prop > children > default built-in pages
  let pageContent: React.ReactNode;
  if (pages) {
    pageContent = pages[currentPage];
  } else if (children) {
    pageContent = children;
  } else {
    const PageComponent = DEFAULT_PAGES[currentPage];
    pageContent = PageComponent ? <PageComponent /> : null;
  }

  return (
    <div className="game-container max-w-[480px] mx-auto min-h-screen bg-cream-100 relative overflow-hidden">
      {/* Status bar */}
      <StatusBar
        onOpenInventory={() => setInventoryOpen(!inventoryOpen)}
        onOpenSonStatus={() => setSonStatusOpen(true)}
      />

      {/* Content area: padded for top bar (60px) and bottom nav (64px) */}
      <main className="pt-[68px] pb-[72px] min-h-screen overflow-y-auto">
        {pageContent}
      </main>

      {/* Bottom navigation */}
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />

      {/* Inventory modal */}
      <InventoryModal
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
      />

      {/* Son status panel */}
      <SonStatusPanel
        isOpen={sonStatusOpen}
        onClose={() => setSonStatusOpen(false)}
      />
    </div>
  );
}
