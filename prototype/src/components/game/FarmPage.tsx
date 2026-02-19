'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGameState, useGameActions } from '@/lib/gameState';
import { canPlantCrop, canHarvestCrop, getCropProgress } from '@/lib/game/farm';
import { CROP_DATA, EMOJI_MAP } from '@/lib/constants';
import type { MaterialKey, CropType, FarmPlot } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';

// ============================================================
// Constants
// ============================================================

const CROP_EMOJI: Record<CropType, string> = {
  wheat: '\uD83C\uDF3E',
  potato: '\uD83E\uDD54',
  carrot: '\uD83E\uDD55',
  apple: '\uD83C\uDF4E',
  redHerb: '\uD83C\uDF39',
  blueHerb: '\uD83D\uDC99',
  yellowHerb: '\uD83D\uDC9B',
};

const CROP_NAME: Record<CropType, string> = {
  wheat: '\uBC00',        // 밀
  potato: '\uAC10\uC790',   // 감자
  carrot: '\uB2F9\uADFC',   // 당근
  apple: '\uC0AC\uACFC',    // 사과
  redHerb: '\uBE68\uAC04 \uC57D\uCD08',   // 빨간 약초
  blueHerb: '\uD30C\uB780 \uC57D\uCD08',   // 파란 약초
  yellowHerb: '\uB178\uB780 \uC57D\uCD08', // 노란 약초
};

const SEED_TO_CROP: Record<string, CropType> = {
  wheatSeed: 'wheat',
  potatoSeed: 'potato',
  carrotSeed: 'carrot',
  appleSeed: 'apple',
  redHerbSeed: 'redHerb',
  blueHerbSeed: 'blueHerb',
  yellowHerbSeed: 'yellowHerb',
};

const SEED_KEYS: MaterialKey[] = [
  'wheatSeed', 'potatoSeed', 'carrotSeed', 'appleSeed',
  'redHerbSeed', 'blueHerbSeed', 'yellowHerbSeed',
];

// ============================================================
// Seed Inventory Bar
// ============================================================

function SeedInventoryBar() {
  const { state } = useGameState();

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 bg-cream-300/80 rounded-xl border border-cream-500/50">
      {SEED_KEYS.map((key) => {
        const crop = SEED_TO_CROP[key];
        const count = state.inventory.materials[key];
        return (
          <div key={key} className="flex items-center gap-1 text-xs">
            <span className="text-sm">{EMOJI_MAP[key] ?? '\uD83C\uDF31'}</span>
            <span className="text-[10px] text-cream-600">
              {crop ? CROP_NAME[crop] : key}
            </span>
            <span className="font-medium text-cream-800 tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Seed Selection Modal
// ============================================================

interface SeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  plotIndex: number;
}

function SeedSelectionModal({ isOpen, onClose, plotIndex }: SeedModalProps) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();

  const handlePlant = (crop: CropType) => {
    actions.plantCrop(plotIndex, crop);
    const cropInfo = CROP_DATA[crop];
    addToast(
      `${CROP_EMOJI[crop]} ${CROP_NAME[crop]} \uC2EC\uAE30 \uC644\uB8CC! (${cropInfo.growthTimeSeconds}\uCD08)`,
      'success'
    ); // 심기 완료! (N초)
    onClose();
  };

  // Build available seeds
  const seedOptions = SEED_KEYS.map((seedKey) => {
    const crop = SEED_TO_CROP[seedKey];
    if (!crop) return null;
    const count = state.inventory.materials[seedKey];
    const cropInfo = CROP_DATA[crop];
    const canPlant = canPlantCrop(state, plotIndex, crop);

    return {
      seedKey,
      crop,
      count,
      growthTime: cropInfo.growthTimeSeconds,
      canPlant,
    };
  }).filter(Boolean) as {
    seedKey: MaterialKey;
    crop: CropType;
    count: number;
    growthTime: number;
    canPlant: boolean;
  }[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`\uD83C\uDF31 \uC528\uC557 \uC120\uD0DD`}>
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
        {seedOptions.map(({ seedKey, crop, count, growthTime, canPlant }) => (
          <button
            key={seedKey}
            onClick={() => handlePlant(crop)}
            disabled={!canPlant}
            className={`
              flex items-center gap-3 w-full text-left
              px-3 py-2.5 rounded-lg border-2 transition-all
              ${canPlant
                ? 'border-cream-400 bg-cream-100 hover:border-cozy-forest hover:bg-green-50'
                : 'border-cream-300 bg-cream-200 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <span className="text-2xl">{CROP_EMOJI[crop]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cream-900">
                {CROP_NAME[crop]}
              </p>
              <p className="text-[10px] text-cream-600">
                {'\uC131\uC7A5: '}{growthTime}{'\uCD08'}{/* 성장: N초 */}
              </p>
            </div>
            <span
              className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg ${
                count > 0 ? 'text-cream-800 bg-cream-300' : 'text-cozy-red bg-red-50'
              }`}
            >
              x{count}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ============================================================
// Farm Plot Component
// ============================================================

interface FarmPlotCardProps {
  plot: FarmPlot;
  plotIndex: number;
}

function FarmPlotCard({ plot, plotIndex }: FarmPlotCardProps) {
  const { state } = useGameState();
  const actions = useGameActions();
  const { addToast } = useToast();
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Update progress periodically for growing crops
  useEffect(() => {
    if (!plot.crop || !plot.plantedAt || plot.ready) {
      setProgress(plot.ready ? 100 : 0);
      return;
    }

    const updateProgress = () => {
      setProgress(getCropProgress(plot));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [plot]);

  const handleHarvest = () => {
    if (!plot.crop || !canHarvestCrop(state, plotIndex)) return;

    const crop = plot.crop;
    const cropInfo = CROP_DATA[crop];
    actions.harvestCrop(plotIndex);

    addToast(
      `${CROP_EMOJI[crop]} ${CROP_NAME[crop]} \uC218\uD655!`,
      'success'
    ); // 수확!
  };

  // Get time remaining for growing crops
  const getTimeRemaining = useCallback((): string => {
    if (!plot.plantedAt || !plot.crop || plot.ready) return '';
    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    const remaining = Math.max(0, plot.growthTime - elapsed);
    if (remaining <= 0) return '\uC644\uB8CC!'; // 완료!
    const secs = Math.ceil(remaining);
    if (secs >= 60) {
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      return `${mins}\uBD84 ${remSecs}\uCD08`; // N분 N초
    }
    return `${secs}\uCD08`; // N초
  }, [plot]);

  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!plot.crop || plot.ready) {
      setTimeRemaining('');
      return;
    }
    const update = () => setTimeRemaining(getTimeRemaining());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [plot, getTimeRemaining]);

  // Empty plot
  if (!plot.crop) {
    return (
      <>
        <div className="card-parchment !p-3 flex flex-col items-center justify-center min-h-[140px] gap-2 border-dashed !border-2 !border-cream-400">
          <span className="text-3xl opacity-30">{'\uD83C\uDF31'}</span>
          <p className="text-xs text-cream-500 font-medium">{'\uBE48 \uBC2D'}{/* 빈 밭 */}</p>
          <button
            onClick={() => setSeedModalOpen(true)}
            className="btn-wood text-xs !py-1.5 !px-4"
          >
            {'\uD83C\uDF31 \uC2EC\uAE30'}{/* 심기 */}
          </button>
        </div>
        <SeedSelectionModal
          isOpen={seedModalOpen}
          onClose={() => setSeedModalOpen(false)}
          plotIndex={plotIndex}
        />
      </>
    );
  }

  const cropEmoji = CROP_EMOJI[plot.crop];
  const cropName = CROP_NAME[plot.crop];

  // Ready to harvest
  if (plot.ready) {
    return (
      <div
        className="card-parchment !p-3 flex flex-col items-center justify-center min-h-[140px] gap-2 relative overflow-hidden"
        style={{
          borderColor: 'rgba(232, 184, 74, 0.6)',
          boxShadow: '0 0 12px rgba(232, 184, 74, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 12px rgba(61, 43, 31, 0.1)',
        }}
      >
        {/* Golden glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(232, 184, 74, 0.1) 0%, transparent 70%)',
          }}
        />

        <span
          className="text-4xl relative z-10"
          style={{
            animation: 'farm-bounce 1.5s ease-in-out infinite',
          }}
        >
          {cropEmoji}
        </span>
        <p className="text-xs font-bold text-cozy-gold relative z-10">
          {'\uC218\uD655 \uAC00\uB2A5!'}{/* 수확 가능! */}
        </p>
        <button
          onClick={handleHarvest}
          className="btn-wood text-xs !py-1.5 !px-4 relative z-10"
        >
          {'\uD83C\uDF3E \uC218\uD655'}{/* 수확 */}
        </button>
      </div>
    );
  }

  // Growing state
  return (
    <div className="card-parchment !p-3 flex flex-col items-center justify-center min-h-[140px] gap-2">
      <span
        className="text-3xl"
        style={{
          animation: 'farm-pulse 2s ease-in-out infinite',
        }}
      >
        {cropEmoji}
      </span>
      <p className="text-xs font-medium text-cream-800">{cropName}</p>
      <ProgressBar
        current={progress}
        max={100}
        color="default"
        showValues={false}
        size="sm"
        className="w-full"
      />
      <p className="text-[10px] text-cream-600 tabular-nums">
        {progress}% &middot; {timeRemaining}
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

  // Count ready-to-harvest crops
  const readyCrops = farm.plots.filter((p) => p.ready).length;

  return (
    <div className="px-3 py-4 flex flex-col gap-4 pb-24">
      {/* Header */}
      <h1 className="font-serif font-bold text-xl text-cream-950 text-center">
        {'\uD83C\uDF3E'} {'\uB18D\uC7A5'}{/* 농장 */}
      </h1>

      {/* Harvest indicator */}
      {readyCrops > 0 && (
        <div className="bg-cozy-gold/20 border border-cozy-gold/40 rounded-xl px-3 py-2 text-center">
          <p className="text-sm font-medium text-cream-900">
            {'\u2728'} {readyCrops}{'\uAC1C \uC791\uBB3C \uC218\uD655 \uAC00\uB2A5!'}{/* N개 작물 수확 가능! */}
          </p>
        </div>
      )}

      {/* Farm plots grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {farm.plots.slice(0, farm.maxPlots).map((plot, index) => (
          <FarmPlotCard key={index} plot={plot} plotIndex={index} />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t-2 border-cream-400 my-1" />

      {/* Seed inventory */}
      <div>
        <h2 className="font-serif font-bold text-sm text-cream-800 mb-2">
          {'\uD83C\uDF31'} {'\uBCF4\uC720 \uC528\uC557'}{/* 보유 씨앗 */}
        </h2>
        <SeedInventoryBar />
      </div>

      {/* Bottom seed bar (fixed) */}
      <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto px-3 z-30">
        <div className="flex flex-wrap gap-2 px-3 py-2 bg-cream-300/80 rounded-xl border border-cream-500/50">
          {SEED_KEYS.map((key) => {
            const crop = SEED_TO_CROP[key];
            return (
              <div key={key} className="flex items-center gap-1 text-xs">
                <span className="text-sm">{crop ? CROP_EMOJI[crop] : EMOJI_MAP[key]}</span>
                <span className="font-medium text-cream-800 tabular-nums">
                  {state.inventory.materials[key]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes farm-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes farm-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
