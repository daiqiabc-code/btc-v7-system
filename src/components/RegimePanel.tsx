import { Gauge, TrendingUp, BarChart3, Activity } from 'lucide-react';
import type { RegimeScore } from '@/types';
import { cn } from '@/lib/utils';

interface RegimePanelProps {
  regime: RegimeScore;
}

export function RegimePanel({ regime }: RegimePanelProps) {
  const regimeColor = regime.score >= 80 ? 'text-green-600' : regime.score >= 50 ? 'text-amber-600' : 'text-red-600';
  const regimeBg = regime.score >= 80 ? 'bg-green-50 border-green-200' : regime.score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const regimeLabel = regime.score >= 80 ? 'Bull Trend' : regime.score >= 50 ? 'Neutral' : 'Bear';

  const items = [
    { label: '长期趋势(40)', value: regime.longTerm, icon: TrendingUp, color: regime.longTerm >= 30 ? 'text-green-600' : 'text-slate-500' },
    { label: '中期趋势(30)', value: regime.midTerm, icon: BarChart3, color: regime.midTerm >= 20 ? 'text-green-600' : 'text-slate-500' },
    { label: '动量状态(30)', value: regime.momentum, icon: Activity, color: regime.momentum >= 20 ? 'text-green-600' : 'text-slate-500' },
  ];

  return (
    <div className={`rounded-xl border p-4 ${regimeBg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">市场状态识别</span>
        </div>
        <span className={`text-xl font-bold ${regimeColor}`}>{regime.score}</span>
      </div>

      <div className="w-full bg-slate-200 h-2 rounded-full mb-3 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', regime.score >= 80 ? 'bg-green-500' : regime.score >= 50 ? 'bg-amber-400' : 'bg-red-500')}
          style={{ width: `${regime.score}%` }}
        />
      </div>

      <div className="text-sm font-medium mb-2 text-center">{regimeLabel}</div>

      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <item.icon className={`w-3 h-3 ${item.color}`} />
              <span className="text-slate-600">{item.label}</span>
            </div>
            <span className={`font-medium ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
