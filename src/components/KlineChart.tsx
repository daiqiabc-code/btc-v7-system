import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, ColorType, LineStyle, createSeriesMarkers } from 'lightweight-charts';
import type { Kline, BacktestTrade } from '@/types';

interface KlineChartProps {
  data: Kline[];
  trades: BacktestTrade[];
  buySignals: number[];      // timestamps where buy signal appeared
  entryPrice: number | null;
  currentPrice: number;
}

export function KlineChart({ data, trades, buySignals, entryPrice, currentPrice }: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#64748b',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      width: containerRef.current.clientWidth,
      height: 420,
      crosshair: { mode: 0 },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: false,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        },
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
      },
    });

    // Candlestick series (lightweight-charts v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const klineData = data.map(k => ({
      time: k.time as any,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));
    candleSeries.setData(klineData);

    // EMA series
    const calcEMA = (closes: number[], period: number): { time: number; value: number }[] => {
      const k = 2 / (period + 1);
      let ema = closes[0];
      return closes.map((c, i) => {
        if (i === 0) return { time: data[i].time as any, value: c };
        ema = c * k + ema * (1 - k);
        return { time: data[i].time as any, value: ema };
      });
    };

    const closes = data.map(k => k.close);
    const ema21 = calcEMA(closes, 21);
    const ema55 = calcEMA(closes, 55);
    const ema200 = calcEMA(closes, 200);

    chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false }).setData(ema21);
    chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false }).setData(ema55);
    chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false }).setData(ema200);

    // Buy signal markers
    const markers: any[] = [];
    for (const ts of buySignals) {
      const k = data.find(d => d.time === ts);
      if (k) {
        markers.push({
          time: ts as any,
          position: 'belowBar',
          color: '#22c55e',
          shape: 'arrowUp',
          text: 'BUY',
          size: 1.5,
        });
      }
    }

    // Trade entry/exit markers
    for (const t of trades) {
      markers.push({
        time: t.entryTime as any,
        position: 'belowBar',
        color: '#22c55e',
        shape: 'arrowUp',
        text: `进 ${t.entryPrice.toLocaleString()}`,
        size: 1,
      });
      markers.push({
        time: t.exitTime as any,
        position: 'aboveBar',
        color: t.pnl > 0 ? '#22c55e' : '#ef4444',
        shape: t.pnl > 0 ? 'arrowDown' : 'arrowDown',
        text: `退 ${(t.pnlPercent > 0 ? '+' : '') + t.pnlPercent.toFixed(1)}%`,
        size: 1,
      });
    }

    // v5: use createSeriesMarkers API
    try {
      createSeriesMarkers(candleSeries, markers);
    } catch (e) {
      // Fallback to old API
      (candleSeries as any).setMarkers?.(markers);
    }

    // Current price line
    if (currentPrice > 0 && data.length > 0) {
      chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: true,
        title: '现价',
      }).setData([
        { time: data[0].time as any, value: currentPrice },
        { time: data[data.length - 1].time as any, value: currentPrice },
      ]);
    }

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // Fit content
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, trades, buySignals, entryPrice, currentPrice]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">BTCUSDT</span>
          <span className="text-slate-400">1D</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> EMA21</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> EMA55</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-b border-dashed border-purple-500 inline-block" /> EMA200</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">🟢 买点</span>
          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded">🔴 卖点</span>
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
