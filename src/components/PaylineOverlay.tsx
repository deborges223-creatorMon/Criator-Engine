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
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {winningPaylines.map((winLine, index) => {
          const { payline, positions, matchCount } = winLine;
          const lineColor = payline.color || '#f59e0b';

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
              {/* Outer Glow Path */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
                filter="url(#glow-gold)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />

              {/* Core White/Yellow Bright Line */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="20 10"
                initial={{ pathLength: 0, strokeDashoffset: 0 }}
                animate={{ 
                  pathLength: 1, 
                  strokeDashoffset: [-100, 0] 
                }}
                transition={{ 
                  pathLength: { duration: 0.4 },
                  strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: 'linear' } 
                }}
              />

              {/* Secondary Colored Accent Line */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Glowing Node Circles at Each Winning Position */}
              {points.map((pt, pIdx) => (
                <g key={pIdx}>
                  {/* Outer Ripple */}
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    r="28"
                    fill={lineColor}
                    opacity="0.5"
                    animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.7, 0.2, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: pIdx * 0.1 }}
                  />
                  {/* Middle Glow */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="20"
                    fill={lineColor}
                    stroke="#ffffff"
                    strokeWidth="4"
                    className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                  />
                  {/* Core White Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="#ffffff"
                  />
                </g>
              ))}

              {/* Start Badge Marker */}
              <g transform={`translate(${firstPoint.x}, ${firstPoint.y - 45})`}>
                <rect
                  x="-65"
                  y="-18"
                  width="130"
                  height="36"
                  rx="18"
                  fill="#000000"
                  stroke={lineColor}
                  strokeWidth="3"
                  className="drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]"
                />
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="16"
                  fontWeight="900"
                  letterSpacing="0.5"
                >
                  {payline.name ? payline.name.split(' ')[0] : `LINHA ${payline.id}`} ({matchCount}x)
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Floating Victory Tag Banner */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-40">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-black px-4 py-1 rounded-full font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.9)] border-2 border-white uppercase flex items-center gap-1.5"
        >
          <span>✨</span>
          <span>LINHA DE GANHO COMBINADA!</span>
          <span>✨</span>
        </motion.div>
      </div>
    </div>
  );
};
