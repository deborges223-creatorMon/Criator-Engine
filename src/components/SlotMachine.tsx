import React, { useMemo } from 'react';
import { SlotReel } from './SlotReel';
import { PaylineOverlay } from './PaylineOverlay';
import { SymbolType, SymbolImageConfig, ReelPosition, Payline } from '../types';
import { evaluatePaylines } from '../utils/paylines';

interface SlotMachineProps {
  isSpinning: boolean;
  grid: SymbolType[][];
  customSymbols?: Partial<Record<SymbolType, string>>;
  customSymbolConfigs?: Partial<Record<SymbolType, SymbolImageConfig>>;
  showReelBorders?: boolean;
  showReelBg?: boolean;
  individualReelPositions?: Record<number, ReelPosition>;
  spinStyle?: 'smooth' | 'turbo' | 'cascade';
  paylines?: Payline[];
  numReels?: number;
  numRows?: number;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({ 
  isSpinning, 
  grid, 
  customSymbols, 
  customSymbolConfigs,
  showReelBorders,
  showReelBg,
  individualReelPositions,
  spinStyle,
  paylines,
  numReels,
  numRows,
}) => {
  const effectiveNumReels = numReels || grid?.length || 5;
  const effectiveNumRows = numRows || (grid?.[0] ? grid[0].length : 3);

  const winningPaylines = useMemo(() => {
    if (isSpinning || !grid || !paylines) return [];
    return evaluatePaylines(grid, paylines, effectiveNumReels, effectiveNumRows);
  }, [grid, paylines, isSpinning, effectiveNumReels, effectiveNumRows]);

  return (
    <div className="relative z-10 w-full h-full flex items-center justify-center p-0.5 sm:p-1 md:p-2">
      {/* SVG Payline Overlay */}
      <PaylineOverlay 
        winningPaylines={winningPaylines}
        numReels={effectiveNumReels}
        numRows={effectiveNumRows}
        isSpinning={isSpinning}
      />

      {/* Main Grid */}
      <div className="flex gap-0.5 sm:gap-1.5 md:gap-2 w-full h-full justify-center items-center">
        {grid.map((column, colIndex) => {
          const winningRows = new Set<number>();
          if (!isSpinning && winningPaylines.length > 0) {
            winningPaylines.forEach(winLine => {
              winLine.positions.forEach(pos => {
                if (pos.col === colIndex) {
                  winningRows.add(pos.row);
                }
              });
            });
          }

          return (
            <SlotReel 
              key={colIndex}
              isSpinning={isSpinning}
              resultSymbols={column}
              delay={colIndex * 200}
              customSymbols={customSymbols}
              customSymbolConfigs={customSymbolConfigs}
              showReelBorders={showReelBorders}
              showReelBg={showReelBg}
              individualPosition={individualReelPositions?.[colIndex]}
              spinStyle={spinStyle}
              winningRows={winningRows}
            />
          );
        })}
      </div>
    </div>
  );
};
