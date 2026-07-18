import { ShieldOff, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import type { ExitSignal } from '@/types';

interface ExitPanelProps {
  exit: ExitSignal | null;
  inPosition: boolean;
}

export function ExitPanel({ exit, inPosition }: ExitPanelProps) {
  if (!inPosition || !exit) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldOff className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">退出系统</span>
        </div>
        <div className="text-xs text-slate-400 text-center py-4">无持仓，退出系统待命中</div>
      </div>
    );
  }

  const levels = [
    { label: '一级: 4H破EMA55', triggered: exit.level1.triggered, reason: exit.level1.reason, reduction: '-50%' },
    { label: '二级: 日线破EMA21', triggered: exit.level2.triggered, reason: exit.level2.reason, reduction: '-50%' },
    { label: '三级: 日线破EMA55', triggered: exit.level3.triggered, reason: exit.level3.reason, reduction: '全部退出' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldOff className="w-4 h-4 text-red-500" />
        <span className="text-sm font-semibold text-slate-700">退出系统</span>
        {exit.blackSwan && (
          <span className="ml-auto flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />黑天鹅
          </span>
        )}
      </div>

      <div className="space-y-1.5 mb-2">
        {levels.map(l => (
          <div key={l.label} className={`flex items-center justify-between text-xs p-2 rounded-lg ${l.triggered ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className={`w-3 h-3 ${l.triggered ? 'text-red-500' : 'text-slate-400'}`} />
              <span className={l.triggered ? 'text-red-700 font-medium' : 'text-slate-500'}>{l.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {l.triggered && <span className="text-red-600 font-medium">触发 ✓</span>}
              <span className="text-slate-400">{l.reduction}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs bg-slate-50 rounded-lg py-2">
        <span className="text-slate-400">剩余仓位: </span>
        <span className="font-bold text-slate-700">{exit.remainingPosition.toFixed(0)}%</span>
      </div>
    </div>
  );
}
