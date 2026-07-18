import { Dna, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { EvolutionState } from '@/types';

interface EvolutionPanelProps {
  evolution: EvolutionState;
  onRecordWin: () => void;
  onRecordLoss: () => void;
}

export function EvolutionPanel({ evolution, onRecordWin, onRecordLoss }: EvolutionPanelProps) {
  const stageLabel = { embryonic: '胚胎期', juvenile: '发育期', mature: '成熟期', expert: '专家期' };
  const stageColor = { embryonic: 'text-gray-400', juvenile: 'text-blue-500', mature: 'text-purple-600', expert: 'text-amber-500' };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Dna className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-semibold text-slate-700">进化引擎</span>
        <span className={`ml-auto text-xs font-medium ${stageColor[evolution.stage]}`}>
          Gen{evolution.generation} · {stageLabel[evolution.stage]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-400">交易</div>
          <div className="text-sm font-bold text-slate-700">{evolution.totalTrades}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-400">胜率</div>
          <div className={`text-sm font-bold ${evolution.winRate >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
            {(evolution.winRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-400">适应度</div>
          <div className="text-sm font-bold text-amber-600">{(evolution.fitness * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-1.5">策略池</div>
      <div className="space-y-1">
        {evolution.strategies.map(s => (
          <div key={s.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{s.trades}单</span>
              <div className={`flex items-center gap-0.5 ${s.fitness > 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                {s.fitness > 0.5 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {(s.fitness * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={onRecordWin} className="flex-1 text-xs bg-green-50 text-green-700 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">
          + 记录胜单
        </button>
        <button onClick={onRecordLoss} className="flex-1 text-xs bg-red-50 text-red-700 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
          + 记录败单
        </button>
      </div>
    </div>
  );
}
