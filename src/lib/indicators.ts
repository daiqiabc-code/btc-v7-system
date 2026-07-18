import type { Kline } from '@/types';

/** EMA 计算 */
export function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = data[0];
  result.push(ema);
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

export function lastEMA(closes: number[], period: number): number {
  return calcEMA(closes, period).pop() ?? closes[closes.length - 1];
}

export function emaForIndex(closes: number[], period: number, index: number): number {
  const values = calcEMA(closes.slice(0, index + 1), period);
  return values[values.length - 1];
}

/** SMA 计算 */
export function calcSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      result.push(sum / period);
    }
  }
  return result;
}

/** ATR (Average True Range) */
export function calcATR(klines: Kline[], period: number): number[] {
  const tr: number[] = [];
  for (let i = 0; i < klines.length; i++) {
    if (i === 0) { tr.push(klines[i].high - klines[i].low); continue; }
    const prev = klines[i - 1];
    const high = klines[i].high;
    const low = klines[i].low;
    tr.push(Math.max(high - low, Math.abs(high - prev.close), Math.abs(low - prev.close)));
  }
  return calcSMA(tr, period);
}

export function lastATR(klines: Kline[], period: number): number {
  const atr = calcATR(klines, period);
  return atr[atr.length - 1] ?? (klines[klines.length - 1].high - klines[klines.length - 1].low);
}

/** RSI */
export function calcRSI(closes: number[], period = 14): number[] {
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  const avgGain = calcSMA(gains, period);
  const avgLoss = calcSMA(losses, period);
  const rsi: number[] = [];
  for (let i = 0; i < gains.length; i++) {
    const rs = avgLoss[i] === 0 ? 100 : avgGain[i] / avgLoss[i];
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

/** Highest value in period */
export function highest(closes: number[], period: number): number {
  const slice = closes.slice(-period);
  return Math.max(...slice);
}

/** Lowest value in period */
export function lowest(closes: number[], period: number): number {
  const slice = closes.slice(-period);
  return Math.min(...slice);
}

/** MACD */
export interface MACDResult { macd: number[]; signal: number[]; histogram: number[] }
export function calcMACD(closes: number[]): MACDResult {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signal = calcEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signal[i]);
  return { macd: macdLine, signal, histogram };
}

/** Bollinger Band Width */
export function calcBBWidth(closes: number[], period = 20): number {
  const sma = calcSMA(closes, period);
  const lastSMA = sma[sma.length - 1];
  if (isNaN(lastSMA)) return 0;
  let sumSq = 0;
  const slice = closes.slice(-period);
  for (const v of slice) sumSq += (v - lastSMA) ** 2;
  const std = Math.sqrt(sumSq / period);
  return (2 * std) / lastSMA; // normalized bandwidth
}

/** ROC */
export function calcROC(closes: number[], period = 10): number {
  if (closes.length < period + 1) return 0;
  const prev = closes[closes.length - 1 - period];
  return ((closes[closes.length - 1] - prev) / prev) * 100;
}

/** Detect candlestick reversal patterns */
export function detectReversal(kline: Kline, prev: Kline): 'hammer' | 'engulfing' | 'bullish_engulfing' | 'none' {
  const body = Math.abs(kline.close - kline.open);
  const upperShadow = kline.high - Math.max(kline.close, kline.open);
  const lowerShadow = Math.min(kline.close, kline.open) - kline.low;
  const isBullish = kline.close > kline.open;

  // Hammer: small body, long lower shadow (2x+ body), small upper shadow
  if (isBullish && lowerShadow > body * 2 && upperShadow < body * 0.5) return 'hammer';

  // Bullish Engulfing
  if (isBullish && prev.close < prev.open && kline.close > prev.open && kline.open < prev.close) {
    return 'bullish_engulfing';
  }

  return 'none';
}
