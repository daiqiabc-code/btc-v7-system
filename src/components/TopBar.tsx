import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { formatPrice, formatPercent } from '@/lib/utils';
import type { MarketRegime } from '@/types';

interface TopBarProps {
  price: number;
  regime: MarketRegime;
  onRefresh: () => void;
}

export function TopBar({ price, regime, onRefresh }: TopBarProps) {
  const regimeColor = regime === 'bull' ? 'text-green-600' : regime === 'bear' ? 'text-red-600' : 'text-amber-600';
  const regimeLabel = regime === 'bull' ? '牛市' : regime === 'bear' ? '熊市' : '震荡';
  const RegimeIcon = regime === 'bull' ? TrendingUp : TrendingDown;

  return (
    <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h1 className="text-lg font-bold text-slate-900">BTC V7</h1>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-900">${formatPrice(price)}</span>
          <span className={`flex items-center gap-1 text-sm font-medium ${regimeColor}`}>
            <RegimeIcon className="w-4 h-4" />
            {regimeLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">BTCUSDT</span>
        <button onClick={onRefresh} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
