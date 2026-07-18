import { Crosshair, ArrowUp, ArrowDown, TrendingDown } from 'lucide-react';
import type { PullbackScore } from '@/types';

interface EntryPanelProps {
  structureValid: boolean;
  ema21SlopeUp: boolean;
  pullbackScore: PullbackScore;
}

export function EntryPanel({ structureValid, ema21SlopeUp, pullbackScore }: EntryPanelProps) {
  const bgColor = pullbackScore.quality === 'excellent' ? 'bg-green-50 border-green-200'
    : pullbackScore.quality === 'good' ? 'bg-emerald-50 border-emerald-200'
    : pullbackScore.quality === 'fair' ? 'bg-amber-50 border-amber-200'
    : 'bg-slate-50 border-slate-200';

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <Crosshair className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">4H 入场引擎</span>
      </div>

      {/* 4H Trend Structure */}
      <div className="flex gap-3 mb-3">
        <div className={`flex-1 text-center text-xs p-2 rounded-lg ${structureValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="font-medium">EMA21{'>'}EMA55</div>
          <div>{structureValid ? '✓' : '✗'}</div>
        </div>
        <div className={`flex-1 text-center text-xs p-2 rounded-lg ${ema21SlopeUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="font-medium">EMA21斜率↑</div>
          <div>{ema21SlopeUp ? '✓' : '✗'}</div>
        </div>
      </div>

      {/* Pullback Score */}
      <div className="text-xs text-slate-500 mb-1.5">回踩质量评分</div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-slate-800">{pullbackScore.score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
        <span className="ml-auto text-xs font-medium capitalize">{pullbackScore.quality}</span>
      </div>
      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pullbackScore.score}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <TrendingDown className="w-3 h-3" /> 深度{pullbackScore.depth}/30
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ArrowDown className="w-3 h-3" /> 速度{pullbackScore.speed}/20
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ArrowUp className="w-3 h-3" /> 量能{pullbackScore.volume}/20
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ArrowUp className="w-3 h-3" /> 反转{pullbackScore.reversal}/30
        </div>
      </div>
    </div>
  );
}
