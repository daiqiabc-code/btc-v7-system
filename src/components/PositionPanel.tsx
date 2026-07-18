import { DollarSign, Layers, TrendingUp } from 'lucide-react';
import type { PositionSize, PyramidLevel } from '@/types';
import { formatUSD } from '@/lib/utils';

interface PositionPanelProps {
  position: PositionSize | null;
  pyramid: PyramidLevel[];
  entryPrice: number | null;
  inPosition: boolean;
}

export function PositionPanel({ position, pyramid, entryPrice, inPosition }: PositionPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-semibold text-slate-700">仓位管理系统</span>
        {inPosition && <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">持仓中</span>}
      </div>

      {position && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">基础风险</div>
              <div className="text-sm font-bold text-slate-700">{position.baseRisk * 100}%</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">实际风险</div>
              <div className="text-sm font-bold text-amber-600">{position.actualRisk}%</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">仓位价值</div>
              <div className="text-sm font-bold text-emerald-600">{formatUSD(position.positionValue)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
            <TrendingUp className="w-3 h-3" />
            <span>调整因子: Regime {position.regimeFactor} × AI {position.aiFactor}</span>
          </div>
        </>
      )}

      {/* Pyramid Levels */}
      <div className="flex items-center gap-1.5 mb-2">
        <Layers className="w-3 h-3 text-slate-500" />
        <span className="text-xs font-medium text-slate-600">金字塔加仓计划</span>
      </div>
      <div className="space-y-1.5">
        {pyramid.map(p => (
          <div key={p.level} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${p.level === 1 ? 'bg-blue-100 text-blue-700' : p.level === 2 ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                {p.level}
              </span>
              <span className="text-slate-600">{(p.size * 100).toFixed(0)}% 仓位</span>
            </div>
            <span className="text-slate-500">${p.targetPrice.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
