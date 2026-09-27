import React, { useState } from 'react';
import {
  Send,
  Camera,
  Crop,
  Sparkles,
  Zap,
  BookOpen,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { SolveMode, SolveResult, SolveStatus, UsageStats } from '../../../shared/types/solver.types';
import { SolverApiClient } from '../../../shared/api-client/solver.client';
import { KatexRenderer } from './KatexRenderer';
import { CodeSnippetViewer } from './CodeSnippetViewer';
import { OptionListSelector } from './OptionListSelector';
import { TokenBudgetWidget } from './TokenBudgetWidget';
import { WebcamCaptureModal } from './WebcamCaptureModal';
import { ScreenCropModal } from './ScreenCropModal';
import { HeadsUpNotification } from './HeadsUpNotification';
import { TextSelectionPlayground } from './TextSelectionPlayground';

interface DesktopDashboardProps {
  inputText: string;
  setInputText: (text: string) => void;
  solveMode: SolveMode;
  setSolveMode: (mode: SolveMode) => void;
  status: SolveStatus;
  result: SolveResult | null;
  error: string | null;
  onSolveText: () => void;
  onSolveVision: (base64: string, prompt?: string) => void;
  usageStats: UsageStats | null;
  onRefreshStats: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  inputText,
  setInputText,
  solveMode,
  setSolveMode,
  status,
  result,
  error,
  onSolveText,
  onSolveVision,
  usageStats,
  onRefreshStats,
}) => {
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Heads-up Notification State for "Mark Teks -> Ask -> Notifikasi Muncul"
  const [notifResult, setNotifResult] = useState<SolveResult | null>(null);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleAskSelection = async (selectedText: string) => {
    setIsNotifLoading(true);
    setIsNotifOpen(true);
    try {
      const res = await SolverApiClient.solveText(
        selectedText,
        solveMode,
        'id',
        'DESKTOP_PROCESS_TEXT_NOTIFICATION'
      );
      setNotifResult(res);
      setIsNotifLoading(false);
    } catch {
      setIsNotifLoading(false);
    }
  };

  const isSolving =
    status === 'READING' ||
    status === 'UNDERSTANDING' ||
    status === 'SOLVING' ||
    status === 'VERIFYING';

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputText(text);
    } catch {
      // ignore
    }
  };

  const handleCopyAnswer = () => {
    if (!result) return;
    const textToCopy = `${result.shortAnswer || result.answer}\n\n${result.explanation}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'READING':
        return '1. Membaca & mengekstrak soal...';
      case 'UNDERSTANDING':
        return '2. Menganalisis konteks & diagram akademik...';
      case 'SOLVING':
        return '3. Menyelesaikan via AI Academic Solver...';
      case 'VERIFYING':
        return '4. Memverifikasi rumus & langkah KaTeX...';
      default:
        return 'Sedang memproses...';
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Heads-up System Notification on Text Selection Ask */}
      {isNotifOpen && (
        <div className="max-w-md mx-auto mb-4">
          <HeadsUpNotification
            result={notifResult}
            isLoading={isNotifLoading}
            onClose={() => setIsNotifOpen(false)}
            onOpenDetail={(item) => {
              setInputText(item.questionExtracted);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Question Input & Capture Actions ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Feature: Mark Teks Biru & Muncul Notifikasi Playground */}
          <TextSelectionPlayground onAskSelection={handleAskSelection} />

          {/* Token Budget Tracker Widget */}
          <TokenBudgetWidget stats={usageStats} onRefresh={onRefreshStats} />

          {/* Input Box Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Input Pertanyaan
              </h2>
              <p className="text-[11px] text-slate-400">Ketik, tempel, atau foto soal studi</p>
            </div>

            {/* Solve Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setSolveMode('QUICK')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
                  solveMode === 'QUICK'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3 h-3" /> Quick
              </button>
              <button
                onClick={() => setSolveMode('LEARN')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
                  solveMode === 'LEARN'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3 h-3" /> Learn
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik atau tempel pertanyaan di sini (Matematika, Fisika, Biologi, Kimia, Coding, dll)..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none leading-relaxed"
            />
            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Bersihkan
              </button>
            )}
          </div>

          {/* Quick Capture Options */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => setIsCropModalOpen(true)}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 text-slate-700 transition text-xs font-semibold"
            >
              <Crop className="w-4 h-4 text-slate-600" />
              <span>Tangkap Layar</span>
            </button>

            <button
              onClick={() => setIsWebcamOpen(true)}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 text-slate-700 transition text-xs font-semibold"
            >
              <Camera className="w-4 h-4 text-slate-600" />
              <span>Foto Soal</span>
            </button>

            <button
              onClick={handlePaste}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 text-slate-700 transition text-xs font-semibold"
            >
              <ClipboardPaste className="w-4 h-4 text-slate-600" />
              <span>Tempel Teks</span>
            </button>
          </div>

          {/* Solve Button */}
          <button
            onClick={onSolveText}
            disabled={isSolving || !inputText.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isSolving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyelesaikan Soal...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Selesaikan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Right Column: Solution Output Panel ── */}
      <div className="lg:col-span-7">
        {isSolving ? (
          <div className="h-full min-h-[420px] bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">{getStatusLabel()}</h3>
              <p className="text-xs text-slate-400">DaneX sedang merumuskan jawaban valid & terstruktur.</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full min-h-[420px] bg-red-50/60 border border-red-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-base font-bold text-red-800">Gagal Menyelesaikan Soal</h3>
            <p className="text-xs text-red-600 max-w-md">{error}</p>
          </div>
        ) : result ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
            {/* Header: Subject + Type + Confidence */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl">
                  {result.subject}
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                  {result.questionType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl">
                  Keyakinan: {Math.round(result.confidence * 100)}%
                </span>
                <button
                  onClick={handleCopyAnswer}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 transition shadow-2xs"
                  title="Salin jawaban"
                >
                  {copiedAnswer ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedAnswer ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Extracted Question */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pertanyaan Terdeteksi
              </div>
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
                {result.questionExtracted}
              </p>
            </div>

            {/* Image Thumbnail if Vision Path */}
            {result.imageThumbnail && (
              <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-48 bg-slate-50 flex items-center justify-center p-2">
                <img src={result.imageThumbnail} alt="Thumbnail Soal" className="max-h-44 object-contain rounded-xl" />
              </div>
            )}

            {/* Multiple Choice Options (if present) */}
            <OptionListSelector options={result.options} answerOption={result.answerOption} />

            {/* Direct Answer Highlight */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Jawaban Terverifikasi
              </div>
              <div className="text-base font-bold text-slate-900 leading-snug">
                {result.shortAnswer || result.answer}
              </div>
            </div>

            {/* LaTeX Formula Rendering */}
            {result.latex && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Formula Matematika / LaTeX
                </div>
                <KatexRenderer latex={result.latex} />
              </div>
            )}

            {/* Code Snippet (if present) */}
            {result.codeSnippet && (
              <CodeSnippetViewer codeSnippet={result.codeSnippet} />
            )}

            {/* Explanation */}
            {result.explanation && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Penjelasan Konseptual
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                  {result.explanation}
                </p>
              </div>
            )}

            {/* Step-by-Step Breakdown (Learn Mode) */}
            {result.steps && result.steps.length > 0 && (
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
                <button
                  onClick={() => setStepsExpanded(!stepsExpanded)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 text-left hover:bg-slate-100/70 transition"
                >
                  <span className="text-xs font-bold text-slate-700">
                    Langkah-Langkah Penyelesaian ({result.steps.length} Tahap)
                  </span>
                  {stepsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {stepsExpanded && (
                  <div className="p-4 space-y-2.5 border-t border-slate-100">
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[420px] bg-white border border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-700">Solusi Akademis Siap Ditampilkan</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Ketik soal, tangkap wilayah layar, atau unggah foto untuk mendapatkan jawaban instan beserta pembahasannya.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Modals */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(base64) => onSolveVision(base64)}
      />
      <ScreenCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={(base64) => onSolveVision(base64)}
      />
    </div>
  );
};
