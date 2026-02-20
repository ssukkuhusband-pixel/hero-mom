'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canPlantCrop, canHarvestCrop, getCropProgress } from '@/lib/game/farm';
import { CROP_DATA, EMOJI_MAP } from '@/lib/constants';
import type { MaterialKey, CropType, FarmPlot } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// Constants
// ============================================================

const CROP_EMOJI: Record<CropType, string> = {
  wheat: '🌾', potato: '🥔', carrot: '🥕', apple: '🍎',
  redHerb: '🌹', blueHerb: '💙', yellowHerb: '💛',
};

const CROP_NAME: Record<CropType, string> = {
  wheat: '밀', potato: '감자', carrot: '당근', apple: '사과',
  redHerb: '빨간 약초', blueHerb: '파란 약초', yellowHerb: '노란 약초',
};

const SEED_TO_CROP: Record<string, CropType> = {
  wheatSeed: 'wheat', potatoSeed: 'potato', carrotSeed: 'carrot', appleSeed: 'apple',
  redHerbSeed: 'redHerb', blueHerbSeed: 'blueHerb', yellowHerbSeed: 'yellowHerb',
};

const SEED_KEYS: MaterialKey[] = [
  'wheatSeed', 'potatoSeed', 'carrotSeed', 'appleSeed',
  'redHerbSeed', 'blueHerbSeed', 'yellowHerbSeed',
];

// ============================================================
// Seed Selection Popup (overlay style matching other pages)
// ============================================================

function SeedSelectionPopup({
  plotIndex,
  onClose,
}: {
  plotIndex: number;
  onClose: () => void;
}) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const handlePlant = (crop: CropType) => {
    actions.plantCrop(plotIndex, crop);
    const cropInfo = CROP_DATA[crop];
    addToast(`${CROP_EMOJI[crop]} ${CROP_NAME[crop]} 심기 완료! (${cropInfo.growthTimeSeconds}초)`, 'success');
    onClose();
  };

  const seedOptions = SEED_KEYS.map((seedKey) => {
    const crop = SEED_TO_CROP[seedKey];
    if (!crop) return null;
    const count = state.inventory.materials[seedKey];
    const cropInfo = CROP_DATA[crop];
    return { seedKey, crop, count, growthTime: cropInfo.growthTimeSeconds, canPlant: canPlantCrop(state, plotIndex, crop) };
  }).filter(Boolean) as { seedKey: MaterialKey; crop: CropType; count: number; growthTime: number; canPlant: boolean }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gradient-to-b from-green-900/95 to-stone-900/95 border border-green-400/30 rounded-2xl p-5 w-full max-w-[340px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-cream-300 hover:text-cream-100 text-lg leading-none">
          ✕
        </button>

        <div className="flex flex-col items-center gap-1 mb-4">
          <span className="text-4xl">🌱</span>
          <h3 className="font-serif font-bold text-lg text-cream-100 drop-shadow">씨앗 선택</h3>
        </div>

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {seedOptions.map(({ seedKey, crop, count, growthTime, canPlant }) => (
            <button
              key={seedKey}
              onClick={() => handlePlant(crop)}
              disabled={!canPlant}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                canPlant
                  ? 'border-green-400/40 bg-white/10 hover:bg-white/20'
                  : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">{CROP_EMOJI[crop]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream-100">{CROP_NAME[crop]}</p>
                <p className="text-[10px] text-cream-400">성장: {growthTime}초</p>
              </div>
              <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg ${
                count > 0 ? 'text-cream-200 bg-white/15' : 'text-red-400 bg-red-500/15'
              }`}>
                x{count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Farm Plot Card
// ============================================================

function FarmPlotCard({ plot, plotIndex }: { plot: FarmPlot; plotIndex: number }) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!plot.crop || !plot.plantedAt || plot.ready) {
      setProgress(plot.ready ? 100 : 0);
      return;
    }
    const update = () => setProgress(getCropProgress(plot));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [plot]);

  const handleHarvest = () => {
    if (!plot.crop || !canHarvestCrop(state, plotIndex)) return;
    actions.harvestCrop(plotIndex);
    addToast(`${CROP_EMOJI[plot.crop]} ${CROP_NAME[plot.crop]} 수확!`, 'success');
  };

  const getTimeRemaining = useCallback((): string => {
    if (!plot.plantedAt || !plot.crop || plot.ready) return '';
    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    const remaining = Math.max(0, plot.growthTime - elapsed);
    if (remaining <= 0) return '완료!';
    const secs = Math.ceil(remaining);
    if (secs >= 60) return `${Math.floor(secs / 60)}분 ${secs % 60}초`;
    return `${secs}초`;
  }, [plot]);

  const [timeRemaining, setTimeRemaining] = useState('');
  useEffect(() => {
    if (!plot.crop || plot.ready) { setTimeRemaining(''); return; }
    const update = () => setTimeRemaining(getTimeRemaining());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [plot, getTimeRemaining]);

  // Empty plot
  if (!plot.crop) {
    return (
      <>
        <button
          onClick={() => setSeedModalOpen(true)}
          className="bg-white/10 border-2 border-dashed border-white/25 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[130px] gap-2 transition-all hover:bg-white/15 hover:border-white/40 active:scale-95"
        >
          <span className="text-3xl opacity-40">🌱</span>
          <p className="text-xs text-cream-300 font-medium">빈 밭</p>
          <span className="text-[10px] text-cream-400">탭하여 심기</span>
        </button>
        {seedModalOpen && (
          <SeedSelectionPopup plotIndex={plotIndex} onClose={() => setSeedModalOpen(false)} />
        )}
      </>
    );
  }

  const cropEmoji = CROP_EMOJI[plot.crop];
  const cropName = CROP_NAME[plot.crop];

  // Ready to harvest
  if (plot.ready) {
    return (
      <button
        onClick={handleHarvest}
        className="relative bg-white/15 border-2 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[130px] gap-2 overflow-hidden transition-all active:scale-95"
        style={{
          borderColor: 'rgba(232, 184, 74, 0.6)',
          boxShadow: '0 0 12px rgba(232, 184, 74, 0.35)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(232, 184, 74, 0.15) 0%, transparent 70%)',
        }} />
        <span className="text-4xl relative z-10 animate-bounce">{cropEmoji}</span>
        <p className="text-xs font-bold text-cozy-gold relative z-10 drop-shadow">수확 가능!</p>
        <span className="text-[10px] text-cream-300 relative z-10">탭하여 수확</span>
      </button>
    );
  }

  // Growing state
  return (
    <div className="bg-white/15 border border-white/20 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[130px] gap-2">
      <span className="text-3xl animate-pulse">{cropEmoji}</span>
      <p className="text-xs font-medium text-cream-100">{cropName}</p>
      <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-cream-300 tabular-nums">
        {progress}% · {timeRemaining}
      </p>
    </div>
  );
}

// ============================================================
// Main FarmPage Component
// ============================================================

export default function FarmPage() {
  const { state } = useGameState();
  const farm = state.farm;
  const readyCrops = farm.plots.filter((p) => p.ready).length;

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-mom/assets/backgrounds/farm.png')" }} />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 px-3 py-4 flex flex-col gap-4 pb-24">
        <h1 className="font-serif font-bold text-xl text-cream-100 text-center drop-shadow-lg">
          🌾 농장
        </h1>

        {readyCrops > 0 && (
          <div className="bg-cozy-gold/30 border border-cozy-gold/50 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-cream-100 drop-shadow">
              ✨ {readyCrops}개 작물 수확 가능!
            </p>
          </div>
        )}

        {/* Farm plots grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {farm.plots.slice(0, farm.maxPlots).map((plot, index) => (
            <FarmPlotCard key={index} plot={plot} plotIndex={index} />
          ))}
        </div>

        {/* Bottom seed bar */}
        <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
          <div className="flex flex-wrap gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20">
            {SEED_KEYS.map((key) => {
              const crop = SEED_TO_CROP[key];
              return (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <span className="text-sm">{crop ? CROP_EMOJI[crop] : EMOJI_MAP[key]}</span>
                  <span className="font-medium text-cream-200 tabular-nums">
                    {state.inventory.materials[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
