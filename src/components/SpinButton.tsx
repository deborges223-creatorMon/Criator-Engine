import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

interface SpinButtonProps {
  onSpin: () => void;
  isSpinning: boolean;
}

export const SpinButton: React.FC<SpinButtonProps> = ({ onSpin, isSpinning }) => {
  return (
    <div className="relative group flex items-center justify-center">
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-[15px] sm:blur-[25px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
      
      <button
        onClick={onSpin}
        disabled={isSpinning}
        className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] border-2 sm:border-3 border-[#8b6914] shadow-[inset_0_0_15px_rgba(212,175,55,0.2),0_6px_20px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden transition-transform duration-100 hover:scale-105 active:scale-95 disabled:opacity-80 disabled:hover:scale-100 cursor-pointer"
      >
        {/* Animated Gears/Decorations */}
        <motion.div
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 border-[3px] sm:border-[5px] border-dashed border-[#d4af37]/30 rounded-full"
        />
        <motion.div
          animate={isSpinning ? { rotate: -360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-1.5 sm:inset-2.5 border-[2px] sm:border-[3px] border-dotted border-[#d4af37]/50 rounded-full"
        />
        
        {/* Central Gem/Text */}
        <div className="z-10 flex flex-col items-center justify-center">
          <span className="text-xs sm:text-sm md:text-base font-extrabold text-gold-gradient tracking-wider sm:tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
            Girar
          </span>
          {isSpinning && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mt-0.5"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4af37]" />
            </motion.div>
          )}
        </div>
      </button>
    </div>
  );
};

