export type SymbolType = 'King' | 'Queen' | 'Crown' | 'Lion' | 'Sword' | 'Shield' | 'Castle' | 'Diamond' | 'Coin' | 'Dragon';

export interface ReelState {
  symbols: SymbolType[];
  isSpinning: boolean;
  stopPosition: number;
}

export interface SymbolImageConfig {
  url: string;
  objectFit?: 'cover' | 'contain';
  offsetX?: number; // % offset (-50 to 50)
  offsetY?: number; // % offset (-50 to 50)
  scale?: number; // zoom % (50 to 200)
}

export interface Payline {
  id: string;
  name: string;
  positions: number[]; // row index for each reel (e.g. [1, 1, 1, 1, 1])
  payoutMultiplier: number; // e.g. 5.0
  color: string; // color for line rendering
  strokeWidth?: number; // line thickness in px
  active: boolean;
}

export interface BonusConfig {
  enabled: boolean;
  scatterSymbol: SymbolType;
  triggerScatterCount: number; // e.g. 3
  freeSpinsCount: number; // e.g. 10
  bonusMultiplier: number; // e.g. 3
  bonusGameType: 'free_spins' | 'wheel_of_fortune' | 'chest_pick';
  bonusProbabilityPct: number; // e.g. 5%
}

export interface ReelPosition {
  offsetX: number; // % offset X (-50 to 50)
  offsetY: number; // % offset Y (-50 to 50)
  scale: number; // scale % (50 to 150)
}

export interface AdminConfig {
  targetRtp: number;
  volatility: 'low' | 'medium' | 'high';
  forcedOutcome: 'none' | 'normal_win' | 'big_win' | 'loss';
  minBet: number;
  maxBet: number;
  totalSpins: number;
  totalWagered: number;
  totalPayout: number;
  autoWinBoost: boolean;

  // Custom Background and Layout Positioning
  bgImage: string;
  bgPosX: number; // X offset in % (-100 to 100)
  bgPosY: number; // Y offset in % (-100 to 100)
  bgZoom: number; // Zoom level (100 to 200%)

  // Slot Reel Box Frame Position over background (%)
  slotTop: number; // default 32
  slotLeft: number; // default 30
  slotWidth: number; // default 40
  slotHeight: number; // default 40

  // Spin Button Positioning (%)
  spinBottom: number; // default 4
  spinLeft: number; // default 50
  spinScale: number; // default 100 (%)

  // Balance Box Customization
  balanceTop?: number; // default 3
  balanceLeft?: number; // default 3
  balanceScale?: number; // default 100
  balanceBgColor?: string; // default "#000000b3"
  balanceTextColor?: string; // default "#ffffff"
  balanceBorderColor?: string; // default "#d4af3766"

  // Bet Box Customization
  betTop?: number; // default 3
  betLeft?: number; // default 65
  betScale?: number; // default 100
  betBgColor?: string; // default "#000000b3"
  betTextColor?: string; // default "#fde073"
  betBorderColor?: string; // default "#8b691466"

  // Reel Frame & Border options
  showReelBorders?: boolean; // default false
  showReelBg?: boolean; // default false
  spinStyle?: 'smooth' | 'turbo' | 'cascade'; // 3 types of slot rolling animation

  // Custom Symbol Images (SymbolType -> URL/DataURI)
  customSymbols: Partial<Record<SymbolType, string>>;
  customSymbolConfigs?: Partial<Record<SymbolType, SymbolImageConfig>>;

  // Motor do Jogo (Game Engine) Configuration
  numReels: number; // default 5
  numRows: number; // default 3
  paylines: Payline[];
  bonusConfig: BonusConfig;
  gameRulesText: string;
  symbolPayouts: Record<SymbolType, number>;
  individualReelPositions?: Record<number, ReelPosition>;
}

export interface SpinHistoryItem {
  id: string;
  time: string;
  bet: number;
  win: number;
  multiplier: number;
  symbols: SymbolType[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  turboMode: boolean;
  autoSpinCount: number;
  isAutoSpinning: boolean;
}

export interface GameState {
  balance: number;
  bet: number;
  win: number;
  isSpinning: boolean;
  progression: number; // 0 to 100
  bigWin: boolean;
  freeSpinsRemaining?: number;
  inBonusMode?: boolean;
}


