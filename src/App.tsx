import React, { useState, useEffect } from 'react';
import { Menu, ShieldAlert, Volume2, VolumeX, Plus, Minus, Trophy, Coins } from 'lucide-react';
import { SlotMachine } from './components/SlotMachine';
import { SpinButton } from './components/SpinButton';
import { GameMenuModal } from './components/GameMenuModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BackgroundMedia } from './components/BackgroundMedia';
import { WinCounterOverlay } from './components/WinCounterOverlay';
import { GameState, SymbolType, AdminConfig, GameSettings, SpinHistoryItem, Payline, BonusConfig } from './types';

const ALL_SYMBOLS: SymbolType[] = ['King', 'Queen', 'Crown', 'Lion', 'Sword', 'Shield', 'Castle', 'Diamond', 'Coin', 'Dragon'];

const DEFAULT_PAYLINES: Payline[] = [
  { id: '1', name: 'Linha Central (Horizontal)', positions: [1, 1, 1, 1, 1], payoutMultiplier: 5, color: '#ef4444', active: true },
  { id: '2', name: 'Linha Superior (Horizontal)', positions: [0, 0, 0, 0, 0], payoutMultiplier: 5, color: '#3b82f6', active: true },
  { id: '3', name: 'Linha Inferior (Horizontal)', positions: [2, 2, 2, 2, 2], payoutMultiplier: 5, color: '#10b981', active: true },
  { id: '4', name: 'Viga V (Diagonal Descendente)', positions: [0, 1, 2, 1, 0], payoutMultiplier: 10, color: '#f59e0b', active: true },
  { id: '5', name: 'Viga V Invertida (Ascendente)', positions: [2, 1, 0, 1, 2], payoutMultiplier: 10, color: '#8b5cf6', active: true },
  { id: '6', name: 'Ziguezague Topo', positions: [0, 0, 1, 2, 2], payoutMultiplier: 8, color: '#ec4899', active: true },
  { id: '7', name: 'Ziguezague Base', positions: [2, 2, 1, 0, 0], payoutMultiplier: 8, color: '#06b6d4', active: true },
];

const DEFAULT_BONUS_CONFIG: BonusConfig = {
  enabled: true,
  scatterSymbol: 'Crown',
  triggerScatterCount: 3,
  freeSpinsCount: 10,
  bonusMultiplier: 3,
  bonusGameType: 'free_spins',
  bonusProbabilityPct: 5,
};

const DEFAULT_SYMBOL_PAYOUTS: Record<SymbolType, number> = {
  Dragon: 100,
  Crown: 50,
  Castle: 25,
  Lion: 15,
  Diamond: 10,
  Sword: 8,
  Shield: 5,
  Coin: 4,
  King: 3,
  Queen: 2,
};

const DEFAULT_GAME_RULES = `1. REGRAS GERAIS:
• Combine 3 ou mais símbolos idênticos em uma das linhas de pagamento ativas para vencer.
• Os pagamentos são multiplicados pelo valor da aposta por linha.
• Apenas o maior ganho por linha de pagamento é concedido.

2. LINHAS DE PAGAMENTO:
• O jogo conta com linhas de pagamento totalmente personalizáveis no Motor do Jogo.
• As combinações válidas pagam da esquerda para a direita em rolos consecutivos.

3. MODO DE BÔNUS E RODADAS GRÁTIS:
• 3 ou mais símbolos Scatter (Coroa) acionam o Modo Bônus com Rodadas Grátis!
• Durante as Rodadas Grátis, os ganhos podem ter multiplicadores adicionais.`;

const generateRandomGrid = (numReels = 5, numRows = 3): SymbolType[][] => {
  const grid: SymbolType[][] = [];
  for (let i = 0; i < numReels; i++) {
    const col: SymbolType[] = [];
    for (let j = 0; j < numRows; j++) {
      col.push(ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
    }
    grid.push(col);
  }
  return grid;
};

// Generates a grid guaranteed to contain a matching win line
const generateWinningGrid = (isBigWin: boolean, numReels = 5, numRows = 3, paylines: Payline[] = DEFAULT_PAYLINES): SymbolType[][] => {
  const symbol: SymbolType = isBigWin ? 'Crown' : ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
  const grid = generateRandomGrid(numReels, numRows);
  const reelsToMatch = isBigWin ? numReels : Math.min(3, numReels);

  const activePaylines = paylines.filter(p => p.active !== false);
  const selectedPayline = activePaylines.length > 0 ? activePaylines[Math.floor(Math.random() * activePaylines.length)] : null;

  if (selectedPayline && selectedPayline.positions) {
    for (let col = 0; col < Math.min(reelsToMatch, selectedPayline.positions.length); col++) {
      const row = selectedPayline.positions[col];
      if (row >= 0 && row < numRows) {
        grid[col][row] = symbol;
      }
    }
  } else {
    const midRow = Math.floor(numRows / 2);
    for (let col = 0; col < reelsToMatch; col++) {
      grid[col][midRow] = symbol;
    }
  }

  return grid;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    balance: 25680.00,
    bet: 10.00,
    win: 0,
    isSpinning: false,
    progression: 95,
    bigWin: false,
    freeSpinsRemaining: 0,
    inBonusMode: false,
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    targetRtp: 96.5,
    volatility: 'medium',
    forcedOutcome: 'none',
    minBet: 1.00,
    maxBet: 500.00,
    totalSpins: 0,
    totalWagered: 0,
    totalPayout: 0,
    autoWinBoost: false,
    bgImage: '/background.jpg',
    bgPosX: 0,
    bgPosY: 0,
    bgZoom: 100,
    slotTop: 32,
    slotLeft: 30,
    slotWidth: 40,
    slotHeight: 40,
    spinBottom: 4,
    spinLeft: 50,
    spinScale: 100,
    balanceTop: 3,
    balanceLeft: 3,
    betTop: 3,
    betLeft: 65,
    customSymbols: {},
    // Motor do Jogo
    numReels: 5,
    numRows: 3,
    paylines: DEFAULT_PAYLINES,
    bonusConfig: DEFAULT_BONUS_CONFIG,
    gameRulesText: DEFAULT_GAME_RULES,
    symbolPayouts: DEFAULT_SYMBOL_PAYOUTS,
    individualReelPositions: {},
  });

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    turboMode: false,
    autoSpinCount: 0,
    isAutoSpinning: false,
  });

  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  const [grid, setGrid] = useState<SymbolType[][]>(generateRandomGrid(adminConfig.numReels, adminConfig.numRows));

  useEffect(() => {
    setGrid(generateRandomGrid(adminConfig.numReels || 5, adminConfig.numRows || 3));
  }, [adminConfig.numReels, adminConfig.numRows]);

  const handleBetChange = (delta: number) => {
    if (gameState.isSpinning) return;
    const newBet = Math.max(adminConfig.minBet, Math.min(adminConfig.maxBet, gameState.bet + delta));
    setGameState(prev => ({ ...prev, bet: newBet }));
  };

  const handleSpin = () => {
    if (gameState.balance < gameState.bet || gameState.isSpinning) return;

    const currentBet = gameState.bet;

    // Deduct balance and set spinning state
    setGameState(prev => ({
      ...prev,
      balance: prev.balance - currentBet,
      win: 0,
      isSpinning: true,
      bigWin: false
    }));

    // Determine outcome based on Admin config or RTP probability
    let isBigWin = false;
    let isWin = false;
    let winMultiplier = 0;

    if (adminConfig.forcedOutcome === 'big_win') {
      isBigWin = true;
      isWin = true;
      winMultiplier = 50;
    } else if (adminConfig.forcedOutcome === 'normal_win') {
      isWin = true;
      winMultiplier = 5;
    } else if (adminConfig.forcedOutcome === 'loss') {
      isWin = false;
      winMultiplier = 0;
    } else {
      // Calculated via target RTP probability
      const rtpFactor = adminConfig.targetRtp / 100;
      const winChance = rtpFactor * (adminConfig.volatility === 'high' ? 0.35 : 0.5);
      const bigWinChance = winChance * 0.15;

      const rand = Math.random();
      if (rand < bigWinChance) {
        isBigWin = true;
        isWin = true;
        winMultiplier = 50;
      } else if (rand < winChance) {
        isWin = true;
        winMultiplier = Math.floor(Math.random() * 8) + 2; // 2x to 9x
      }
    }

    const winAmount = isWin ? currentBet * winMultiplier : 0;
    const resultGrid = isWin 
      ? generateWinningGrid(isBigWin, adminConfig.numReels || 5, adminConfig.numRows || 3, adminConfig.paylines) 
      : generateRandomGrid(adminConfig.numReels || 5, adminConfig.numRows || 3);

    // Reset forcedOutcome after use
    if (adminConfig.forcedOutcome !== 'none') {
      setAdminConfig(prev => ({ ...prev, forcedOutcome: 'none' }));
    }

    // Set outcome grid immediately
    setGrid(resultGrid);

    const spinDuration = gameSettings.turboMode ? 600 : 1500;

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        win: winAmount,
        balance: prev.balance + winAmount,
        bigWin: isBigWin,
        progression: Math.min(100, prev.progression + (isWin ? 2 : 0.5))
      }));

      // Update admin stats
      setAdminConfig(prev => ({
        ...prev,
        totalSpins: prev.totalSpins + 1,
        totalWagered: prev.totalWagered + currentBet,
        totalPayout: prev.totalPayout + winAmount,
      }));

      // Add history item
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setSpinHistory(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          time: timeStr,
          bet: currentBet,
          win: winAmount,
          multiplier: winMultiplier,
          symbols: resultGrid[0],
        },
        ...prev.slice(0, 49), // Keep last 50
      ]);

      // Auto spin check
      if (gameSettings.isAutoSpinning) {
        if (gameSettings.autoSpinCount > 1) {
          setGameSettings(prev => ({ ...prev, autoSpinCount: prev.autoSpinCount - 1 }));
        } else {
          setGameSettings(prev => ({ ...prev, isAutoSpinning: false, autoSpinCount: 0 }));
        }
      }
    }, spinDuration);
  };

  // Auto spin trigger effect
  useEffect(() => {
    if (gameSettings.isAutoSpinning && !gameState.isSpinning && gameState.balance >= gameState.bet) {
      const timer = setTimeout(() => {
        handleSpin();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameSettings.isAutoSpinning, gameState.isSpinning, gameState.balance]);

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-black font-sans text-white flex items-center justify-center overflow-hidden touch-none select-none p-0 sm:p-2">
      
      {/* Game Stage - Maintains 16:9 aspect ratio to align UI precisely with the background slot frame */}
      <div 
        className="relative w-full max-w-[1280px] max-h-[100dvh] aspect-video bg-[#050914] shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-100"
      >
        {/* Background Media Layer (Image or Infinite Loop Video) */}
        <BackgroundMedia 
          src={adminConfig.bgImage}
          posX={adminConfig.bgPosX}
          posY={adminConfig.bgPosY}
          zoom={adminConfig.bgZoom}
        />

        {/* Balance Widget - Positioned according to Admin Configuration */}
        <div 
          style={{
            top: `${adminConfig.balanceTop ?? 3}%`,
            left: `${adminConfig.balanceLeft ?? 3}%`,
            transform: `scale(${(adminConfig.balanceScale ?? 100) / 100})`,
            transformOrigin: 'top left',
            backgroundColor: adminConfig.balanceBgColor || 'rgba(0, 0, 0, 0.7)',
            borderColor: adminConfig.balanceBorderColor || 'rgba(212, 175, 55, 0.4)',
          }}
          className="absolute z-30 flex items-center gap-1.5 sm:gap-3 backdrop-blur-md px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl border shadow-lg transition-all duration-100"
        >
          <Coins className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Saldo</span>
            <span 
              style={{ color: adminConfig.balanceTextColor || '#ffffff' }}
              className="text-xs sm:text-base font-extrabold"
            >
              R$ {gameState.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Bet Controller - Positioned according to Admin Configuration */}
        <div 
          style={{
            top: `${adminConfig.betTop ?? 3}%`,
            left: `${adminConfig.betLeft ?? 65}%`,
            transform: `scale(${(adminConfig.betScale ?? 100) / 100})`,
            transformOrigin: 'top left',
            backgroundColor: adminConfig.betBgColor || 'rgba(0, 0, 0, 0.7)',
            borderColor: adminConfig.betBorderColor || 'rgba(139, 105, 20, 0.4)',
          }}
          className="absolute z-30 flex items-center backdrop-blur-md px-2 py-1 rounded-xl border gap-1 sm:gap-2 transition-all duration-100"
        >
          <button 
            onClick={() => handleBetChange(-5)}
            disabled={gameState.isSpinning}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-50 cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className="flex flex-col items-center px-1">
            <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-bold">Aposta</span>
            <span 
              style={{ color: adminConfig.betTextColor || '#fde073' }}
              className="text-xs sm:text-sm font-bold"
            >
              R$ {gameState.bet.toFixed(2)}
            </span>
          </div>
          <button 
            onClick={() => handleBetChange(5)}
            disabled={gameState.isSpinning}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Win Money Animated Counter Overlay */}
        {gameState.win > 0 && (
          <WinCounterOverlay 
            winAmount={gameState.win} 
            isBigWin={gameState.bigWin} 
            onClose={() => setGameState(prev => ({ ...prev, win: 0 }))} 
          />
        )}

        {/* Top Right Quick Menu & Win Display */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Win Display */}
          {gameState.win > 0 && (
            <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xl animate-bounce">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs sm:text-sm font-black text-emerald-300">
                +R$ {gameState.win.toFixed(2)}
              </span>
            </div>
          )}

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 sm:p-2 bg-black/70 backdrop-blur-md hover:bg-white/10 rounded-xl border border-[#d4af37]/40 text-[#d4af37] transition cursor-pointer"
            title="Menu Principal"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Admin Quick Trigger */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-1.5 sm:p-2 bg-red-950/80 backdrop-blur-md hover:bg-red-900 rounded-xl border border-red-500/50 text-red-300 transition cursor-pointer"
            title="Painel de Administração"
          >
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          </button>
        </div>

        {/* Slot Machine Area - Positioned according to Admin Configuration */}
        <div 
          style={{
            top: `${adminConfig.slotTop ?? 32}%`,
            left: `${adminConfig.slotLeft ?? 30}%`,
            width: `${adminConfig.slotWidth ?? 40}%`,
            height: `${adminConfig.slotHeight ?? 40}%`,
          }}
          className="absolute flex items-center justify-center z-10 transition-all duration-100"
        >
          <SlotMachine 
            isSpinning={gameState.isSpinning} 
            grid={grid} 
            customSymbols={adminConfig.customSymbols}
            customSymbolConfigs={adminConfig.customSymbolConfigs}
            showReelBorders={adminConfig.showReelBorders}
            showReelBg={adminConfig.showReelBg}
            individualReelPositions={adminConfig.individualReelPositions}
            spinStyle={adminConfig.spinStyle}
            paylines={adminConfig.paylines}
            numReels={adminConfig.numReels}
            numRows={adminConfig.numRows}
          />
        </div>
        
        {/* Spin Button Area - Positioned according to Admin Configuration */}
        <div 
          style={{
            bottom: `${adminConfig.spinBottom ?? 4}%`,
            left: `${adminConfig.spinLeft ?? 50}%`,
            transform: `translateX(-50%) scale(${(adminConfig.spinScale ?? 100) / 100})`,
          }}
          className="absolute z-20 transition-all duration-100"
        >
          <SpinButton onSpin={handleSpin} isSpinning={gameState.isSpinning} />
        </div>

      </div>

      {/* GAME MENU MODAL */}
      <GameMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={gameSettings}
        onUpdateSettings={(newSettings) => setGameSettings(prev => ({ ...prev, ...newSettings }))}
        history={spinHistory}
        onOpenAdmin={() => setIsAdminOpen(true)}
        gameRulesText={adminConfig.gameRulesText}
        paylines={adminConfig.paylines}
        symbolPayouts={adminConfig.symbolPayouts}
      />

      {/* ADMIN PANEL MODAL */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminConfig={adminConfig}
        onUpdateAdminConfig={(newConfig) => setAdminConfig(prev => ({ ...prev, ...newConfig }))}
        gameState={gameState}
        onUpdateBalance={(newBalance) => setGameState(prev => ({ ...prev, balance: newBalance }))}
        onResetStats={() => setAdminConfig(prev => ({ ...prev, totalSpins: 0, totalWagered: 0, totalPayout: 0 }))}
      />

    </div>
  );
}

