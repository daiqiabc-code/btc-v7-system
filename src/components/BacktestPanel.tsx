import { BarChart3, TrendingUp, Percent, DollarSign, Activity } from 'lucide-react';
import type { BacktestResult } from '@/types';

interface BacktestPanelProps {
  result: BacktestResult | null;
  onRun: () => void;
}

export function BacktestPanel({ result, onRun }: BacktestPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-semibold text-slate-700">回测结果</span>
        <button onClick={onRun} className="ml-auto text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
          运行回测
        </button>
      </div>

      {!result ? (
        <div className="text-xs text-slate-400 text-center py-6">
          点击"运行回测"查看V7策略历史表现
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <TrendingUp className="w-3 h-3" /> 总收益
              </div>
              <span className={`text-sm font-bold ${result.totalReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Activity className="w-3 h-3" /> 交易次数
              </div>
              <span className="text-sm font-bold text-slate-700">{result.totalTrades}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Percent className="w-3 h-3" /> 胜率
              </div>
              <span className={`text-sm font-bold ${result.winRate >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                {(result.winRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <DollarSign className="w-3 h-3" /> Sharpe
              </div>
              <span className={`text-sm font-bold ${result.sharpe >= 1 ? 'text-green-600' : 'text-amber-600'}`}>
                {result.sharpe.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <BarChart3 className="w-3 h-3" /> Profit Factor
              </div>
              <span className={`text-sm font-bold ${result.profitFactor >= 2 ? 'text-green-600' : 'text-amber-600'}`}>
                {result.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <TrendingUp className="w-3 h-3" /> 最大回撤
              </div>
              <span className="text-sm font-bold text-red-600">-{result.maxDrawdown.toFixed(1)}%</span>
            </div>
          </div>

          {result.trades.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">最近交易记录</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {result.trades.slice(-5).reverse().map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] bg-slate-50 rounded px-2 py-1">
                    <span className="text-slate-500">
                      {new Date(t.entryTime * 1000).toLocaleDateString()}
                    </span>
                    <span className={`font-medium ${t.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.pnl > 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                    </span>
                    <span className="text-slate-400">{t.exitReason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
