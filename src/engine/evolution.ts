import type { EvolutionState, Strategy } from '@/types';

const STORAGE_KEY = 'btc_v7_evolution';

const defaultStrategies: Strategy[] = [
  { id: 'v7-regime', name: 'Regime趋势', fitness: 0.5, params: { regimeThreshold: 80 }, trades: 0, wins: 0 },
  { id: 'v7-pullback', name: '回踩评分', fitness: 0.5, params: { pullbackThreshold: 70 }, trades: 0, wins: 0 },
  { id: 'v7-pyramid', name: '金字塔加仓', fitness: 0.5, params: { pyramidStep: 5 }, trades: 0, wins: 0 },
];

function defaultState(): EvolutionState {
  return {
    generation: 1,
    stage: 'embryonic',
    successfulTrades: 0,
    totalTrades: 0,
    winRate: 0,
    fitness: 0.5,
    strategies: [...defaultStrategies],
  };
}

export function loadEvolution(): EvolutionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EvolutionState;
      if (parsed.strategies?.length) return parsed;
    }
  } catch { /* ignore */ }
  return defaultState();
}

export function saveEvolution(state: EvolutionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordTrade(state: EvolutionState, won: boolean): EvolutionState {
  const next = { ...state, totalTrades: state.totalTrades + 1 };
  if (won) next.successfulTrades = state.successfulTrades + 1;
  next.winRate = next.totalTrades > 0 ? next.successfulTrades / next.totalTrades : 0;

  // Update winning strategy
  const idx = Math.floor(Math.random() * next.strategies.length);
  const updated = [...next.strategies];
  updated[idx] = {
    ...updated[idx],
    trades: updated[idx].trades + 1,
    wins: updated[idx].wins + (won ? 1 : 0),
    fitness: clampFitness(updated[idx].fitness + (won ? 0.05 : -0.03)),
  };
  next.strategies = updated;
  next.fitness = updated.reduce((s, st) => s + st.fitness, 0) / updated.length;

  // Stage progression
  if (next.successfulTrades >= 50) next.stage = 'expert';
  else if (next.successfulTrades >= 20) next.stage = 'mature';
  else if (next.successfulTrades >= 5) next.stage = 'juvenile';

  // Evolve: crossover + mutate at every generation boundary
  if (next.totalTrades % 10 === 0 && next.stage !== 'embryonic') {
    next.generation++;
    next.strategies = evolvePopulation(next.strategies);
  }

  return next;
}

function clampFitness(v: number): number {
  return Math.max(0.05, Math.min(1, v));
}

function evolvePopulation(strategies: Strategy[]): Strategy[] {
  // Sort by fitness (descending)
  const sorted = [...strategies].sort((a, b) => b.fitness - a.fitness);
  const newPool: Strategy[] = [];

  // Keep top 1 (elite)
  newPool.push({ ...sorted[0] });

  // Crossover the rest
  while (newPool.length < 3) {
    const parent1 = sorted[Math.floor(Math.random() * 2)];
    const parent2 = sorted[Math.floor(Math.random() * sorted.length)];
    const child: Strategy = {
      ...parent1,
      id: `v7-gen${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${parent1.name}+${parent2.name}`,
      params: {},
      trades: 0,
      wins: 0,
      fitness: (parent1.fitness + parent2.fitness) / 2,
    };
    // Crossover params
    const allKeys = new Set([...Object.keys(parent1.params), ...Object.keys(parent2.params)]);
    for (const key of allKeys) {
      const v1 = parent1.params[key] ?? parent2.params[key];
      const v2 = parent2.params[key] ?? parent1.params[key];
      child.params[key] = (v1 + v2) / 2 + (Math.random() - 0.5) * 5; // mutation
      child.params[key] = Math.round(child.params[key] * 10) / 10;
    }
    newPool.push(child);
  }

  return newPool;
}

export function checkEvolutionHealth(state: EvolutionState): { healthy: boolean; issues: string[] } {
  const issues: string[] = [];
  if (state.winRate < 0.4 && state.totalTrades > 10) issues.push('胜率低于40%，建议调整策略参数');
  if (state.fitness < 0.3) issues.push('整体适应度偏低');
  if (state.strategies.every(s => s.trades === 0)) issues.push('所有策略尚未有交易记录');
  return { healthy: issues.length === 0, issues };
}
