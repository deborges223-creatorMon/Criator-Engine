import React, { useRef, useState, useEffect } from 'react';
import { Menu, ShieldAlert, Plus, Minus, Coins, Move, Lock, Eye, EyeOff, RotateCw, Scaling, Anchor, Trophy } from 'lucide-react';
import { SlotMachine } from './SlotMachine';
import { SpinButton } from './SpinButton';
import { BackgroundMedia } from './BackgroundMedia';
import { WinCounterOverlay } from './WinCounterOverlay';
import { GameState, SymbolType, AdminConfig, AnchorType } from '../types';
import { calculateAnchorStyle } from '../utils/canvasMath';

interface GameStageProps {
  adminConfig: AdminConfig;
  gameState: GameState;
  grid: SymbolType[][];
  onSpin: () => void;
  onBetChange: (delta: number) => void;
  onOpenMenu: () => void;
  onOpenAdmin: () => void;
  onClearWin?: () => void;
  isEditing?: boolean;
  selectedElement?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onUpdateAdminConfig?: (newConfig: Partial<AdminConfig>) => void;
}

export const GameStage: React.FC<GameStageProps> = ({
  adminConfig,
  gameState,
  grid,
  onSpin,
  onBetChange,
  onOpenMenu,
  onOpenAdmin,
  onClearWin,
  isEditing = false,
  selectedElement = null,
  onSelectElement,
  onUpdateAdminConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 360, height: 640 });

  // Virtual Canvas Base Resolution (default 1080 x 1920)
  const VIRTUAL_WIDTH = adminConfig.canvasWidth || 1080;
  const VIRTUAL_HEIGHT = adminConfig.canvasHeight || 1920;

  // Measure parent container pixel dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setStageSize({ width: rect.width, height: rect.height });
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Compute global scale factor for Virtual Canvas
  const scaleX = stageSize.width / VIRTUAL_WIDTH;
  const scaleY = stageSize.height / VIRTUAL_HEIGHT;
  const canvasFit = adminConfig.canvasFit || 'contain';
  const scale = canvasFit === 'cover' 
    ? Math.max(scaleX, scaleY) 
    : Math.min(scaleX, scaleY);

  // Dragging logic inside editor mode
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; initialLeft: number; initialTop: number }>({
    x: 0,
    y: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  const handleMouseDown = (e: React.MouseEvent, elementId: string, currentLeft: number, currentTop: number) => {
    if (!isEditing || !onUpdateAdminConfig) return;
    e.stopPropagation();
    if (onSelectElement) onSelectElement(elementId);

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialLeft: currentLeft,
      initialTop: currentTop,
    };
  };

  useEffect(() => {
    if (!isDragging || !isEditing || !onUpdateAdminConfig || !selectedElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dxScreen = e.clientX - dragStartRef.current.x;
      const dyScreen = e.clientY - dragStartRef.current.y;

      // Convert screen delta to Virtual Canvas delta
      const dxVirtual = dxScreen / (scale || 1);
      const dyVirtual = dyScreen / (scale || 1);

      const dLeftPct = (dxVirtual / VIRTUAL_WIDTH) * 100;
      const dTopPct = (dyVirtual / VIRTUAL_HEIGHT) * 100;

      let newLeft = Math.round((dragStartRef.current.initialLeft + dLeftPct) * 10) / 10;
      let newTop = Math.round((dragStartRef.current.initialTop + dTopPct) * 10) / 10;

      // Snap to grid if enabled
      if (adminConfig.snapToGrid && adminConfig.gridSize) {
        const step = adminConfig.gridSize;
        newLeft = Math.round(newLeft / step) * step;
        newTop = Math.round(newTop / step) * step;
      }

      if (selectedElement === 'slot') {
        onUpdateAdminConfig({ slotLeft: newLeft, slotTop: newTop });
      } else if (selectedElement === 'spin') {
        onUpdateAdminConfig({ spinLeft: newLeft, spinTop: newTop });
      } else if (selectedElement === 'balance') {
        onUpdateAdminConfig({ balanceLeft: newLeft, balanceTop: newTop });
      } else if (selectedElement === 'bet') {
        onUpdateAdminConfig({ betLeft: newLeft, betTop: newTop });
      } else if (selectedElement === 'winBox') {
        onUpdateAdminConfig({ winBoxLeft: newLeft, winBoxTop: newTop });
      } else if (selectedElement === 'winOverlay') {
        onUpdateAdminConfig({ winOverlayLeft: newLeft, winOverlayTop: newTop });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isEditing, selectedElement, scale, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, adminConfig, onUpdateAdminConfig]);

  // Styles for individual elements on the Virtual Canvas
  const balanceStyle = calculateAnchorStyle({
    anchor: adminConfig.balanceAnchor || 'top-left',
    top: adminConfig.balanceTop ?? 3,
    left: adminConfig.balanceLeft ?? 3,
    scale: adminConfig.balanceScale ?? 100,
    rotation: adminConfig.balanceRotation || 0,
    opacity: adminConfig.balanceOpacity ?? 100,
    zIndex: adminConfig.balanceZIndex ?? 30,
  });

  const betStyle = calculateAnchorStyle({
    anchor: adminConfig.betAnchor || 'top-left',
    top: adminConfig.betTop ?? 3,
    left: adminConfig.betLeft ?? 55,
    scale: adminConfig.betScale ?? 100,
    rotation: adminConfig.betRotation || 0,
    opacity: adminConfig.betOpacity ?? 100,
    zIndex: adminConfig.betZIndex ?? 30,
  });

  const winBoxStyle = calculateAnchorStyle({
    anchor: adminConfig.winBoxAnchor || 'top-left',
    top: adminConfig.winBoxTop ?? 3,
    left: adminConfig.winBoxLeft ?? 30,
    scale: adminConfig.winBoxScale ?? 100,
    rotation: adminConfig.winBoxRotation || 0,
    opacity: adminConfig.winBoxOpacity ?? 100,
    zIndex: adminConfig.winBoxZIndex ?? 30,
  });

  const winOverlayStyle = calculateAnchorStyle({
    anchor: adminConfig.winOverlayAnchor || 'center',
    top: adminConfig.winOverlayTop ?? 20,
    left: adminConfig.winOverlayLeft ?? 50,
    scale: adminConfig.winOverlayScale ?? 100,
    rotation: adminConfig.winOverlayRotation || 0,
    opacity: adminConfig.winOverlayOpacity ?? 100,
    zIndex: adminConfig.winOverlayZIndex ?? 40,
  });

  const slotStyle = calculateAnchorStyle({
    anchor: adminConfig.slotAnchor || 'top-left',
    top: adminConfig.slotTop ?? 28,
    left: adminConfig.slotLeft ?? 5,
    width: adminConfig.slotWidth ?? 90,
    height: adminConfig.slotHeight ?? 48,
    rotation: adminConfig.slotRotation || 0,
    opacity: adminConfig.slotOpacity ?? 100,
    zIndex: adminConfig.slotZIndex ?? 10,
  });

  const spinStyle = calculateAnchorStyle({
    anchor: adminConfig.spinAnchor || 'bottom',
    top: adminConfig.spinTop !== undefined ? adminConfig.spinTop : undefined,
    bottom: adminConfig.spinTop === undefined ? (adminConfig.spinBottom ?? 4) : undefined,
    left: adminConfig.spinLeft ?? 50,
    scale: adminConfig.spinScale ?? 100,
    rotation: adminConfig.spinRotation || 0,
    opacity: adminConfig.spinOpacity ?? 100,
    zIndex: adminConfig.spinZIndex ?? 20,
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#020617] touch-none select-none"
    >
      {/* SCALED VIRTUAL CANVAS BASE CONTAINER */}
      <div
        style={{
          width: `${VIRTUAL_WIDTH}px`,
          height: `${VIRTUAL_HEIGHT}px`,
          transform: `scale(${scale || 1})`,
          transformOrigin: 'center center',
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: `-${VIRTUAL_HEIGHT / 2}px`,
          marginLeft: `-${VIRTUAL_WIDTH / 2}px`,
        }}
        className="relative overflow-hidden bg-[#050914] shadow-2xl"
        onClick={() => {
          if (isEditing && onSelectElement) onSelectElement(null);
        }}
      >
        {/* Background Media Layer */}
        <BackgroundMedia 
          src={adminConfig.bgImage}
          posX={adminConfig.bgPosX}
          posY={adminConfig.bgPosY}
          zoom={adminConfig.bgZoom}
          fit={adminConfig.bgFit}
          anchor={adminConfig.bgAnchor}
        />

        {/* Editor Grid Overlay */}
        {isEditing && adminConfig.gridEnabled && (
          <div 
            className="absolute inset-0 pointer-events-none z-50 opacity-25"
            style={{
              backgroundImage: `linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)`,
              backgroundSize: `${adminConfig.gridSize || 5}% ${adminConfig.gridSize || 5}%`,
            }}
          />
        )}

        {/* Balance Widget */}
        {adminConfig.balanceVisible !== false && (
          <div 
            style={{
              ...balanceStyle,
              backgroundColor: adminConfig.balanceBgColor || 'rgba(0, 0, 0, 0.75)',
              borderColor: adminConfig.balanceBorderColor || 'rgba(212, 175, 55, 0.5)',
              backgroundImage: adminConfig.balanceBgImage ? `url(${adminConfig.balanceBgImage})` : undefined,
              backgroundSize: adminConfig.balanceBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.balanceBgImage ? 'center' : undefined,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'balance', adminConfig.balanceLeft ?? 3, adminConfig.balanceTop ?? 3)}
            className={`flex items-center gap-3 backdrop-blur-md px-5 py-2.5 rounded-2xl border shadow-xl transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'balance' ? 'ring-4 ring-amber-400 border-amber-300' : ''
            }`}
          >
            <Coins className="w-7 h-7 text-yellow-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Saldo</span>
              <span 
                style={{ color: adminConfig.balanceTextColor || '#ffffff' }}
                className="text-2xl font-black"
              >
                R$ {gameState.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Bet Controller Widget */}
        {adminConfig.betVisible !== false && (
          <div 
            style={{
              ...betStyle,
              backgroundColor: adminConfig.betBgColor || 'rgba(0, 0, 0, 0.75)',
              borderColor: adminConfig.betBorderColor || 'rgba(139, 105, 20, 0.5)',
              backgroundImage: adminConfig.betBgImage ? `url(${adminConfig.betBgImage})` : undefined,
              backgroundSize: adminConfig.betBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.betBgImage ? 'center' : undefined,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bet', adminConfig.betLeft ?? 55, adminConfig.betTop ?? 3)}
            className={`flex items-center backdrop-blur-md px-4 py-2 rounded-2xl border gap-3 transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'bet' ? 'ring-4 ring-amber-400 border-amber-300' : ''
            }`}
          >
            <button 
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBetChange(-5);
              }}
              disabled={gameState.isSpinning}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center px-2">
              <span className="text-xs text-gray-400 uppercase font-bold">Aposta</span>
              <span 
                style={{ color: adminConfig.betTextColor || '#fde073' }}
                className="text-xl font-bold"
              >
                R$ {gameState.bet.toFixed(2)}
              </span>
            </div>
            <button 
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBetChange(5);
              }}
              disabled={gameState.isSpinning}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Persistent Win Indicator Banner Badge (Quadro de Ganho 1 - Normal Win) */}
        {((!gameState.isSpinning && gameState.win > 0 && !gameState.bigWin) || (isEditing && selectedElement === 'winBox')) && adminConfig.winBoxVisible !== false && (
          <div 
            style={{
              ...winBoxStyle,
              backgroundColor: adminConfig.winBoxBgColor || 'rgba(16, 185, 129, 0.25)',
              borderColor: adminConfig.winBoxBorderColor || 'rgba(16, 185, 129, 0.6)',
              backgroundImage: adminConfig.winBoxBgImage ? `url(${adminConfig.winBoxBgImage})` : undefined,
              backgroundSize: adminConfig.winBoxBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.winBoxBgImage ? 'center' : undefined,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'winBox', adminConfig.winBoxLeft ?? 30, adminConfig.winBoxTop ?? 3)}
            className={`flex items-center gap-3 backdrop-blur-md px-5 py-2.5 rounded-2xl border shadow-xl transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'winBox' ? 'ring-4 ring-amber-400 border-amber-300' : ''
            }`}
          >
            <Trophy className="w-7 h-7 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Ganho</span>
              <span 
                style={{ color: adminConfig.winBoxTextColor || '#34d399' }}
                className="text-2xl font-black"
              >
                R$ {(gameState.win > 0 ? gameState.win : 25.00).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Animated Big Win Counter Overlay (Quadro de Ganho 2 - Grande Ganho) */}
        {((!gameState.isSpinning && gameState.win > 0 && gameState.bigWin) || (isEditing && selectedElement === 'winOverlay')) && adminConfig.winOverlayVisible !== false && (
          <div
            style={winOverlayStyle}
            onMouseDown={(e) => handleMouseDown(e, 'winOverlay', adminConfig.winOverlayLeft ?? 50, adminConfig.winOverlayTop ?? 20)}
            className={`cursor-pointer ${
              isEditing && selectedElement === 'winOverlay' ? 'ring-4 ring-amber-400 border-amber-300 rounded-2xl p-1' : ''
            }`}
          >
            <WinCounterOverlay 
              winAmount={gameState.win > 0 ? gameState.win : 1250.00} 
              isBigWin={gameState.bigWin || (isEditing && selectedElement === 'winOverlay')} 
              onClose={() => onClearWin?.()} 
              bgColor={adminConfig.winOverlayBgColor}
              textColor={adminConfig.winOverlayTextColor}
              borderColor={adminConfig.winOverlayBorderColor}
              bgImage={adminConfig.winOverlayBgImage}
            />
          </div>
        )}

        {/* Quick Menu & Admin Trigger Buttons */}
        <div className="absolute top-6 right-6 z-40 flex items-center gap-3 pointer-events-auto">
          {/* Menu Button */}
          <button
            onClick={onOpenMenu}
            className="p-3 bg-black/80 backdrop-blur-md hover:bg-white/10 rounded-2xl border border-[#d4af37]/50 text-[#d4af37] transition cursor-pointer shadow-lg"
            title="Menu Principal"
          >
            <Menu className="w-7 h-7" />
          </button>

          {/* Admin Quick Trigger */}
          <button
            onClick={onOpenAdmin}
            className="p-3 bg-red-950/90 backdrop-blur-md hover:bg-red-900 rounded-2xl border border-red-500/60 text-red-300 transition cursor-pointer shadow-lg"
            title="Painel de Administração"
          >
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </button>
        </div>

        {/* Slot Machine Area */}
        {adminConfig.slotVisible !== false && (
          <div 
            style={{
              ...slotStyle,
              backgroundImage: adminConfig.slotBgImage ? `url(${adminConfig.slotBgImage})` : undefined,
              backgroundSize: adminConfig.slotBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.slotBgImage ? 'center' : undefined,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'slot', adminConfig.slotLeft ?? 5, adminConfig.slotTop ?? 28)}
            className={`flex items-center justify-center transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'slot' ? 'ring-4 ring-amber-400 border-amber-300 rounded-2xl' : ''
            }`}
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
        )}
        
        {/* Spin Button Area */}
        {adminConfig.spinVisible !== false && (
          <div 
            style={{
              ...spinStyle,
              backgroundImage: adminConfig.spinBgImage ? `url(${adminConfig.spinBgImage})` : undefined,
              backgroundSize: adminConfig.spinBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.spinBgImage ? 'center' : undefined,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'spin', adminConfig.spinLeft ?? 50, adminConfig.spinTop ?? 88)}
            className={`cursor-pointer ${
              isEditing && selectedElement === 'spin' ? 'ring-4 ring-amber-400 border-amber-300 rounded-full' : ''
            }`}
          >
            <SpinButton 
              onSpin={() => {
                if (!isEditing) onSpin();
              }} 
              isSpinning={gameState.isSpinning} 
            />
          </div>
        )}

        {/* Editor Selection Handles Overlay */}
        {isEditing && selectedElement && (
          <div className="absolute top-4 left-4 z-50 bg-black/90 text-amber-300 border border-amber-500/60 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-2xl">
            <Move className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              Elemento Selecionado: <strong className="text-white uppercase">{selectedElement}</strong>
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
