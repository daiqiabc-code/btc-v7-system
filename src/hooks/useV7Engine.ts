import { useState, useEffect, useCallback, useRef } from 'react';
import type { Kline, AppState, BacktestResult } from '@/types';
import { fetchKlines, fetchTicker, connectWebSocket } from '@/services/binance';
import { evaluateRegime, evaluateTrendFilter, analyze4HEntry, scorePullback, computeAIScore, computePositionSize, computePyramidLevels, evaluateExit, evaluateEntry, runBacktest } from '@/engine/v7Engine';
import { loadEvolution, saveEvolution, recordTrade } from '@/engine/evolution';

const ACCOUNT_SIZE = 100000;

export function useV7Engine() {
  const [state, setState] = useState<AppState>(() => ({
    regime: { score: 0, regime: 'neutral', longTerm: 0, midTerm: 0, momentum: 0 },
    trendFilter: { passed: false, closeAboveEMA55: false, ema55Rising: false, ema21AboveEMA55: false },
    entrySignal: null,
    aiScore: { score: 0, trend: 0, momentum: 0, volatility: 0, confidence: 'low' },
    position: null,
    exit: null,
    pyramid: [],
    evolution: loadEvolution(),
    backtest: null,
    currentPrice: 0,
    klineData: [],
    inPosition: false,
    entryPrice: null,
    tradeHistory: [],
  }));

  const wsRef = useRef<WebSocket | null>(null);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const klines = await fetchKlines('BTCUSDT', '1d', 365);
        if (!mounted) return;

        const ticker = await fetchTicker('BTCUSDT');
        const price = parseFloat(ticker.price);
        if (!mounted) return;

        const regime = evaluateRegime(klines);
        const trend = evaluateTrendFilter(klines);
        const ai = computeAIScore(klines);
        const entry4h = analyze4HEntry(klines.slice(-100));
        const pullback = scorePullback(klines.slice(-30));
        const signal = evaluateEntry(klines);
        const pos = computePositionSize(regime, ai, ACCOUNT_SIZE);

        setState(prev => ({
          ...prev,
          klineData: klines,
          currentPrice: price,
          regime, trendFilter: trend,
          aiScore: ai,
          entrySignal: signal,
          position: pos,
          pyramid: computePyramidLevels(price * 0.98),
        }));

        // WebSocket real-time price
        wsRef.current = connectWebSocket('btc', (p) => {
          if (mounted) setState(prev => ({ ...prev, currentPrice: p }));
        });
      } catch (err) {
        console.error('Init error:', err);
      }
    }
    init();
    return () => { mounted = false; wsRef.current?.close(); };
  }, []);

  const runBacktestNow = useCallback(() => {
    if (state.klineData.length < 250) return;
    const result = runBacktest(state.klineData, ACCOUNT_SIZE);
    setState(prev => ({
      ...prev,
      backtest: result,
      tradeHistory: result.trades,
      evolution: recordTrade(prev.evolution, result.winRate > 0.5),
    }));
  }, [state.klineData]);

  const recordTradeResult = useCallback((won: boolean) => {
    setState(prev => ({
      ...prev,
      evolution: saveEvolution(recordTrade(prev.evolution, won)),
    }));
  }, []);

  // Save evolution on change
  useEffect(() => {
    saveEvolution(state.evolution);
  }, [state.evolution]);

  return { state, setState, runBacktestNow, recordTradeResult };
}
