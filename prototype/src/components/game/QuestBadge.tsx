'use client';

interface QuestBadgeProps {
  count: number;
  onClick: () => void;
}

export default function QuestBadge({ count, onClick }: QuestBadgeProps) {
  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full
        bg-cozy-amber/90 backdrop-blur-sm border-2 border-cream-100
        shadow-lg flex items-center justify-center
        animate-bounce hover:scale-110 transition-transform"
      aria-label={`${count}개의 퀘스트`}
    >
      <span className="text-[10px] leading-none text-center">
        <span className="block text-xs">📋</span>
        <span className="block text-[9px] font-bold text-cream-900">{count}</span>
      </span>
    </button>
  );
}
