import { useEffect, useState } from 'react';
import { useV7Engine } from '@/hooks/useV7Engine';
import { TopBar } from '@/components/TopBar';
import { RegimePanel } from '@/components/RegimePanel';
import { TrendFilterPanel } from '@/components/TrendFilterPanel';
import { EntryPanel } from '@/components/EntryPanel';
import { AIScorePanel } from '@/components/AIScorePanel';
import { PositionPanel } from '@/components/PositionPanel';
import { ExitPanel } from '@/components/ExitPanel';
import { EvolutionPanel } from '@/components/EvolutionPanel';
import { BacktestPanel } from '@/components/BacktestPanel';
import { KlineChart } from '@/components/KlineChart';
import { analyze4HEntry, scorePullback, computePyramidLevels, evaluateExit, evaluateEntry } from '@/engine/v7Engine';

export default function App() {
  const { state, runBacktestNow, recordTradeResult } = useV7Engine();
  const [buySignals, setBuySignals] = useState<number[]>([]);
  const [entrySignalText, setEntrySignalText] = useState<string>('');

  // Compute derived signals when kline data changes
  useEffect(() => {
    if (state.klineData.length < 250) return;

    const signals: number[] = [];
    // Scan for buy signals in recent data
    for (let i = state.klineData.length - 60; i < state.klineData.length; i++) {
      const slice = state.klineData.slice(0, i + 1);
      const signal = evaluateEntry(slice);
      if (signal?.enabled) {
        signals.push(state.klineData[i].time);
      }
    }
    setBuySignals(signals);

    // Current entry status
    const last10 = state.klineData.slice(-100);
    const entry4h = analyze4HEntry(last10);
    const pbScore = scorePullback(last10.slice(-30));
    if (state.entrySignal?.enabled) {
      setEntrySignalText(`✅ 买入条件满足！回踩评分${pbScore.score}，AI评分${state.aiScore.score}`);
    } else {
      const reasons: string[] = [];
      if (state.regime.score < 80) reasons.push('市场状态不足');
      if (!state.trendFilter.passed) reasons.push('日线趋势过滤未通过');
      if (!entry4h.structureValid || !entry4h.ema21SlopeUp) reasons.push('4H趋势结构不佳');
      if (pbScore.score < 70) reasons.push(`回踩评分不足(${pbScore.score})`);
      if (state.aiScore.score < 70) reasons.push(`AI评分不足(${state.aiScore.score})`);
      setEntrySignalText(reasons.length > 0 ? `⏳ 等待: ${reasons.join(', ')}` : '⏳ 数据加载中...');
    }
  }, [state.klineData, state.entrySignal, state.regime, state.trendFilter, state.aiScore]);

  const last10 = state.klineData.length >= 100
    ? state.klineData.slice(-100)
    : state.klineData;
  const entry4h = analyze4HEntry(last10);
  const pbScore = scorePullback(last10.slice(-30));
  const exitStatus = state.inPosition && state.entryPrice
    ? evaluateExit(state.klineData, state.entryPrice, true)
    : null;
  const pyramids = state.entryPrice
    ? computePyramidLevels(state.entryPrice)
    : computePyramidLevels(state.currentPrice * 0.98);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        price={state.currentPrice}
        regime={state.regime.regime}
        onRefresh={() => window.location.reload()}
      />

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Entry Status Banner */}
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium border ${
          state.entrySignal?.enabled
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {entrySignalText}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar - Strategy panels */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <RegimePanel regime={state.regime} />
            <TrendFilterPanel filter={state.trendFilter} />
            <EntryPanel
              structureValid={entry4h.structureValid}
              ema21SlopeUp={entry4h.ema21SlopeUp}
              pullbackScore={pbScore}
            />
          </div>

          {/* Center - K-line chart */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            <KlineChart
              data={state.klineData}
              trades={state.tradeHistory}
              buySignals={buySignals}
              entryPrice={state.entryPrice}
              currentPrice={state.currentPrice}
            />

            {/* Backtest + Evolution row */}
            <div className="grid grid-cols-2 gap-4">
              <BacktestPanel result={state.backtest} onRun={runBacktestNow} />
              <EvolutionPanel
                evolution={state.evolution}
                onRecordWin={() => recordTradeResult(true)}
                onRecordLoss={() => recordTradeResult(false)}
              />
            </div>
          </div>

          {/* Right sidebar - Risk & Position */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <AIScorePanel score={state.aiScore} />
            <PositionPanel
              position={state.position}
              pyramid={pyramids}
              entryPrice={state.entryPrice}
              inPosition={state.inPosition}
            />
            <ExitPanel exit={exitStatus} inPosition={state.inPosition} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-slate-300 pb-4">
          BTC EMA Trend V7 · 机构级多周期趋势系统 · 数据来源: Binance USDⓈ-M 合约 · 仅供学习参考，不构成投资建议
        </div>
      </main>
    </div>
  );
}
