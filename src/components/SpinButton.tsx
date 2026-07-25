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
      <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-[30px] opacity-25 group-hover:opacity-50 transition-opacity duration-500" />
      
      <button
        onClick={onSpin}
        disabled={isSpinning}
        className="relative w-[180px] h-[180px] rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] border-[6px] border-[#8b6914] shadow-[inset_0_0_25px_rgba(212,175,55,0.3),0_10px_30px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden transition-transform duration-100 hover:scale-105 active:scale-95 disabled:opacity-80 disabled:hover:scale-100 cursor-pointer"
      >
        {/* Animated Gears/Decorations */}
        <motion.div
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 border-[6px] border-dashed border-[#d4af37]/30 rounded-full"
        />
        <motion.div
          animate={isSpinning ? { rotate: -360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-3 border-[4px] border-dotted border-[#d4af37]/50 rounded-full"
        />
        
        {/* Central Gem/Text */}
        <div className="z-10 flex flex-col items-center justify-center">
          <span className="text-[28px] font-black text-gold-gradient tracking-widest drop-shadow-[0_3px_6px_rgba(0,0,0,1)] uppercase">
            Girar
          </span>
          {isSpinning && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mt-1"
            >
              <Zap className="w-8 h-8 text-[#d4af37]" />
            </motion.div>
          )}
        </div>
      </button>
    </div>
  );
};

