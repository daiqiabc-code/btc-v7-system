import { Brain, TrendingUp, Activity, Waves } from 'lucide-react';
import type { AIScore } from '@/types';

interface AIScorePanelProps {
  score: AIScore;
}

export function AIScorePanel({ score }: AIScorePanelProps) {
  const confColor = score.confidence === 'high' ? 'text-green-600' : score.confidence === 'medium' ? 'text-amber-600' : 'text-slate-500';
  const confLabel = score.confidence === 'high' ? '高置信' : score.confidence === 'medium' ? '中等' : '低置信';

  const items = [
    { label: '趋势', value: score.trend, max: 80, icon: TrendingUp, color: 'text-blue-600' },
    { label: '动量', value: score.momentum, max: 55, icon: Activity, color: 'text-purple-600' },
    { label: '波动', value: score.volatility, max: 15, icon: Waves, color: 'text-cyan-600' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-semibold text-slate-700">AI 趋势评分</span>
        <span className={`ml-auto text-xs font-medium ${confColor}`}>{confLabel}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl font-bold text-slate-800">{score.score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
        <div className="flex-1 h-2 bg-slate-200 rounded-full ml-2 overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${score.score}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <item.icon className={`w-3 h-3 ${item.color}`} />
            <span className="text-xs text-slate-500 w-8">{item.label}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(item.value / item.max) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-600 w-6 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
