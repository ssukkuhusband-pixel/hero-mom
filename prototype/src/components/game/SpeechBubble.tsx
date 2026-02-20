'use client';

interface SpeechBubbleProps {
  text: string;
  align: 'left' | 'center' | 'right';
}

export default function SpeechBubble({ text, align }: SpeechBubbleProps) {
  return (
    <div className={`
      relative max-w-[180px] animate-fade-in whitespace-normal
      ${align === 'left' ? 'left-0' : align === 'right' ? 'right-0 -translate-x-full' : 'left-1/2 -translate-x-1/2'}
    `}>
      <div className="bg-cream-50/95 backdrop-blur-sm border-2 border-cream-500/80 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-serif text-cream-900 text-center italic leading-tight">
          &ldquo;{text}&rdquo;
        </p>
      </div>
      <div className={`
        absolute -bottom-2 w-0 h-0
        border-l-[6px] border-l-transparent
        border-t-[6px] border-t-cream-500/80
        border-r-[6px] border-r-transparent
        ${align === 'left' ? 'left-4' : align === 'right' ? 'right-4' : 'left-1/2 -translate-x-1/2'}
      `} />
    </div>
  );
}
