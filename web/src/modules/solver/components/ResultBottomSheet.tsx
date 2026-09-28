import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Share2,
} from 'lucide-react';
import type { SolveResult } from '../../../shared/types/solver.types';
import { KatexRenderer } from './KatexRenderer';
import { CodeSnippetViewer } from './CodeSnippetViewer';

interface ResultBottomSheetProps {
  result: SolveResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectOption?: (key: string) => void;
}

export const ResultBottomSheet: React.FC<ResultBottomSheetProps> = ({
  result,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const handleCopy = () => {
    const textToCopy = `${result.shortAnswer}\n\n${result.answer}\n\n${result.explanation || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Solusi DaneX',
        text: `${result.questionExtracted}\n\nJawaban: ${result.shortAnswer}\n${result.explanation || ''}`,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      {/* Backdrop tap to dismiss */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Bottom Sheet Modal Container */}
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 border-t border-slate-100">
        
        {/* Drag Handle Bar */}
        <div className="pt-3 pb-1 flex justify-center items-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {result.subject || 'Akademik'}
            </span>
            <span className="text-[10px] bg-sky-50 text-sky-600 font-semibold px-2 py-0.5 rounded-full border border-sky-100">
              AI Solved
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Bagikan"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800">
          
          {/* Question Excerpt Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Pertanyaan:</span>
            <p className="line-clamp-3 font-medium text-slate-700">{result.questionExtracted}</p>
          </div>

          {/* Primary Short Answer Banner */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block mb-0.5">
                Kunci Jawaban Tepat
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {result.shortAnswer || result.answer}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs min-h-[44px] ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-500 hover:bg-sky-600 active:scale-95 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          {/* LaTeX Formula Rendering if Available */}
          {result.latex && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Rumus & Persamaan:
              </span>
              <div className="overflow-x-auto py-1 text-center font-mono">
                <KatexRenderer latex={result.latex} displayMode />
              </div>
            </div>
          )}

          {/* Code Snippet if Available */}
          {result.codeSnippet && (
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <CodeSnippetViewer codeSnippet={result.codeSnippet} />
            </div>
          )}

          {/* Explanation / Concept Card */}
          {result.explanation && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Penjelasan Konsep</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {result.explanation}
              </p>
            </div>
          )}

          {/* Step by Step Breakdown */}
          {result.steps && result.steps.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Langkah Penyelesaian</span>
              </div>
              <div className="space-y-2">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-normal">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 min-h-[48px]"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
