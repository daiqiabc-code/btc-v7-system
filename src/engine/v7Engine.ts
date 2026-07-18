import type {
  Kline, RegimeScore, MarketRegime, TrendFilter,
  PullbackScore, AIScore, EntrySignal, PositionSize,
  ExitSignal, PyramidLevel, BacktestTrade, BacktestResult
} from '@/types';
import {
  lastEMA, emaForIndex, lastATR, calcRSI, calcMACD,
  highest, calcBBWidth, calcROC, detectReversal
} from '@/lib/indicators';
import { clamp } from '@/lib/utils';

// ============================================================
// Layer 1: Market Regime 市场状态识别 (0-100)
// ============================================================
export function evaluateRegime(klines: Kline[]): RegimeScore {
  if (klines.length < 200) {
    return { score: 0, regime: 'neutral', longTerm: 0, midTerm: 0, momentum: 0 };
  }
  const closes = klines.map(k => k.close);
  const lastClose = closes[closes.length - 1];

  // ① 长期趋势 (40分)
  const ema200 = lastEMA(closes, 200);
  const ema200_30 = emaForIndex(closes, 200, closes.length - 1 - Math.min(30, closes.length - 1));
  let longTerm = 0;
  if (lastClose > ema200) longTerm += 20;
  if (ema200 > ema200_30) longTerm += 20;

  // ② 中期趋势 (30分)
  const ema55 = lastEMA(closes, 55);
  const ema55_20 = emaForIndex(closes, 55, closes.length - 1 - Math.min(20, closes.length - 1));
  const ema21 = lastEMA(closes, 21);
  let midTerm = 0;
  if (ema55 > ema55_20) midTerm += 15;
  if (ema21 > ema55) midTerm += 15;

  // ③ 动量状态 (30分)
  const high60 = highest(closes, 60);
  let momentum = 0;
  if (lastClose >= high60 * 0.98) momentum += 15;

  const atr = lastATR(klines, 14);
  const atrRatio = atr / lastClose;
  const prevATR = lastATR(klines.slice(0, -1), 14);
  const prevATRRatio = prevATR / (closes[closes.length - 2] || lastClose);
  if (atrRatio > prevATRRatio * 1.05) momentum += 15;

  const score = clamp(longTerm + midTerm + momentum, 0, 100);
  let regime: MarketRegime;
  if (score >= 80) regime = 'bull';
  else if (score >= 50) regime = 'neutral';
  else regime = 'bear';

  return { score, regime, longTerm, midTerm, momentum };
}

// ============================================================
// Layer 2: Daily Trend Filter 日线趋势过滤
// ============================================================
export function evaluateTrendFilter(klines: Kline[]): TrendFilter {
  if (klines.length < 60) {
    return { passed: false, closeAboveEMA55: false, ema55Rising: false, ema21AboveEMA55: false };
  }
  const closes = klines.map(k => k.close);
  const lastClose = closes[closes.length - 1];
  const ema55 = lastEMA(closes, 55);
  const ema55_10 = emaForIndex(closes, 55, closes.length - 1 - Math.min(10, closes.length - 1));
  const ema21 = lastEMA(closes, 21);

  const closeAboveEMA55 = lastClose > ema55;
  const ema55Rising = ema55 > ema55_10;
  const ema21AboveEMA55 = ema21 > ema55;
  const passed = closeAboveEMA55 && ema55Rising && ema21AboveEMA55;

  return { passed, closeAboveEMA55, ema55Rising, ema21AboveEMA55 };
}

// ============================================================
// Layer 3-4: 4H Entry Engine + Pullback Scoring
// ============================================================
export function analyze4HEntry(klines: Kline[]): { structureValid: boolean; ema21SlopeUp: boolean } {
  if (klines.length < 30) return { structureValid: false, ema21SlopeUp: false };
  const closes = klines.map(k => k.close);
  const ema21 = lastEMA(closes, 21);
  const ema55 = lastEMA(closes, 55);
  const ema21_5 = emaForIndex(closes, 21, closes.length - 1 - Math.min(5, closes.length - 1));

  const structureValid = ema21 > ema55;
  const ema21SlopeUp = ema21 > ema21_5;

  return { structureValid, ema21SlopeUp };
}

export function scorePullback(klines: Kline[]): PullbackScore {
  if (klines.length < 2) {
    return { score: 0, depth: 0, speed: 0, volume: 0, reversal: 0, quality: 'poor' };
  }
  const closes = klines.map(k => k.close);
  const lastClose = closes[closes.length - 1];
  const ema21 = lastEMA(closes, 21);
  const ema55 = lastEMA(closes, 55);

  // ① 回踩深度 (0-30)
  const priceToEMA21 = ema21 > 0 ? Math.abs(lastClose - ema21) / ema21 : 0;
  let depth = 0;
  if (priceToEMA21 < 0.005) depth = 30;
  else if (priceToEMA21 < 0.02) depth = 20;
  else if (lastClose > ema55) depth = 10;
  else depth = 0;

  // ② 下跌速度 (0-20) - 检查最近多少根K线在回调
  const lookback = Math.max(0, Math.min(20, klines.length - 1));
  let downCandles = 0;
  for (let i = Math.max(1, klines.length - lookback); i < klines.length; i++) {
    if (klines[i] && klines[i - 1] && klines[i].close < klines[i - 1].close) downCandles++;
  }
  let speed = 0;
  if (downCandles >= 3 && downCandles <= 8) speed = 20;
  else if (downCandles < 3) speed = 10;
  else speed = 0;

  // ③ 成交量 (0-20)
  const avgVol = closes.length > 20
    ? klines.slice(-20).reduce((s, k) => s + (k?.volume ?? 0), 0) / 20
    : klines.length > 0
      ? klines.reduce((s, k) => s + (k?.volume ?? 0), 0) / klines.length
      : 0;
  const recentVol = klines.length >= 5
    ? klines.slice(-5).reduce((s, k) => s + (k?.volume ?? 0), 0) / 5
    : 0;
  // Pullback should have decreasing volume
  const volumeDowntrend = recentVol < avgVol * 0.9;
  // Last candle should have increasing volume if bullish
  const lastVol = klines[klines.length - 1]?.volume ?? 0;
  const prevVol = klines[klines.length - 2]?.volume ?? 0;
  const volume = (volumeDowntrend && lastVol > prevVol) ? 20 : volumeDowntrend ? 15 : 0;

  // ④ K线反转 (0-30)
  const last = klines[klines.length - 1];
  const prev = klines[klines.length - 2];
  const reversal = detectReversal(last, prev);
  let reversalScore = 0;
  if (reversal === 'hammer' || reversal === 'bullish_engulfing') reversalScore = 30;
  else if (last.close > last.open && last.close > prev.close) reversalScore = 15;
  else reversalScore = 0;

  const score = clamp(depth + speed + volume + reversalScore, 0, 100);
  let quality: PullbackScore['quality'] = 'poor';
  if (score >= 80) quality = 'excellent';
  else if (score >= 70) quality = 'good';
  else if (score >= 50) quality = 'fair';

  return { score, depth, speed, volume, reversal: reversalScore, quality };
}

// ============================================================
// Layer 5: AI Trend Score (简化版前端实现)
// ============================================================
export function computeAIScore(klines: Kline[]): AIScore {
  if (klines.length < 60) {
    return { score: 0, trend: 0, momentum: 0, volatility: 0, confidence: 'low' };
  }
  const closes = klines.map(k => k.close);
  const lastClose = closes[closes.length - 1];

  // 趋势特征 (trend)
  const ema21Slope = (lastEMA(closes, 21) - emaForIndex(closes, 21, closes.length - 5)) / lastClose * 100;
  const ema55Slope = (lastEMA(closes, 55) - emaForIndex(closes, 55, closes.length - 5)) / lastClose * 100;
  const ema200Dist = (lastClose - lastEMA(closes, 200)) / lastEMA(closes, 200) * 100;
  let trendScore = 0;
  if (ema21Slope > 0) trendScore += 30;
  else if (ema21Slope > -0.1) trendScore += 15;
  if (ema55Slope > 0) trendScore += 20;
  else if (ema55Slope > -0.1) trendScore += 10;
  if (ema200Dist > 0) trendScore += 30;
  else if (ema200Dist > -10) trendScore += 15;
  trendScore = clamp(trendScore, 0, 80);

  // 动量特征 (momentum)
  const rsiArr = calcRSI(closes);
  const rsi = rsiArr[rsiArr.length - 1] ?? 50;
  const macd = calcMACD(closes);
  const macdHist = macd.histogram[macd.histogram.length - 1] ?? 0;
  const roc = calcROC(closes);
  let momentumScore = 0;
  if (rsi > 50 && rsi < 75) momentumScore += 25;
  else if (rsi > 40) momentumScore += 10;
  if (macdHist > 0) momentumScore += 15;
  if (roc > 0) momentumScore += 15;
  momentumScore = clamp(momentumScore, 0, 55);

  // 波动特征 (volatility)
  const bbw = calcBBWidth(closes);
  let volScore = 0;
  if (bbw > 0.05 && bbw < 0.2) volScore += 15;  // moderate volatility
  else volScore += 5;

  const totalScore = clamp(trendScore + momentumScore + volScore, 0, 100);
  const confidence: AIScore['confidence'] = totalScore >= 80 ? 'high' : totalScore >= 60 ? 'medium' : 'low';

  return { score: Math.round(totalScore), trend: Math.round(trendScore), momentum: Math.round(momentumScore), volatility: Math.round(volScore), confidence };
}

// ============================================================
// Layer 6: Dynamic Position Sizing + Pyramiding
// ============================================================
export function computePositionSize(regime: RegimeScore, ai: AIScore, accountSize: number): PositionSize {
  const baseRisk = 0.02;
  const regimeFactor = regime.score / 100;
  const aiFactor = ai.score / 100;
  const actualRisk = baseRisk * regimeFactor * aiFactor;
  const positionValue = accountSize * actualRisk;

  return { baseRisk, actualRisk: Math.round(actualRisk * 10000) / 100, regimeFactor, aiFactor, positionValue };
}

export function computePyramidLevels(entryPrice: number): PyramidLevel[] {
  return [
    { level: 1, entryPrice, size: 0.4, targetPrice: entryPrice * 1.05 },
    { level: 2, entryPrice: entryPrice * 1.05, size: 0.3, targetPrice: entryPrice * 1.10 },
    { level: 3, entryPrice: entryPrice * 1.10, size: 0.3, targetPrice: entryPrice * 1.15 },
  ];
}

// ============================================================
// Layer 7: Exit System (三级退出)
// ============================================================
export function evaluateExit(klines: Kline[], entryPrice: number, inPosition: boolean): ExitSignal {
  if (klines.length < 60) {
    return { level1: { triggered: false, reason: '数据不足' }, level2: { triggered: false, reason: '' }, level3: { triggered: false, reason: '' }, blackSwan: false, remainingPosition: 100 };
  }
  const closes = klines.map(k => k.close);
  const lastClose = closes[closes.length - 1];
  const ema55_4h = lastEMA(closes, 55);
  const ema21_daily = lastEMA(closes, 21);
  const ema55_daily = lastEMA(closes, 55);

  // Daily price change
  const dailyChange = klines.length >= 2
    ? (closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]
    : 0;

  const blackSwan = dailyChange < -0.08;

  let remaining = 1;
  const level1 = { triggered: lastClose < ema55_4h, reason: '4H破EMA55' };
  if (level1.triggered) remaining *= 0.5;
  const level2 = { triggered: lastClose < ema21_daily, reason: '日线破EMA21' };
  if (level2.triggered) remaining *= 0.5;
  const level3 = { triggered: lastClose < ema55_daily, reason: '日线破EMA55' };
  if (level3.triggered) remaining = 0;
  if (blackSwan) remaining *= 0.5;

  return { level1, level2, level3, blackSwan, remainingPosition: remaining * 100 };
}

// ============================================================
// V7 Full Entry Check
// ============================================================
export function evaluateEntry(klines: Kline[]): EntrySignal | null {
  if (klines.length < 250) return null;
  if (klines.length < 250) return null;

  const regime = evaluateRegime(klines);
  const trendFilter = evaluateTrendFilter(klines);
  const aiScore = computeAIScore(klines);
  const entry4h = analyze4HEntry(klines);
  const pullbackScore = scorePullback(klines);

  const enabled =
    regime.regime === 'bull' &&
    regime.score >= 80 &&
    trendFilter.passed &&
    entry4h.structureValid &&
    entry4h.ema21SlopeUp &&
    pullbackScore.score >= 70 &&
    aiScore.score >= 70;

  return { enabled, regimeScore: regime.score, trendFilter, pullbackScore, aiScore: aiScore.score };
}

// ============================================================
// Simple Backtest
// ============================================================
export function runBacktest(klines: Kline[], accountSize = 100000): BacktestResult {
  const trades: BacktestTrade[] = [];
  const equityCurve: { time: number; value: number }[] = [];
  let equity = accountSize;
  let inPos = false;
  let entryPrice = 0;
  let entryTime = 0;
  let entrySize = 0;

  // Walk through klines, evaluate entry at each step
  for (let i = 250; i < klines.length; i++) {
    const slice = klines.slice(0, i + 1);
    const signal = evaluateEntry(slice);

    if (!inPos && signal?.enabled) {
      entryPrice = klines[i].close;
      entryTime = klines[i].time;
      const regime = evaluateRegime(slice);
      const ai = computeAIScore(slice);
      const pos = computePositionSize(regime, ai, equity);
      entrySize = pos.positionValue;
      inPos = true;
    }

    // Exit check
    if (inPos) {
      const exit = evaluateExit(slice, entryPrice, true);
      if (exit.level3.triggered || exit.blackSwan) {
        const exitPrice = klines[i].close;
        const pnl = (exitPrice - entryPrice) / entryPrice * entrySize;
        const pnlPercent = (exitPrice - entryPrice) / entryPrice * 100;
        equity += pnl;
        let reason = exit.level3.triggered ? '日线破EMA55' : '';
        if (exit.blackSwan) reason += '黑天鹅';
        trades.push({ entryTime, entryPrice, exitTime: klines[i].time, exitPrice, size: entrySize, pnl, pnlPercent, exitReason: reason });
        equityCurve.push({ time: klines[i].time, value: equity });
        inPos = false;
      }
    }

    if (i % 10 === 0) equityCurve.push({ time: klines[i].time, value: equity });
  }

  const totalTrades = trades.length;
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? wins / totalTrades : 0;
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  // Simple Sharpe (annualized)
  const returns = trades.map(t => t.pnlPercent);
  const avgReturn = returns.reduce((s, r) => s + r, 0) / (returns.length || 1);
  const stdReturn = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length || 1));
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  const maxDrawdown = totalTrades > 0
    ? Math.min(...trades.filter(t => t.pnl < 0).map(t => t.pnlPercent)) * -1
    : 0;

  const totalReturn = ((equity - accountSize) / accountSize) * 100;
  const annualReturn = totalReturn; // simplified

  return { totalTrades, winRate, profitFactor, sharpe: Math.min(sharpe, 10), maxDrawdown, totalReturn, annualReturn, trades, equityCurve };
}
