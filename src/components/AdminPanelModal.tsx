import React, { useState, useRef } from 'react';
import { 
  Shield, X, DollarSign, Activity, Percent, Flame, RefreshCw, Key, 
  AlertTriangle, Image as ImageIcon, Move, LayoutGrid, Upload, Trash2, 
  RotateCcw, Sliders, Eye, Coins, Minus, Plus, Cpu, Layers, Gift, FileText, Check, PlusCircle, Settings, Palette, Play
} from 'lucide-react';
import { AdminConfig, GameState, SymbolType, Payline, BonusConfig, ReelPosition } from '../types';
import { SlotSymbol } from './SlotSymbol';
import { SlotMachine } from './SlotMachine';
import { BackgroundMedia } from './BackgroundMedia';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminConfig: AdminConfig;
  onUpdateAdminConfig: (newConfig: Partial<AdminConfig>) => void;
  gameState: GameState;
  onUpdateBalance: (newBalance: number) => void;
  onResetStats: () => void;
}

const SYMBOL_NAMES: { type: SymbolType; label: string }[] = [
  { type: 'Crown', label: 'Coroa Imperial' },
  { type: 'Dragon', label: 'Dragão do Reino' },
  { type: 'King', label: 'Rei Supremo' },
  { type: 'Queen', label: 'Rainha das Armas' },
  { type: 'Lion', label: 'Leão Guardião' },
  { type: 'Castle', label: 'Castelo Fortificado' },
  { type: 'Sword', label: 'Espada Mágica' },
  { type: 'Shield', label: 'Escudo Real' },
  { type: 'Diamond', label: 'Diamante Ancentral' },
  { type: 'Coin', label: 'Moeda de Ouro' },
];

const PAYLINE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#a855f7', '#6366f1'];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  adminConfig,
  onUpdateAdminConfig,
  gameState,
  onUpdateBalance,
  onResetStats,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'engine' | 'layout' | 'symbols'>('engine');
  const [testSpinning, setTestSpinning] = useState<boolean>(false);
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  
  // Motor do Jogo sub-tabs
  const [engineSubTab, setEngineSubTab] = useState<'grid' | 'paylines' | 'bonus' | 'rules'>('grid');
  const [selectedPaylineId, setSelectedPaylineId] = useState<string | null>(null);

  // Dragging state for layout preview
  const [isDraggingBg, setIsDraggingBg] = useState<boolean>(false);
  const [isDraggingSlot, setIsDraggingSlot] = useState<boolean>(false);
  const [isResizingSlot, setIsResizingSlot] = useState<boolean>(false);
  const [isDraggingSpin, setIsDraggingSpin] = useState<boolean>(false);
  const [isDraggingBalance, setIsDraggingBalance] = useState<boolean>(false);
  const [isDraggingBet, setIsDraggingBet] = useState<boolean>(false);
  const [draggingReelIndex, setDraggingReelIndex] = useState<number | null>(null);

  const dragStartRef = useRef<{ 
    x: number; 
    y: number; 
    initialX: number; 
    initialY: number; 
    initialWidth: number; 
    initialHeight: number;
  }>({ x: 0, y: 0, initialX: 0, initialY: 0, initialWidth: 40, initialHeight: 40 });
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '777' || pinInput === '1234' || pinInput === '0000' || pinInput === '') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const calculatedRtp = adminConfig.totalWagered > 0
    ? ((adminConfig.totalPayout / adminConfig.totalWagered) * 100).toFixed(2)
    : '96.50';

  const houseProfit = adminConfig.totalWagered - adminConfig.totalPayout;

  // Background image file upload
  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateAdminConfig({ bgImage: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom symbol image file upload
  const handleSymbolFileUpload = (type: SymbolType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          const updatedSymbols = { ...adminConfig.customSymbols, [type]: url };
          const updatedConfigs = {
            ...(adminConfig.customSymbolConfigs || {}),
            [type]: {
              url,
              objectFit: 'cover' as const,
              offsetX: 0,
              offsetY: 0,
              scale: 100,
            }
          };
          onUpdateAdminConfig({ customSymbols: updatedSymbols, customSymbolConfigs: updatedConfigs });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Update symbol image config
  const handleUpdateSymbolConfig = (type: SymbolType, updates: Partial<{ objectFit: 'cover' | 'contain'; offsetX: number; offsetY: number; scale: number }>) => {
    const currentConfig = adminConfig.customSymbolConfigs?.[type] || {
      url: adminConfig.customSymbols?.[type] || '',
      objectFit: 'cover',
      offsetX: 0,
      offsetY: 0,
      scale: 100,
    };
    const updatedConfigs = {
      ...(adminConfig.customSymbolConfigs || {}),
      [type]: { ...currentConfig, ...updates }
    };
    onUpdateAdminConfig({ customSymbolConfigs: updatedConfigs });
  };

  // Remove custom symbol
  const handleRemoveSymbol = (type: SymbolType) => {
    const updatedSymbols = { ...adminConfig.customSymbols };
    delete updatedSymbols[type];
    const updatedConfigs = { ...(adminConfig.customSymbolConfigs || {}) };
    delete updatedConfigs[type];
    onUpdateAdminConfig({ customSymbols: updatedSymbols, customSymbolConfigs: updatedConfigs });
  };

  // Reset layout positioning and styles
  const handleResetLayout = () => {
    onUpdateAdminConfig({
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
      balanceScale: 100,
      balanceBgColor: 'rgba(0, 0, 0, 0.7)',
      balanceTextColor: '#ffffff',
      balanceBorderColor: 'rgba(212, 175, 55, 0.4)',
      betTop: 3,
      betLeft: 65,
      betScale: 100,
      betBgColor: 'rgba(0, 0, 0, 0.7)',
      betTextColor: '#fde073',
      betBorderColor: 'rgba(139, 105, 20, 0.4)',
      showReelBorders: false,
      showReelBg: false,
      individualReelPositions: {},
    });
  };

  // Paylines Management Functions
  const handleAddPayline = () => {
    const currentPaylines = adminConfig.paylines || [];
    const numReels = adminConfig.numReels || 5;
    const numRows = adminConfig.numRows || 3;
    const defaultPos = Array(numReels).fill(Math.floor(numRows / 2));
    const newId = String(Date.now());
    const newPayline: Payline = {
      id: newId,
      name: `Linha #${currentPaylines.length + 1}`,
      positions: defaultPos,
      payoutMultiplier: 5,
      color: PAYLINE_COLORS[currentPaylines.length % PAYLINE_COLORS.length],
      active: true,
    };
    onUpdateAdminConfig({ paylines: [...currentPaylines, newPayline] });
    setSelectedPaylineId(newId);
  };

  const handleUpdatePayline = (id: string, updates: Partial<Payline>) => {
    const updated = (adminConfig.paylines || []).map(p => p.id === id ? { ...p, ...updates } : p);
    onUpdateAdminConfig({ paylines: updated });
  };

  const handleDeletePayline = (id: string) => {
    const updated = (adminConfig.paylines || []).filter(p => p.id !== id);
    onUpdateAdminConfig({ paylines: updated });
    if (selectedPaylineId === id) setSelectedPaylineId(null);
  };

  const handleSetPaylinePosition = (id: string, colIndex: number, rowIndex: number) => {
    const currentPaylines = adminConfig.paylines || [];
    const updated = currentPaylines.map(p => {
      if (p.id !== id) return p;
      const newPos = [...p.positions];
      newPos[colIndex] = rowIndex;
      return { ...p, positions: newPos };
    });
    onUpdateAdminConfig({ paylines: updated });
  };

  // Bonus Config Update
  const handleUpdateBonusConfig = (updates: Partial<BonusConfig>) => {
    const current = adminConfig.bonusConfig || {
      enabled: true,
      scatterSymbol: 'Crown',
      triggerScatterCount: 3,
      freeSpinsCount: 10,
      bonusMultiplier: 3,
      bonusGameType: 'free_spins',
      bonusProbabilityPct: 5,
    };
    onUpdateAdminConfig({ bonusConfig: { ...current, ...updates } });
  };

  // Symbol Payout Update
  const handleUpdateSymbolPayout = (type: SymbolType, val: number) => {
    const current = adminConfig.symbolPayouts || {
      Dragon: 100, Crown: 50, Castle: 25, Lion: 15, Diamond: 10, Sword: 8, Shield: 5, Coin: 4, King: 3, Queen: 2
    };
    onUpdateAdminConfig({ symbolPayouts: { ...current, [type]: Math.max(1, val) } });
  };

  // Individual Reel Position Updates
  const handleUpdateIndividualReelPos = (reelIdx: number, updates: Partial<ReelPosition>) => {
    const currentMap = adminConfig.individualReelPositions || {};
    const currentReel = currentMap[reelIdx] || { offsetX: 0, offsetY: 0, scale: 100 };
    onUpdateAdminConfig({
      individualReelPositions: {
        ...currentMap,
        [reelIdx]: { ...currentReel, ...updates }
      }
    });
  };

  // Mouse Down Handlers
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (isDraggingSlot || isResizingSlot || isDraggingSpin || isDraggingBalance || isDraggingBet || draggingReelIndex !== null) return;
    setIsDraggingBg(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.bgPosX || 0,
      initialY: adminConfig.bgPosY || 0,
      initialWidth: adminConfig.slotWidth ?? 40,
      initialHeight: adminConfig.slotHeight ?? 40,
    };
  };

  const handleSlotMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSlot(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.slotLeft ?? 30,
      initialY: adminConfig.slotTop ?? 32,
      initialWidth: adminConfig.slotWidth ?? 40,
      initialHeight: adminConfig.slotHeight ?? 40,
    };
  };

  const handleSlotResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizingSlot(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.slotLeft ?? 30,
      initialY: adminConfig.slotTop ?? 32,
      initialWidth: adminConfig.slotWidth ?? 40,
      initialHeight: adminConfig.slotHeight ?? 40,
    };
  };

  const handleSpinMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSpin(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.spinLeft ?? 50,
      initialY: adminConfig.spinBottom ?? 4,
      initialWidth: 0,
      initialHeight: 0,
    };
  };

  const handleBalanceMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingBalance(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.balanceLeft ?? 3,
      initialY: adminConfig.balanceTop ?? 3,
      initialWidth: 0,
      initialHeight: 0,
    };
  };

  const handleBetMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingBet(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.betLeft ?? 65,
      initialY: adminConfig.betTop ?? 3,
      initialWidth: 0,
      initialHeight: 0,
    };
  };

  const handleReelMouseDown = (reelIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingReelIndex(reelIdx);
    const current = adminConfig.individualReelPositions?.[reelIdx] || { offsetX: 0, offsetY: 0, scale: 100 };
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: current.offsetX || 0,
      initialY: current.offsetY || 0,
      initialWidth: current.scale || 100,
      initialHeight: 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!previewCanvasRef.current) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();

    if (draggingReelIndex !== null) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newOffsetX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialX + deltaX * 2.5)));
      const newOffsetY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialY + deltaY * 2.5)));
      
      const currentMap = adminConfig.individualReelPositions || {};
      const currentReel = currentMap[draggingReelIndex] || { offsetX: 0, offsetY: 0, scale: 100 };
      onUpdateAdminConfig({
        individualReelPositions: {
          ...currentMap,
          [draggingReelIndex]: { ...currentReel, offsetX: newOffsetX, offsetY: newOffsetY }
        }
      });
      return;
    }

    if (isDraggingBg) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialX + deltaX)));
      const newY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialY + deltaY)));
      onUpdateAdminConfig({ bgPosX: newX, bgPosY: newY });
    } else if (isDraggingSlot) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newLeft = Math.max(0, Math.min(100 - (adminConfig.slotWidth ?? 40), Math.round(dragStartRef.current.initialX + deltaX)));
      const newTop = Math.max(0, Math.min(100 - (adminConfig.slotHeight ?? 40), Math.round(dragStartRef.current.initialY + deltaY)));
      onUpdateAdminConfig({ slotLeft: newLeft, slotTop: newTop });
    } else if (isResizingSlot) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newWidth = Math.max(15, Math.min(90, Math.round(dragStartRef.current.initialWidth + deltaX)));
      const newHeight = Math.max(15, Math.min(90, Math.round(dragStartRef.current.initialHeight + deltaY)));
      onUpdateAdminConfig({ slotWidth: newWidth, slotHeight: newHeight });
    } else if (isDraggingSpin) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((dragStartRef.current.y - e.clientY) / rect.height) * 100;
      const newLeft = Math.max(10, Math.min(90, Math.round(dragStartRef.current.initialX + deltaX)));
      const newBottom = Math.max(0, Math.min(80, Math.round(dragStartRef.current.initialY + deltaY)));
      onUpdateAdminConfig({ spinLeft: newLeft, spinBottom: newBottom });
    } else if (isDraggingBalance) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newLeft = Math.max(0, Math.min(80, Math.round(dragStartRef.current.initialX + deltaX)));
      const newTop = Math.max(0, Math.min(85, Math.round(dragStartRef.current.initialY + deltaY)));
      onUpdateAdminConfig({ balanceLeft: newLeft, balanceTop: newTop });
    } else if (isDraggingBet) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newLeft = Math.max(0, Math.min(80, Math.round(dragStartRef.current.initialX + deltaX)));
      const newTop = Math.max(0, Math.min(85, Math.round(dragStartRef.current.initialY + deltaY)));
      onUpdateAdminConfig({ betLeft: newLeft, betTop: newTop });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingBg(false);
    setIsDraggingSlot(false);
    setIsResizingSlot(false);
    setIsDraggingSpin(false);
    setIsDraggingBalance(false);
    setIsDraggingBet(false);
    setDraggingReelIndex(null);
  };

  const numReels = adminConfig.numReels || 5;
  const numRows = adminConfig.numRows || 3;
  const paylines = adminConfig.paylines || [];
  const bonusConfig = adminConfig.bonusConfig || {
    enabled: true,
    scatterSymbol: 'Crown',
    triggerScatterCount: 3,
    freeSpinsCount: 10,
    bonusMultiplier: 3,
    bonusGameType: 'free_spins',
    bonusProbabilityPct: 5,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-gradient-to-b from-[#1a0505] via-[#0f0a14] to-[#050914] border-2 border-red-600/60 rounded-2xl shadow-[0_0_60px_rgba(220,38,38,0.3)] flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-red-900/40 bg-red-950/40 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-sm sm:text-base font-black text-red-100 tracking-wider uppercase">
              Painel Administrativo OddsBet
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
              Motor do Jogo v3.0
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/50 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* PIN LOGIN LOCK SCREEN */
          <div className="p-8 flex flex-col items-center justify-center space-y-4 text-center">
            <Key className="w-12 h-12 text-red-500" />
            <h3 className="text-lg font-bold text-red-200">Acesso Restrito ao Operador</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Digite o PIN de administrador para acessar o Motor do Jogo, linhas de pagamento, RTP e layout (Padrão: 777 ou deixe em branco).
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3 w-full max-w-xs">
              <input
                type="password"
                placeholder="PIN Administrativo"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/60 border border-red-900/50 rounded-xl text-center text-sm text-white focus:outline-none focus:border-red-500 font-mono tracking-widest"
              />
              {pinError && (
                <div className="text-xs text-red-400 flex items-center justify-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> PIN Incorreto
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
              >
                Desbloquear Painel
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Admin Sub-Tabs */}
            <div className="flex border-b border-red-900/40 bg-black/50 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'border-red-500 text-red-400 bg-red-950/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 text-red-400" />
                <span>Métricas & RTP</span>
              </button>

              <button
                onClick={() => setActiveTab('engine')}
                className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'engine'
                    ? 'border-amber-500 text-amber-300 bg-amber-950/40 shadow-inner'
                    : 'border-transparent text-amber-400/80 hover:text-amber-200'
                }`}
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>⚙️ Motor do Jogo</span>
              </button>

              <button
                onClick={() => setActiveTab('layout')}
                className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'layout'
                    ? 'border-red-500 text-red-400 bg-red-950/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Layout & Fundo</span>
              </button>

              <button
                onClick={() => setActiveTab('symbols')}
                className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'symbols'
                    ? 'border-red-500 text-red-400 bg-red-950/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-red-400" />
                <span>Símbolos</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              
              {/* TAB 1: METRICS & RTP */}
              {activeTab === 'metrics' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Giros Totais</div>
                      <div className="text-base font-black text-white font-mono mt-0.5">{adminConfig.totalSpins}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Total Apostado</div>
                      <div className="text-base font-black text-amber-400 font-mono mt-0.5">R$ {adminConfig.totalWagered.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Total Pago</div>
                      <div className="text-base font-black text-emerald-400 font-mono mt-0.5">R$ {adminConfig.totalPayout.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Lucro da Casa</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${houseProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {houseProfit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* RTP & VOLATILITY CONTROLS */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-red-900/40 space-y-4">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-red-400" />
                      Configuração de Retorno (RTP) & Volatilidade
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-semibold">Alvo de RTP Teórico:</span>
                        <span className="text-yellow-400 font-bold">{adminConfig.targetRtp}%</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="99"
                        step="0.5"
                        value={adminConfig.targetRtp}
                        onChange={(e) => onUpdateAdminConfig({ targetRtp: parseFloat(e.target.value) })}
                        className="w-full accent-red-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs text-gray-300 font-semibold">Perfil de Volatilidade:</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((vol) => (
                          <button
                            key={vol}
                            onClick={() => onUpdateAdminConfig({ volatility: vol })}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition capitalize cursor-pointer ${
                              adminConfig.volatility === vol
                                ? 'bg-red-900/80 border-red-500 text-white shadow-md'
                                : 'bg-black/60 border-white/10 text-gray-400 hover:border-red-500/50'
                            }`}
                          >
                            {vol === 'low' ? 'Baixa' : vol === 'medium' ? 'Média' : 'Alta'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FORCED OUTCOME */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-red-900/40 space-y-3">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-400" />
                      Forçar Resultado Próximo Giro (Modo Demonstração)
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'RNG Normal' },
                        { id: 'normal_win', label: 'Forçar Vitória' },
                        { id: 'big_win', label: 'Forçar Big Win' },
                        { id: 'loss', label: 'Forçar Derrota' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onUpdateAdminConfig({ forcedOutcome: item.id as any })}
                          className={`py-2 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            adminConfig.forcedOutcome === item.id
                              ? 'bg-amber-600 border-amber-300 text-black font-extrabold shadow-md'
                              : 'bg-black/60 border-white/10 text-gray-300 hover:border-amber-500/50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PLAYER BALANCE */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-red-900/40 space-y-3">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-red-400" />
                      Gestão de Saldo do Jogador
                    </span>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-300">
                        Saldo Atual: <span className="text-yellow-400 font-bold text-sm">R$ {gameState.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateBalance(gameState.balance + 1000)}
                          className="px-3 py-1.5 bg-green-900/60 border border-green-500/50 rounded-lg text-xs font-bold text-green-300 hover:bg-green-800 transition cursor-pointer"
                        >
                          + R$ 1.000
                        </button>
                        <button
                          onClick={() => onUpdateBalance(gameState.balance + 10000)}
                          className="px-3 py-1.5 bg-green-900/60 border border-green-500/50 rounded-lg text-xs font-bold text-green-300 hover:bg-green-800 transition cursor-pointer"
                        >
                          + R$ 10.000
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="Definir Saldo exato"
                        value={customBalanceInput}
                        onChange={(e) => setCustomBalanceInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(customBalanceInput);
                          if (!isNaN(val) && val >= 0) {
                            onUpdateBalance(val);
                            setCustomBalanceInput('');
                          }
                        }}
                        className="px-4 py-1.5 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-bold transition text-white cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MOTOR DO JOGO (ENGINE) */}
              {activeTab === 'engine' && (
                <div className="space-y-4">
                  {/* Engine Sub-Navigation Pills */}
                  <div className="flex gap-2 p-1 bg-black/60 rounded-xl border border-amber-500/30 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setEngineSubTab('grid')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'grid'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>1. Grade & Dimensões</span>
                    </button>

                    <button
                      onClick={() => setEngineSubTab('paylines')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'paylines'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>2. Linhas de Pagamento</span>
                    </button>

                    <button
                      onClick={() => setEngineSubTab('bonus')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'bonus'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>3. Bônus do Jogo</span>
                    </button>

                    <button
                      onClick={() => setEngineSubTab('rules')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'rules'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>4. Regras & Payouts</span>
                    </button>
                  </div>

                  {/* SUB-TAB 1: GRID & DIMENSIONS */}
                  {engineSubTab === 'grid' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          <LayoutGrid className="w-4 h-4 text-amber-400" />
                          Configuração de Colunas (Slots) e Linhas
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Ajuste o número de rolos/colunas e linhas horizontais exibidos na matriz principal do slot.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Reels / Columns Count */}
                        <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Quantidade de Colunas (Reels):</span>
                            <span className="text-amber-400 font-mono font-black text-sm">{numReels} Reels</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="6"
                            step="1"
                            value={numReels}
                            onChange={(e) => {
                              const newNum = parseInt(e.target.value);
                              // Resize paylines positions arrays if needed
                              const updatedPaylines = paylines.map(p => {
                                let newPos = [...p.positions];
                                if (newPos.length < newNum) {
                                  while (newPos.length < newNum) newPos.push(Math.floor(numRows / 2));
                                } else if (newPos.length > newNum) {
                                  newPos = newPos.slice(0, newNum);
                                }
                                return { ...p, positions: newPos };
                              });
                              onUpdateAdminConfig({ numReels: newNum, paylines: updatedPaylines });
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="text-[10px] text-gray-400 flex justify-between">
                            <span>3 Reels (Clássico)</span>
                            <span>5 Reels (Padrão)</span>
                            <span>6 Reels (Megaways)</span>
                          </div>
                        </div>

                        {/* Rows Count */}
                        <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Quantidade de Linhas (Rows):</span>
                            <span className="text-amber-400 font-mono font-black text-sm">{numRows} Linhas</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="5"
                            step="1"
                            value={numRows}
                            onChange={(e) => {
                              const newRows = parseInt(e.target.value);
                              // Clamp existing paylines positions to new row bounds
                              const updatedPaylines = paylines.map(p => ({
                                ...p,
                                positions: p.positions.map(pos => Math.min(pos, newRows - 1))
                              }));
                              onUpdateAdminConfig({ numRows: newRows, paylines: updatedPaylines });
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="text-[10px] text-gray-400 flex justify-between">
                            <span>3 Linhas</span>
                            <span>4 Linhas</span>
                            <span>5 Linhas</span>
                          </div>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-gray-300 block mb-2">Presets Rápidos do Motor:</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => onUpdateAdminConfig({ numReels: 3, numRows: 3 })}
                            className="py-2 px-3 bg-black/60 border border-amber-500/30 hover:border-amber-400 rounded-lg text-xs font-bold text-amber-300 transition cursor-pointer"
                          >
                            3x3 Clássico
                          </button>
                          <button
                            onClick={() => onUpdateAdminConfig({ numReels: 5, numRows: 3 })}
                            className="py-2 px-3 bg-amber-950/60 border border-amber-500 text-amber-200 font-black rounded-lg text-xs transition cursor-pointer shadow"
                          >
                            5x3 Padrão (Favorito)
                          </button>
                          <button
                            onClick={() => onUpdateAdminConfig({ numReels: 6, numRows: 4 })}
                            className="py-2 px-3 bg-black/60 border border-amber-500/30 hover:border-amber-400 rounded-lg text-xs font-bold text-amber-300 transition cursor-pointer"
                          >
                            6x4 Expandido
                          </button>
                        </div>
                      </div>

                      {/* Visual Matrix Preview */}
                      <div className="pt-3 border-t border-white/10">
                        <span className="text-[11px] font-bold text-gray-300 block mb-2">
                          Visualização da Grade do Jogo ({numReels} x {numRows}):
                        </span>
                        <div className="p-3 bg-black/70 rounded-xl border border-amber-500/30 flex justify-center">
                          <div 
                            style={{ 
                              gridTemplateColumns: `repeat(${numReels}, minmax(0, 1fr))`,
                            }}
                            className="grid gap-2 w-full max-w-md"
                          >
                            {Array.from({ length: numReels }).map((_, colIdx) => (
                              <div key={colIdx} className="space-y-1.5 flex flex-col items-center">
                                <span className="text-[9px] text-amber-400 font-mono font-bold">R{colIdx + 1}</span>
                                {Array.from({ length: numRows }).map((_, rowIdx) => (
                                  <div 
                                    key={rowIdx}
                                    className="w-full h-10 rounded-lg bg-gradient-to-b from-[#2a1a00] to-black border border-amber-500/40 flex items-center justify-center text-[10px] font-mono text-amber-200/60 shadow-inner"
                                  >
                                    [{colIdx},{rowIdx}]
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 2: PAYLINES & CONNECTION MATRIX */}
                  {engineSubTab === 'paylines' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-amber-400" />
                            Gestão de Linhas de Pagamento & Payouts
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Crie, remova e conecte o caminho das posições para cada linha. Defina quanto cada linha paga.
                          </p>
                        </div>

                        <button
                          onClick={handleAddPayline}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Nova Linha</span>
                        </button>
                      </div>

                      {/* Payline Selector Pills */}
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {paylines.map((line) => (
                          <button
                            key={line.id}
                            onClick={() => setSelectedPaylineId(line.id)}
                            style={{ borderColor: line.color }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border flex items-center gap-1.5 transition cursor-pointer ${
                              selectedPaylineId === line.id || (!selectedPaylineId && paylines[0]?.id === line.id)
                                ? 'bg-amber-500/20 text-white shadow-md'
                                : 'bg-black/60 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                            <span>{line.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono">({line.payoutMultiplier}x)</span>
                          </button>
                        ))}
                      </div>

                      {/* Selected Payline Configurator */}
                      {(() => {
                        const activePayline = paylines.find(p => p.id === selectedPaylineId) || paylines[0];
                        if (!activePayline) {
                          return (
                            <div className="text-center py-6 text-gray-400 text-xs">
                              Nenhuma linha cadastrada. Clique em "Nova Linha" para criar a primeira.
                            </div>
                          );
                        }

                        return (
                          <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={activePayline.active}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { active: e.target.checked })}
                                    className="w-4 h-4 rounded accent-amber-500"
                                  />
                                  <span className="text-xs font-bold text-gray-200">Ativa</span>
                                </label>

                                <input
                                  type="text"
                                  value={activePayline.name}
                                  onChange={(e) => handleUpdatePayline(activePayline.id, { name: e.target.value })}
                                  className="px-2 py-1 bg-black/80 border border-white/20 rounded text-xs font-bold text-white focus:outline-none focus:border-amber-400 flex-1 sm:w-48"
                                />
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-gray-300 font-bold">Multiplicador:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={activePayline.payoutMultiplier}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { payoutMultiplier: Math.max(1, parseFloat(e.target.value) || 1) })}
                                    className="w-16 px-2 py-1 bg-black/80 border border-amber-500/50 rounded text-xs font-mono font-bold text-amber-300 text-center"
                                  />
                                  <span className="text-xs text-amber-400 font-bold">x</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                                  <span className="text-[11px] text-gray-300 font-bold">Cor:</span>
                                  <input
                                    type="color"
                                    value={activePayline.color || '#f59e0b'}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { color: e.target.value })}
                                    className="w-6 h-6 rounded cursor-pointer border border-gray-600 bg-transparent"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-lg border border-white/10">
                                  <span className="text-[11px] text-gray-300 font-bold">Espessura:</span>
                                  <input
                                    type="range"
                                    min="2"
                                    max="30"
                                    value={activePayline.strokeWidth || 10}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { strokeWidth: parseInt(e.target.value) })}
                                    className="w-20 accent-amber-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-mono font-bold text-amber-300 w-8">{activePayline.strokeWidth || 10}px</span>
                                </div>

                                <button
                                  onClick={() => handleDeletePayline(activePayline.id)}
                                  className="p-1.5 bg-red-950/80 border border-red-500/40 hover:bg-red-900 text-red-300 rounded-lg transition cursor-pointer"
                                  title="Remover Linha"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Interactive Matrix Path Connector */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5" />
                                Conexão de Posições (Clique na célula para definir o caminho da linha):
                              </span>

                              <div className="p-3 bg-black/80 rounded-xl border border-amber-500/20 relative overflow-hidden">
                                <div 
                                  style={{ gridTemplateColumns: `repeat(${numReels}, minmax(0, 1fr))` }}
                                  className="grid gap-2 relative z-10"
                                >
                                  {Array.from({ length: numReels }).map((_, colIdx) => {
                                    const selectedRow = activePayline.positions[colIdx] ?? 0;

                                    return (
                                      <div key={colIdx} className="space-y-1.5 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-amber-400 font-mono">Coluna {colIdx + 1}</span>
                                        {Array.from({ length: numRows }).map((_, rowIdx) => {
                                          const isSelected = selectedRow === rowIdx;

                                          return (
                                            <button
                                              key={rowIdx}
                                              type="button"
                                              onClick={() => handleSetPaylinePosition(activePayline.id, colIdx, rowIdx)}
                                              style={{
                                                backgroundColor: isSelected ? activePayline.color : 'rgba(0,0,0,0.6)',
                                                borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                              }}
                                              className={`w-full h-11 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                                                isSelected
                                                  ? 'text-white font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                                                  : 'text-gray-400 hover:border-amber-400/50 hover:text-white'
                                              }`}
                                            >
                                              <span className="text-[10px] font-mono">Linha {rowIdx + 1}</span>
                                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SUB-TAB 3: BONUS CONFIGURATION */}
                  {engineSubTab === 'bonus' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-amber-400" />
                          Criação & Regras do Bônus do Jogo
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Configure o símbolo acionador (Scatter), número de Rodadas Grátis e multiplicadores do modo bônus.
                        </p>
                      </div>

                      {/* Enable / Disable Bonus Toggle */}
                      <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">Ativar Modo Bônus no Slot:</span>
                          <span className="text-[10px] text-gray-400 block">Permite que combinações de Scatter liberem o modo especial</span>
                        </div>
                        <button
                          onClick={() => handleUpdateBonusConfig({ enabled: !bonusConfig.enabled })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                            bonusConfig.enabled
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                              : 'bg-red-950 border-red-600 text-red-300'
                          }`}
                        >
                          {bonusConfig.enabled ? 'SISTEMA ATIVO' : 'DESATIVADO'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Scatter Symbol Selector */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <label className="text-xs font-bold text-amber-300 block">
                            Símbolo Gatilho do Bônus (Scatter):
                          </label>
                          <select
                            value={bonusConfig.scatterSymbol}
                            onChange={(e) => handleUpdateBonusConfig({ scatterSymbol: e.target.value as SymbolType })}
                            className="w-full px-3 py-2 bg-black/80 border border-amber-500/50 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                          >
                            {SYMBOL_NAMES.map(s => (
                              <option key={s.type} value={s.type}>{s.label} ({s.type})</option>
                            ))}
                          </select>
                        </div>

                        {/* Trigger Scatter Count */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <label className="text-xs font-bold text-amber-300 block">
                            Mínimo de Símbolos para Ativar Bônus:
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[2, 3, 4, 5].map((cnt) => (
                              <button
                                key={cnt}
                                onClick={() => handleUpdateBonusConfig({ triggerScatterCount: cnt })}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                  bonusConfig.triggerScatterCount === cnt
                                    ? 'bg-amber-600 border-amber-300 text-black font-extrabold shadow'
                                    : 'bg-black/60 border-white/10 text-gray-300 hover:border-amber-400/50'
                                }`}
                              >
                                {cnt} Scatters
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Free Spins Count */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Qtd. de Rodadas Grátis (Free Spins):</span>
                            <span className="text-amber-400 font-bold">{bonusConfig.freeSpinsCount} Giros</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="5"
                            value={bonusConfig.freeSpinsCount}
                            onChange={(e) => handleUpdateBonusConfig({ freeSpinsCount: parseInt(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        {/* Bonus Multiplier */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Multiplicador do Bônus:</span>
                            <span className="text-amber-400 font-bold">{bonusConfig.bonusMultiplier}x</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            step="1"
                            value={bonusConfig.bonusMultiplier}
                            onChange={(e) => handleUpdateBonusConfig({ bonusMultiplier: parseInt(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Probability Slider */}
                      <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-200 font-bold">Probabilidade Teórica do Bônus Ocorrer (% por giro):</span>
                          <span className="text-amber-400 font-mono font-bold text-sm">{bonusConfig.bonusProbabilityPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={bonusConfig.bonusProbabilityPct}
                          onChange={(e) => handleUpdateBonusConfig({ bonusProbabilityPct: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: RULES & SYMBOL PAYOUTS */}
                  {engineSubTab === 'rules' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-amber-400" />
                          Regras do Jogo e Tabela de Multiplicadores
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Edite o texto de regras oficiais exibido no menu do jogador e quanto paga cada símbolo individual.
                        </p>
                      </div>

                      {/* Editable Game Rules */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-200 block">
                          Texto das Regras do Jogo (Exibido aos Jogadores):
                        </label>
                        <textarea
                          rows={5}
                          value={adminConfig.gameRulesText || ''}
                          onChange={(e) => onUpdateAdminConfig({ gameRulesText: e.target.value })}
                          className="w-full p-3 bg-black/80 border border-white/20 rounded-xl text-xs text-gray-200 font-sans focus:outline-none focus:border-amber-400 leading-relaxed"
                          placeholder="Digite as regras e instruções do jogo..."
                        />
                      </div>

                      {/* Symbol Payouts Multipliers Table */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-amber-300 block">
                          Multiplicador Base de Pagamento por Símbolo (x Aposta por linha):
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {SYMBOL_NAMES.map(({ type, label }) => {
                            const currentPayout = adminConfig.symbolPayouts?.[type] ?? 10;

                            return (
                              <div key={type} className="p-2.5 bg-black/60 border border-white/10 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0">
                                    <SlotSymbol type={type} customImage={adminConfig.customSymbols?.[type]} symbolConfig={adminConfig.customSymbolConfigs?.[type]} />
                                  </div>
                                  <span className="text-xs font-bold text-white">{label}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={currentPayout}
                                    onChange={(e) => handleUpdateSymbolPayout(type, parseFloat(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 bg-black/80 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 text-center"
                                  />
                                  <span className="text-xs text-amber-400 font-bold">x</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: LAYOUT & BACKGROUND CUSTOMIZATION */}
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  {/* VISUAL DRAG & DROP CANVAS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Move className="w-4 h-4 text-red-400" />
                        Editor Visual do Layout (Arraste Direto na Tela)
                      </h3>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (testSpinning) return;
                            setTestSpinning(true);
                            setTimeout(() => setTestSpinning(false), 1200);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow ${
                            testSpinning 
                              ? 'bg-amber-500 text-black animate-pulse' 
                              : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>{testSpinning ? 'Girando...' : 'Testar Rolagem'}</span>
                        </button>

                        <button
                          onClick={handleResetLayout}
                          className="px-2.5 py-1.5 bg-black/60 border border-red-800/40 hover:bg-red-950/60 rounded-lg text-xs font-bold text-gray-300 flex items-center gap-1 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400">
                      Clique e arraste diretamente no quadro abaixo para mover a imagem/vídeo de fundo, a moldura dos slots, as colunas individuais, o saldo, aposta e botão girar.
                    </p>

                    {/* Canvas Stage */}
                    <div
                      ref={previewCanvasRef}
                      onMouseDown={handleBgMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="relative w-full aspect-video rounded-2xl border-2 border-red-600/50 bg-black overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                    >
                      {/* Live Background Media (Photo or Video) */}
                      <BackgroundMedia
                        src={adminConfig.bgImage}
                        posX={adminConfig.bgPosX}
                        posY={adminConfig.bgPosY}
                        zoom={adminConfig.bgZoom}
                      />

                      {/* Canvas Grid Overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                      {/* Interactive Draggable Balance Widget */}
                      <div
                        onMouseDown={handleBalanceMouseDown}
                        style={{
                          top: `${adminConfig.balanceTop ?? 3}%`,
                          left: `${adminConfig.balanceLeft ?? 3}%`,
                          transform: `scale(${(adminConfig.balanceScale ?? 100) / 100})`,
                          transformOrigin: 'top left',
                          backgroundColor: adminConfig.balanceBgColor || 'rgba(0,0,0,0.8)',
                          borderColor: adminConfig.balanceBorderColor || 'rgba(212,175,55,0.6)',
                        }}
                        className="absolute z-30 cursor-move backdrop-blur-md px-2.5 py-1 rounded-xl border-2 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform"
                      >
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-400 uppercase font-bold">Saldo (Arraste)</span>
                          <span 
                            style={{ color: adminConfig.balanceTextColor || '#ffffff' }}
                            className="text-xs font-black whitespace-nowrap"
                          >
                            R$ {gameState.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Draggable Bet Controller Widget */}
                      <div
                        onMouseDown={handleBetMouseDown}
                        style={{
                          top: `${adminConfig.betTop ?? 3}%`,
                          left: `${adminConfig.betLeft ?? 65}%`,
                          transform: `scale(${(adminConfig.betScale ?? 100) / 100})`,
                          transformOrigin: 'top left',
                          backgroundColor: adminConfig.betBgColor || 'rgba(0,0,0,0.8)',
                          borderColor: adminConfig.betBorderColor || 'rgba(139,105,20,0.6)',
                        }}
                        className="absolute z-30 cursor-move backdrop-blur-md px-2 py-1 rounded-xl border-2 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 transition-transform"
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-white">
                            <Minus className="w-2.5 h-2.5" />
                          </div>
                          <div className="flex flex-col items-center px-1">
                            <span className="text-[8px] text-amber-400 uppercase font-black tracking-wider">Aposta (Arraste)</span>
                            <span 
                              style={{ color: adminConfig.betTextColor || '#fde073' }}
                              className="text-xs font-black whitespace-nowrap"
                            >
                              R$ {gameState.bet.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-white">
                            <Plus className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>

                      {/* Interactive Draggable & Resizable Slot Box Frame */}
                      <div
                        onMouseDown={handleSlotMouseDown}
                        style={{
                          top: `${adminConfig.slotTop ?? 32}%`,
                          left: `${adminConfig.slotLeft ?? 30}%`,
                          width: `${adminConfig.slotWidth ?? 40}%`,
                          height: `${adminConfig.slotHeight ?? 40}%`,
                        }}
                        className="absolute border-2 border-dashed border-amber-400/80 bg-black/20 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center cursor-move shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:border-yellow-200 transition-colors z-20 group"
                      >
                        <div className="absolute -top-6 bg-amber-400 text-black px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow pointer-events-none z-30 whitespace-nowrap">
                          Área dos Slots (Mover/Redimensionar)
                        </div>

                        {/* Individual Reel Column Drag Badges */}
                        <div className="absolute top-1 left-0 right-0 z-40 flex justify-around px-1 pointer-events-auto">
                          {Array.from({ length: numReels }).map((_, rIdx) => (
                            <button
                              key={rIdx}
                              onMouseDown={(e) => handleReelMouseDown(rIdx, e)}
                              className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-yellow-300 text-black text-[9px] font-black shadow border border-black cursor-grab active:cursor-grabbing"
                              title={`Arraste o Slot R${rIdx + 1} individualmente`}
                            >
                              R{rIdx + 1}
                            </button>
                          ))}
                        </div>

                        {/* Real SlotMachine rendered inside preview */}
                        <div className="w-full h-full pointer-events-none flex items-center justify-center p-1">
                          <SlotMachine 
                            isSpinning={testSpinning} 
                            grid={[
                              ['Castle', 'Sword', 'Diamond', 'Crown', 'Lion'],
                              ['Shield', 'Queen', 'Dragon', 'King', 'Coin'],
                              ['Lion', 'Diamond', 'Castle', 'Sword', 'Crown'],
                              ['Dragon', 'Castle', 'Shield', 'Queen', 'King'],
                              ['Sword', 'Coin', 'Lion', 'Diamond', 'Crown'],
                              ['Crown', 'Dragon', 'King', 'Shield', 'Castle'],
                            ].slice(0, numReels).map(col => col.slice(0, numRows))} 
                            customSymbols={adminConfig.customSymbols}
                            customSymbolConfigs={adminConfig.customSymbolConfigs}
                            showReelBorders={adminConfig.showReelBorders}
                            showReelBg={adminConfig.showReelBg}
                            individualReelPositions={adminConfig.individualReelPositions}
                            spinStyle={adminConfig.spinStyle}
                            paylines={adminConfig.paylines}
                            numReels={numReels}
                            numRows={numRows}
                          />
                        </div>

                        {/* Bottom-Right Resize Handle */}
                        <div
                          onMouseDown={handleSlotResizeMouseDown}
                          className="absolute -bottom-2 -right-2 w-5 h-5 bg-amber-400 hover:bg-yellow-200 border border-black rounded-full cursor-se-resize shadow-lg flex items-center justify-center z-30"
                          title="Arraste para Redimensionar o Slot"
                        >
                          <div className="w-2 h-2 border-r-2 border-b-2 border-black" />
                        </div>
                      </div>

                      {/* Interactive Draggable Spin Button Widget */}
                      <div
                        onMouseDown={handleSpinMouseDown}
                        style={{
                          bottom: `${adminConfig.spinBottom ?? 4}%`,
                          left: `${adminConfig.spinLeft ?? 50}%`,
                          transform: `translateX(-50%) scale(${(adminConfig.spinScale ?? 100) / 100})`,
                        }}
                        className="absolute z-30 cursor-move group hover:scale-105 transition-transform"
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow whitespace-nowrap pointer-events-none">
                          Botão Girar (Arraste)
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 p-1 shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-yellow-200">
                          <div className="w-full h-full rounded-full bg-gradient-to-b from-red-600 to-red-950 flex flex-col items-center justify-center text-white">
                            <RefreshCw className="w-5 h-5 text-yellow-300" />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SLIDERS FOR FINE TUNING */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Panel 1: Imagem ou Vídeo de Fundo */}
                    <div className="space-y-3 bg-black/30 p-3 rounded-lg border border-white/5 sm:col-span-2">
                      <div className="text-xs font-bold text-red-300 uppercase tracking-wider border-b border-white/10 pb-1.5 flex items-center justify-between">
                        <span>1. Foto ou Vídeo de Fundo</span>
                        <label className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>Fazer Upload (Foto / Vídeo)</span>
                          <input type="file" accept="image/*,video/*" onChange={handleBgFileUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Direct URL Input for Image or Video */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Cole link de Cloudinary, YouTube, Vimeo, MP4, WebM ou foto (.jpg, .png)..."
                          value={mediaUrlInput}
                          onChange={(e) => setMediaUrlInput(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-black/80 border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (mediaUrlInput.trim()) {
                              onUpdateAdminConfig({ bgImage: mediaUrlInput.trim() });
                              setMediaUrlInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-extrabold text-black transition cursor-pointer"
                        >
                          Aplicar URL
                        </button>
                      </div>

                      {/* Presets buttons */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">Fundos Pré-configurados (Imagens / Vídeos MP4 e YouTube):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Cassino Dourado (Imagem Padrão)', url: '/background.jpg' },
                            { label: 'Vídeo YouTube Cassino Lights', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A' },
                            { label: 'Vídeo MP4 Fogo & Luzes (Google CDN)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
                            { label: 'Vídeo MP4 Oceans HD', url: 'https://vjs.zencdn.net/v/oceans.mp4' },
                          ].map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => onUpdateAdminConfig({ bgImage: preset.url })}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                                adminConfig.bgImage === preset.url
                                  ? 'bg-amber-500 text-black border-amber-300 font-black'
                                  : 'bg-black/60 border-white/10 text-gray-300 hover:border-amber-400/50'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-300">
                            <span>Posição X:</span>
                            <span className="font-mono text-yellow-300">{adminConfig.bgPosX || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={adminConfig.bgPosX || 0}
                            onChange={(e) => onUpdateAdminConfig({ bgPosX: parseInt(e.target.value) })}
                            className="w-full accent-yellow-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-300">
                            <span>Posição Y:</span>
                            <span className="font-mono text-yellow-300">{adminConfig.bgPosY || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={adminConfig.bgPosY || 0}
                            onChange={(e) => onUpdateAdminConfig({ bgPosY: parseInt(e.target.value) })}
                            className="w-full accent-yellow-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-300">
                            <span>Zoom Fundo:</span>
                            <span className="font-mono text-yellow-300">{adminConfig.bgZoom || 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="200"
                            value={adminConfig.bgZoom || 100}
                            onChange={(e) => onUpdateAdminConfig({ bgZoom: parseInt(e.target.value) })}
                            className="w-full accent-yellow-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Bloco de Saldo */}
                    <div className="space-y-3 bg-black/30 p-3 rounded-lg border border-white/5">
                      <div className="text-xs font-bold text-yellow-300 uppercase tracking-wider border-b border-white/10 pb-1.5">
                        2. Bloco de Saldo
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-300">
                          <span>Escala / Tamanho:</span>
                          <span className="font-mono text-yellow-300">{adminConfig.balanceScale ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="180"
                          value={adminConfig.balanceScale ?? 100}
                          onChange={(e) => onUpdateAdminConfig({ balanceScale: parseInt(e.target.value) })}
                          className="w-full accent-yellow-400 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block truncate">Cor Fundo</label>
                          <input 
                            type="color" 
                            value={adminConfig.balanceBgColor && adminConfig.balanceBgColor.startsWith('#') ? adminConfig.balanceBgColor : '#000000'}
                            onChange={(e) => onUpdateAdminConfig({ balanceBgColor: e.target.value })}
                            className="w-full h-7 rounded bg-transparent border border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block truncate">Cor Texto</label>
                          <input 
                            type="color" 
                            value={adminConfig.balanceTextColor && adminConfig.balanceTextColor.startsWith('#') ? adminConfig.balanceTextColor : '#ffffff'}
                            onChange={(e) => onUpdateAdminConfig({ balanceTextColor: e.target.value })}
                            className="w-full h-7 rounded bg-transparent border border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block truncate">Cor Borda</label>
                          <input 
                            type="color" 
                            value={adminConfig.balanceBorderColor && adminConfig.balanceBorderColor.startsWith('#') ? adminConfig.balanceBorderColor : '#d4af37'}
                            onChange={(e) => onUpdateAdminConfig({ balanceBorderColor: e.target.value })}
                            className="w-full h-7 rounded bg-transparent border border-gray-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Panel 3: Bloco de Aposta */}
                    <div className="space-y-3 bg-black/30 p-3 rounded-lg border border-white/5">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-white/10 pb-1.5">
                        3. Bloco de Aposta
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-300">
                          <span>Escala / Tamanho:</span>
                          <span className="font-mono text-amber-300">{adminConfig.betScale ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="180"
                          value={adminConfig.betScale ?? 100}
                          onChange={(e) => onUpdateAdminConfig({ betScale: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block truncate">Cor Fundo</label>
                          <input 
                            type="color" 
                            value={adminConfig.betBgColor && adminConfig.betBgColor.startsWith('#') ? adminConfig.betBgColor : '#000000'}
                            onChange={(e) => onUpdateAdminConfig({ betBgColor: e.target.value })}
                            className="w-full h-7 rounded bg-transparent border border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block truncate">Cor Texto</label>
                          <input 
                            type="color" 
                            value={adminConfig.betTextColor && adminConfig.betTextColor.startsWith('#') ? adminConfig.betTextColor : '#fde073'}
                            onChange={(e) => onUpdateAdminConfig({ betTextColor: e.target.value })}
                            className="w-full h-7 rounded bg-transparent border border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block truncate">Cor Borda</label>
                          <input 
                            type="color" 
                            value={adminConfig.betBorderColor && adminConfig.betBorderColor.startsWith('#') ? adminConfig.betBorderColor : '#8b6914'}
                            onChange={(e) => onUpdateAdminConfig({ betBorderColor: e.target.value })}
                            className="w-full h-7 rounded bg-transparent border border-gray-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Panel 4: Estilo dos Slots, Moldura & Animação de Rolagem */}
                    <div className="space-y-3 bg-black/30 p-3 rounded-lg border border-white/5 sm:col-span-2">
                      <div className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-white/10 pb-1.5 flex items-center justify-between">
                        <span>4. Estilo de Animação & Rolagem dos Slots</span>
                        <span className="text-[10px] text-amber-300 font-mono">3 Modos de Giro</span>
                      </div>

                      {/* 3 Slot Spin Types Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {[
                          {
                            id: 'smooth',
                            title: '1. Padrão Suave',
                            badge: 'Smooth',
                            desc: 'Movimento contínuo e fluido com parada suave em mola.',
                          },
                          {
                            id: 'turbo',
                            title: '2. Turbo Rápido',
                            badge: 'Hyper Fast',
                            desc: 'Giro em altíssima velocidade com efeito Blur e trava instantânea.',
                          },
                          {
                            id: 'cascade',
                            title: '3. Cascata em Queda',
                            badge: 'Gravity Drop',
                            desc: 'Efeito de gravidade com símbolos caindo do topo e quicando no slot.',
                          },
                        ].map((spinOpt) => {
                          const isSelected = (adminConfig.spinStyle || 'smooth') === spinOpt.id;

                          return (
                            <button
                              key={spinOpt.id}
                              type="button"
                              onClick={() => onUpdateAdminConfig({ spinStyle: spinOpt.id as any })}
                              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-amber-900/90 to-amber-950/90 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                  : 'bg-black/60 border-white/10 hover:border-amber-500/50 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-extrabold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                                  {spinOpt.title}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                  isSelected ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-400'
                                }`}>
                                  {spinOpt.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-300 leading-tight">
                                {spinOpt.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-200 hover:text-white">
                          <input 
                            type="checkbox"
                            checked={!!adminConfig.showReelBorders}
                            onChange={(e) => onUpdateAdminConfig({ showReelBorders: e.target.checked })}
                            className="w-4 h-4 rounded accent-red-500"
                          />
                          <span>Exibir Bordas nos Lots</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-200 hover:text-white">
                          <input 
                            type="checkbox"
                            checked={!!adminConfig.showReelBg}
                            onChange={(e) => onUpdateAdminConfig({ showReelBg: e.target.checked })}
                            className="w-4 h-4 rounded accent-red-500"
                          />
                          <span>Exibir Fundo Escuro nos Lots</span>
                        </label>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-300">
                            <span>Escala Botão Girar:</span>
                            <span className="font-mono text-red-300">{adminConfig.spinScale ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="180"
                            value={adminConfig.spinScale ?? 100}
                            onChange={(e) => onUpdateAdminConfig({ spinScale: parseInt(e.target.value) })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 5: Individual Reel Fine Tuning */}
                  <div className="p-3.5 bg-black/40 rounded-xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        Ajuste Fino por Coluna de Slot (Reel Individual)
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Ajuste X, Y e Escala individual de cada coluna de rolo
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Array.from({ length: numReels }).map((_, rIdx) => {
                        const pos = adminConfig.individualReelPositions?.[rIdx] || { offsetX: 0, offsetY: 0, scale: 100 };

                        return (
                          <div key={rIdx} className="p-2.5 bg-black/60 rounded-lg border border-white/10 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-amber-400">Coluna R{rIdx + 1}:</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ({pos.offsetX || 0}px, {pos.offsetY || 0}px)
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-300">
                                <span>Offset X:</span>
                                <span>{pos.offsetX || 0}px</span>
                              </div>
                              <input
                                type="range"
                                min="-60"
                                max="60"
                                value={pos.offsetX || 0}
                                onChange={(e) => handleUpdateIndividualReelPos(rIdx, { offsetX: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer h-1"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-300">
                                <span>Offset Y:</span>
                                <span>{pos.offsetY || 0}px</span>
                              </div>
                              <input
                                type="range"
                                min="-60"
                                max="60"
                                value={pos.offsetY || 0}
                                onChange={(e) => handleUpdateIndividualReelPos(rIdx, { offsetY: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer h-1"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-300">
                                <span>Escala / Zoom:</span>
                                <span>{pos.scale || 100}%</span>
                              </div>
                              <input
                                type="range"
                                min="60"
                                max="150"
                                value={pos.scale || 100}
                                onChange={(e) => handleUpdateIndividualReelPos(rIdx, { scale: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer h-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: CUSTOM SYMBOL IMAGES */}
              {activeTab === 'symbols' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-red-400" />
                        Imagens dos Lots (Símbolos Sem Margens & Posicionamento)
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Cada lot possui um tamanho padrão padronizado. Preencha sem margens ou ajuste a posição e zoom de cada imagem.
                      </p>
                    </div>

                    <button
                      onClick={() => onUpdateAdminConfig({ customSymbols: {}, customSymbolConfigs: {} })}
                      className="px-2.5 py-1.5 bg-black/60 border border-red-800/40 hover:bg-red-950/60 rounded-lg text-xs font-bold text-gray-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                      <span>Restaurar Símbolos Padrão</span>
                    </button>
                  </div>

                  {/* SYMBOLS LIST */}
                  <div className="space-y-3">
                    {SYMBOL_NAMES.map(({ type, label }) => {
                      const customImg = adminConfig.customSymbols?.[type];
                      const symConfig = adminConfig.customSymbolConfigs?.[type];

                      return (
                        <div
                          key={type}
                          className="p-3 bg-black/50 border border-red-900/30 rounded-xl hover:border-red-600/50 transition flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                        >
                          {/* Standardized Tile Box Preview (Strict 64x64px standard lot square tile) */}
                          <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-[#2a1a00] to-black border-2 border-[#8b6914] flex items-center justify-center relative shadow-inner overflow-hidden">
                            <SlotSymbol type={type} customImage={customImg} symbolConfig={symConfig} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate">{label}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                {type}
                              </span>
                            </div>

                            {/* Upload Button or Remove */}
                            <div className="flex items-center gap-2">
                              <label className="flex-1 py-1.5 px-3 bg-black/60 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition">
                                <Upload className="w-3.5 h-3.5 text-amber-400" />
                                <span>{customImg ? 'Alterar Imagem do Lot' : 'Carregar Imagem para este Lot'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSymbolFileUpload(type, e)}
                                  className="hidden"
                                />
                              </label>

                              {customImg && (
                                <button
                                  onClick={() => handleRemoveSymbol(type)}
                                  className="p-1.5 bg-red-950/60 border border-red-500/40 hover:bg-red-900 text-red-400 rounded-lg transition cursor-pointer"
                                  title="Remover Imagem Customizada"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Fine tuning per-symbol position & scale if custom image exists */}
                            {customImg && (
                              <div className="pt-2 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-1">Preenchimento:</div>
                                  <button
                                    onClick={() => handleUpdateSymbolConfig(type, { objectFit: symConfig?.objectFit === 'contain' ? 'cover' : 'contain' })}
                                    className={`w-full py-1 px-2 rounded text-[10px] font-bold border ${
                                      symConfig?.objectFit !== 'contain' 
                                        ? 'bg-amber-900/80 border-amber-500 text-amber-200' 
                                        : 'bg-black/60 border-white/10 text-gray-400'
                                    }`}
                                  >
                                    {symConfig?.objectFit === 'contain' ? 'Centralizado' : 'Sem Margens (Cover)'}
                                  </button>
                                </div>

                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">Offset X: {symConfig?.offsetX || 0}%</div>
                                  <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={symConfig?.offsetX || 0}
                                    onChange={(e) => handleUpdateSymbolConfig(type, { offsetX: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer h-1"
                                  />
                                </div>

                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">Offset Y: {symConfig?.offsetY || 0}%</div>
                                  <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={symConfig?.offsetY || 0}
                                    onChange={(e) => handleUpdateSymbolConfig(type, { offsetY: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer h-1"
                                  />
                                </div>

                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">Zoom Lot: {symConfig?.scale || 100}%</div>
                                  <input
                                    type="range"
                                    min="50"
                                    max="200"
                                    value={symConfig?.scale || 100}
                                    onChange={(e) => handleUpdateSymbolConfig(type, { scale: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer h-1"
                                  />
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};
