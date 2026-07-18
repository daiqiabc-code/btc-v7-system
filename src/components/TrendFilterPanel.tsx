import { Filter, CheckCircle2, XCircle } from 'lucide-react';
import type { TrendFilter } from '@/types';

interface TrendFilterPanelProps {
  filter: TrendFilter;
}

export function TrendFilterPanel({ filter }: TrendFilterPanelProps) {
  const items = [
    { label: 'Close > EMA55', ok: filter.closeAboveEMA55 },
    { label: 'EMA55 上涨', ok: filter.ema55Rising },
    { label: 'EMA21 > EMA55', ok: filter.ema21AboveEMA55 },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">日线趋势过滤</span>
        {filter.passed ? (
          <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">PASS</span>
        ) : (
          <span className="ml-auto text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">BLOCK</span>
        )}
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{item.label}</span>
            {item.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
