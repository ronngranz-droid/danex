import React, { useEffect, useState } from 'react';
import { Copy, Check, X, ExternalLink } from 'lucide-react';
import type { SolveResult } from '../../../shared/types/solver.types';

interface HeadsUpNotificationProps {
  result: SolveResult | null;
  isLoading: boolean;
  onClose: () => void;
  onOpenDetail: (result: SolveResult) => void;
}

export const HeadsUpNotification: React.FC<HeadsUpNotificationProps> = ({
  result,
  isLoading,
  onClose,
  onOpenDetail,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (result && !isLoading) {
      const timer = setTimeout(() => {
        // Auto dismiss after 10s if not interacted
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [result, isLoading]);

  if (!isLoading && !result) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result) return;
    const text = `${result.shortAnswer || result.answer}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-2 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3.5 shadow-2xl border border-slate-200/90 ring-1 ring-black/5 flex flex-col space-y-2">
        {/* Notification Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center font-black text-[10px] text-white shadow-xs">
              DX
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-900">DaneX</span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded-md">
                {isLoading ? 'Menganalisis...' : result?.subject || 'Solusi'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400">Sekarang</span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notification Body */}
        {isLoading ? (
          <div className="flex items-center gap-2.5 py-1 px-1">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs text-slate-600 font-medium animate-pulse">
              Memproses teks yang ditandai...
            </span>
          </div>
        ) : result ? (
          <div className="space-y-1.5 px-0.5">
            {/* Answer title */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight">Jawaban:</span>
              <span className="text-xs font-bold text-slate-900 leading-snug">
                {result.shortAnswer || result.answer}
              </span>
            </div>

            {/* Snippet / Short explanation */}
            {result.explanation && (
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {result.explanation}
              </p>
            )}

            {/* Quick Actions in Notification */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1 text-[11px]">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold py-1 px-2 rounded-xl hover:bg-slate-100 transition"
              >
                {copied ? <Check className="w-3 h-3 text-sky-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copied ? 'Tersalin' : 'Salin Jawaban'}</span>
              </button>

              <button
                onClick={() => {
                  onOpenDetail(result);
                  onClose();
                }}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold py-1 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 transition"
              >
                <span>Pembahasan</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
