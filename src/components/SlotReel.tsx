import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { SymbolType, SymbolImageConfig } from '../types';
import { SlotSymbol } from './SlotSymbol';

interface SlotReelProps {
  isSpinning: boolean;
  resultSymbols: SymbolType[];
  delay: number;
  customSymbols?: Partial<Record<SymbolType, string>>;
  customSymbolConfigs?: Partial<Record<SymbolType, SymbolImageConfig>>;
  showReelBorders?: boolean;
  showReelBg?: boolean;
  individualPosition?: { offsetX: number; offsetY: number; scale: number };
  spinStyle?: 'smooth' | 'turbo' | 'cascade';
  winningRows?: Set<number>;
}

const ALL_SYMBOLS: SymbolType[] = ['King', 'Queen', 'Crown', 'Lion', 'Sword', 'Shield', 'Castle', 'Diamond', 'Coin', 'Dragon'];

export const SlotReel: React.FC<SlotReelProps> = ({ 
  isSpinning, 
  resultSymbols, 
  delay, 
  customSymbols, 
  customSymbolConfigs,
  showReelBorders = false,
  showReelBg = false,
  individualPosition,
  spinStyle = 'smooth',
  winningRows,
}) => {
  const [currentSymbols, setCurrentSymbols] = useState<SymbolType[]>(resultSymbols || ['Castle', 'Sword', 'Diamond']);
  const [reelSpinning, setReelSpinning] = useState<boolean>(false);
  const controls = useAnimation();

  useEffect(() => {
    let stopTimer: NodeJS.Timeout;

    // Calculate effective delay based on spin style
    const effectiveDelay = spinStyle === 'turbo' 
      ? delay * 0.35 
      : spinStyle === 'cascade' 
        ? delay * 1.2 
        : delay;

    // Loop duration based on spin style
    const loopDuration = spinStyle === 'turbo' ? 0.12 : spinStyle === 'cascade' ? 0.25 : 0.35;

    if (isSpinning) {
      setReelSpinning(true);
      controls.start({
        y: [0, -800],
        transition: {
          y: {
            repeat: Infinity,
            repeatType: "loop",
            duration: loopDuration,
            ease: spinStyle === 'cascade' ? "easeIn" : "linear",
          }
        }
      });
    } else {
      stopTimer = setTimeout(() => {
        controls.stop();
        setCurrentSymbols(resultSymbols);
        setReelSpinning(false);

        if (spinStyle === 'cascade') {
          // Cascade drop effect with gravity bounce impact
          controls.set({ y: -300 });
          controls.start({
            y: 0,
            transition: { type: "spring", stiffness: 220, damping: 11, mass: 1.2 }
          });
        } else if (spinStyle === 'turbo') {
          // Fast instant snap lock
          controls.set({ y: -25 });
          controls.start({
            y: 0,
            transition: { type: "tween", duration: 0.08, ease: "easeOut" }
          });
        } else {
          // Smooth standard spring
          controls.set({ y: -50 });
          controls.start({
            y: 0,
            transition: { type: "spring", stiffness: 350, damping: 22 }
          });
        }
      }, effectiveDelay);
    }

    return () => {
      clearTimeout(stopTimer);
    };
  }, [isSpinning, resultSymbols, delay, controls, spinStyle]);

  // Transform style for individual reel offset / scaling
  const transformStyle: React.CSSProperties = individualPosition ? {
    transform: `translate(${individualPosition.offsetX || 0}%, ${individualPosition.offsetY || 0}%) scale(${(individualPosition.scale || 100) / 100})`,
    transition: 'transform 0.15s ease-out',
  } : {};

  // Generate a long list of random symbols for the spinning blur effect
  const spinningColumn = Array.from({ length: 20 }).map((_, i) => {
    const sym = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    return (
      <div key={i} className="py-1 h-16 sm:h-20">
        <SlotSymbol 
          type={sym} 
          customImage={customSymbols?.[sym]} 
          symbolConfig={customSymbolConfigs?.[sym]}
        />
      </div>
    );
  });

  return (
    <div 
      style={transformStyle}
      className={`relative flex-1 h-full max-w-[120px] overflow-hidden rounded-md sm:rounded-xl transition-all ${
        showReelBg ? 'bg-black/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      } ${
        showReelBorders ? 'border-x sm:border-x-2 border-[#4d3d00]' : 'border-none'
      } ${
        reelSpinning && spinStyle === 'turbo' ? 'blur-[1.5px] scale-y-105 transition-all' : ''
      }`}
    >
      <motion.div 
        animate={controls}
        className="absolute top-0 w-full px-0.5 sm:px-1.5 flex flex-col h-full"
      >
        {reelSpinning ? spinningColumn : (
          <div className="flex flex-col justify-around h-full py-1 gap-1">
            {currentSymbols.map((symbol, i) => (
              <SlotSymbol 
                key={i} 
                type={symbol} 
                isWinning={winningRows?.has(i)}
                customImage={customSymbols?.[symbol]} 
                symbolConfig={customSymbolConfigs?.[symbol]}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
