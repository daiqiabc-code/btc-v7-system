// ============ 市场状态 ============
export type MarketRegime = 'bull' | 'neutral' | 'bear';

export interface RegimeScore {
  score: number;        // 0-100
  regime: MarketRegime;
  longTerm: number;     // 0-40
  midTerm: number;      // 0-30
  momentum: number;     // 0-30
}

// ============ K线数据 ============
export interface Kline {
  time: number;         // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============ V7 策略信号 ============
export interface TrendFilter {
  passed: boolean;
  closeAboveEMA55: boolean;
  ema55Rising: boolean;
  ema21AboveEMA55: boolean;
}

export interface PullbackScore {
  score: number;        // 0-100
  depth: number;        // 0-30
  speed: number;        // 0-20
  volume: number;       // 0-20
  reversal: number;     // 0-30
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface EntrySignal {
  enabled: boolean;
  regimeScore: number;
  trendFilter: TrendFilter;
  pullbackScore: PullbackScore;
  aiScore: number;
}

export interface PositionSize {
  baseRisk: number;          // 2%
  actualRisk: number;        // adjusted %
  regimeFactor: number;      // 0-1
  aiFactor: number;          // 0-1
  positionValue: number;     // USD
}

export interface PyramidLevel {
  level: number;
  entryPrice: number;
  size: number;             // percentage of total
  targetPrice: number;      // +5% or +10% from entry
}

export interface ExitSignal {
  level1: { triggered: boolean; reason: string };  // 4H close < EMA55 → -50%
  level2: { triggered: boolean; reason: string };  // Daily close < EMA21 → -50%
  level3: { triggered: boolean; reason: string };  // Daily close < EMA55 → exit all
  blackSwan: boolean;                               // Single day drop > 8%
  remainingPosition: number;                        // % of original
}

export interface AIScore {
  score: number;        // 0-100
  trend: number;        // trend features
  momentum: number;     // momentum features
  volatility: number;   // volatility features
  confidence: 'high' | 'medium' | 'low';
}

// ============ 进化引擎 ============
export interface EvolutionState {
  generation: number;
  stage: 'embryonic' | 'juvenile' | 'mature' | 'expert';
  successfulTrades: number;
  totalTrades: number;
  winRate: number;
  fitness: number;
  strategies: Strategy[];
}

export interface Strategy {
  id: string;
  name: string;
  fitness: number;
  params: Record<string, number>;
  trades: number;
  wins: number;
}

// ============ 回测结果 ============
export interface BacktestTrade {
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  exitReason: string;
}

export interface BacktestResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpe: number;
  maxDrawdown: number;
  totalReturn: number;
  annualReturn: number;
  trades: BacktestTrade[];
  equityCurve: { time: number; value: number }[];
}

// ============ Binance 实时数据 ============
export interface Ticker {
  symbol: string;
  price: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume: string;
}

// ============ App 全局状态 ============
export interface AppState {
  regime: RegimeScore;
  trendFilter: TrendFilter;
  entrySignal: EntrySignal | null;
  aiScore: AIScore;
  position: PositionSize | null;
  exit: ExitSignal | null;
  pyramid: PyramidLevel[];
  evolution: EvolutionState;
  backtest: BacktestResult | null;
  currentPrice: number;
  klineData: Kline[];
  inPosition: boolean;
  entryPrice: number | null;
  tradeHistory: BacktestTrade[];
}
