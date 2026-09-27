import React, { useState } from 'react';
import { History, X, Trash2, Search, ArrowRight } from 'lucide-react';
import type { SolveResult } from '../../../shared/types/solver.types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SolveResult[];
  onSelectResult: (result: SolveResult) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.questionExtracted.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-l border-slate-100 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Riwayat Belajar</h3>
              <div className="text-[10px] text-slate-400">{history.length} soal tersimpan</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pertanyaan, rumus, atau mata pelajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Belum ada riwayat soal yang tersimpan.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {item.subject}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 line-clamp-2 group-hover:text-blue-600 transition">
                  {item.questionExtracted}
                </p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-blue-600 font-bold truncate max-w-[200px]">
                    {item.shortAnswer || item.answer}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Semua Riwayat
            </button>
            <span className="text-[11px] text-slate-400">Tersimpan di Browser</span>
          </div>
        )}
      </div>
    </div>
  );
};
