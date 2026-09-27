import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { UsageStats } from '../../../shared/types/solver.types';

interface TokenBudgetWidgetProps {
  stats: UsageStats | null;
  onRefresh?: () => void;
}

export const TokenBudgetWidget: React.FC<TokenBudgetWidgetProps> = ({ stats, onRefresh }) => {
  const total = stats?.totalTokens || 0;
  const budget = stats?.budgetTokens || 1_000_000;
  const remaining = stats?.remainingTokens || 1_000_000;
  const percent = Math.min(100, Math.max(0, (total / budget) * 100));

  const isNearLimit = stats?.warning80Exceeded || percent >= 80;
  const isExceeded = stats?.budgetExhausted || percent >= 100;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800">Token Gateway</span>
            <div className="text-[10px] text-slate-400">Status Kuota Server</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isExceeded ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Penuh
            </span>
          ) : isNearLimit ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" /> 80%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Optimal
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-[11px] text-slate-400 hover:text-slate-600 ml-1 p-1 rounded-lg hover:bg-slate-50 transition"
              title="Refresh kuota"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isExceeded ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>Terpakai: <strong className="text-slate-700 font-semibold">{total.toLocaleString()}</strong></span>
        <span>Sisa: <strong className="text-slate-700 font-semibold">{remaining.toLocaleString()}</strong></span>
      </div>
    </div>
  );
};
