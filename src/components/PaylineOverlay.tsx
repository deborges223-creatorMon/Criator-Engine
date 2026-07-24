import React from 'react';
import { motion } from 'motion/react';
import { WinningPayline } from '../utils/paylines';

interface PaylineOverlayProps {
  winningPaylines: WinningPayline[];
  numReels?: number;
  numRows?: number;
  isSpinning?: boolean;
}

export const PaylineOverlay: React.FC<PaylineOverlayProps> = ({
  winningPaylines,
  numReels = 5,
  numRows = 3,
  isSpinning = false,
}) => {
  if (isSpinning || !winningPaylines || winningPaylines.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30 w-full h-full">
      <svg 
        className="w-full h-full overflow-visible" 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-payline" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {winningPaylines.map((winLine, index) => {
          const { payline, positions, matchCount } = winLine;
          const lineColor = payline.color || '#f59e0b';
          const strokeWidth = payline.strokeWidth || 10;

          if (!positions || positions.length === 0) return null;

          // Convert col/row coordinates to viewBox (1000x1000)
          const points = positions.map(pos => ({
            x: ((pos.col + 0.5) / numReels) * 1000,
            y: ((pos.row + 0.5) / numRows) * 1000,
          }));

          const pathD = points.reduce((acc, pt, i) => {
            return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
          }, '');

          const firstPoint = points[0];
          const lastPoint = points[points.length - 1];

          return (
            <g key={payline.id || index} className="transition-all duration-300">
              {/* Outer Glow Path - Custom strokeWidth */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth * 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
                filter="url(#glow-payline)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />

              {/* Main Line - Custom strokeWidth */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />

              {/* Inner Bright Core Dash Animation */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth={Math.max(2, strokeWidth * 0.4)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="15 10"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: [-100, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Glowing Connection Dots at Winning Symbol Centers */}
              {points.map((pt, pIdx) => (
                <g key={pIdx}>
                  {/* Subtle outer pulse circle */}
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    r={strokeWidth * 2}
                    fill={lineColor}
                    opacity="0.3"
                    animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: pIdx * 0.1 }}
                  />
                  {/* Core Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={Math.max(4, strokeWidth * 0.7)}
                    fill={lineColor}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              ))}

              {/* Clean Line Indicator Badge positioned cleanly at LEFT Margin (Outside Symbols Grid) */}
              <g transform={`translate(-25, ${firstPoint.y})`}>
                <rect
                  x="-35"
                  y="-14"
                  width="70"
                  height="28"
                  rx="14"
                  fill="#000000"
                  stroke={lineColor}
                  strokeWidth="2"
                  className="drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="900"
                >
                  L{payline.id}
                </text>
              </g>

              {/* Clean Line Indicator Badge positioned cleanly at RIGHT Margin (Outside Symbols Grid) */}
              {lastPoint && (
                <g transform={`translate(1025, ${lastPoint.y})`}>
                  <rect
                    x="-35"
                    y="-14"
                    width="70"
                    height="28"
                    rx="14"
                    fill="#000000"
                    stroke={lineColor}
                    strokeWidth="2"
                    className="drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#fde047"
                    fontSize="11"
                    fontWeight="900"
                  >
                    {matchCount}x
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
