import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { OptionItem } from '../../../shared/types/solver.types';

interface OptionListSelectorProps {
  options: OptionItem[];
  answerOption?: string | null;
}

export const OptionListSelector: React.FC<OptionListSelectorProps> = ({ options, answerOption }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="space-y-2 my-3">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        Pilihan Jawaban
      </div>
      <div className="space-y-2">
        {options.map((option) => {
          const isCorrect = answerOption?.toUpperCase() === option.key.toUpperCase();
          return (
            <div
              key={option.key}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                isCorrect
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-sm'
                  : 'bg-white border-slate-100 text-slate-700 shadow-sm'
              }`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isCorrect
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {option.key}
              </div>
              <div className="flex-1 text-xs font-medium leading-relaxed">
                {option.text}
              </div>
              {isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
