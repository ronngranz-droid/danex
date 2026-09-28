import React, { useState, useRef } from 'react';
import {
  Camera,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Send,
  Sparkles,
  ClipboardPaste,
  ChevronRight,
  Zap,
  BookOpen,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { SolveMode, SolveResult, SolveStatus } from '../../../shared/types/solver.types';
import { SolverApiClient } from '../../../shared/api-client/solver.client';
import { WebcamCaptureModal } from './WebcamCaptureModal';
import { ScreenCropModal } from './ScreenCropModal';
import { HeadsUpNotification } from './HeadsUpNotification';
import { TextSelectionPlayground } from './TextSelectionPlayground';
import { ResultBottomSheet } from './ResultBottomSheet';

interface MobileSimulatorProps {
  inputText: string;
  setInputText: (text: string) => void;
  solveMode: SolveMode;
  setSolveMode: (mode: SolveMode) => void;
  status: SolveStatus;
  result: SolveResult | null;
  error: string | null;
  onSolveText: () => void;
  onSolveVision: (base64: string, prompt?: string) => void;
  history: SolveResult[];
  onSelectHistory: (item: SolveResult) => void;
  onClearHistory: () => void;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  inputText,
  setInputText,
  solveMode,
  setSolveMode,
  status,
  result,
  error,
  onSolveText,
  onSolveVision,
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SolveResult | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Heads-up notification state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifResult, setNotifResult] = useState<SolveResult | null>(null);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  // Settings Toggles
  const [toggleNotif, setToggleNotif] = useState(true);
  const [toggleAutoCopy, setToggleAutoCopy] = useState(false);
  const [toggleHaptic, setToggleHaptic] = useState(true);

  // Hidden file input for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSolving =
    status === 'READING' ||
    status === 'UNDERSTANDING' ||
    status === 'SOLVING' ||
    status === 'VERIFYING';

  const handleAskSelection = async (text: string) => {
    setIsNotifOpen(true);
    setIsNotifLoading(true);
    setNotifResult(null);

    try {
      const res = await SolverApiClient.solveText(
        text,
        solveMode,
        'id',
        'ANDROID_PROCESS_TEXT_NOTIFICATION'
      );
      setNotifResult(res);
      setIsNotifLoading(false);
    } catch {
      setIsNotifLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputText(text);
    } catch {
      // ignore
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        onSolveVision(base64, 'Pindai dan selesaikan soal dalam gambar galeri ini');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openResultDetail = (item: SolveResult) => {
    setSelectedResult(item);
    setIsBottomSheetOpen(true);
    if (onSelectHistory) {
      onSelectHistory(item);
    }
  };

  // When parent `result` updates, auto-open bottom sheet
  React.useEffect(() => {
    if (result && status === 'SUCCESS') {
      setSelectedResult(result);
      setIsBottomSheetOpen(true);
    }
  }, [result, status]);

  // Live Clipboard state
  const [clipboardText, setClipboardText] = useState('24 cm');
  const [isAutoSolveOn, setIsAutoSolveOn] = useState(true);
  const [isNotifEnabled, setIsNotifEnabled] = useState(true);
  const [isAutoReplaceOn, setIsAutoReplaceOn] = useState(true);

  const refreshClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) setClipboardText(text);
      }
    } catch {
      // ignore
    }
  };

  const handleSolveClipboardNow = () => {
    if (!clipboardText.trim()) return;
    setInputText(clipboardText);
    handleAskSelection(clipboardText);
  };

  const handleTriggerDemoMCQ = () => {
    setIsNotifOpen(true);
    setIsNotifLoading(true);
    setTimeout(() => {
      setNotifResult({
        id: crypto.randomUUID(),
        questionExtracted: 'Organel sel manakah yang berfungsi menghasilkan energi utama berupa ATP?',
        subject: 'biology',
        questionType: 'multiple_choice',
        shortAnswer: 'C. Mitokondria',
        answer: 'Mitokondria (Pilihan C) adalah organel sel yang menghasilkan ATP.',
        explanation: 'Mitokondria dikenal sebagai powerhouse of the cell tempat respirasi seluler.',
        options: [],
        steps: ['Identifikasi organel sel penghasil energi.', 'Mitokondria menjalankan siklus Krebs.', 'Jawaban C.'],
        solveMode: 'QUICK',
        inputSource: 'DEMO',
        language: 'id',
        confidence: 0.99,
        warnings: [],
        timestamp: Date.now(),
      });
      setIsNotifLoading(false);
    }, 300);
  };

  const handleTriggerDemoMath = () => {
    setIsNotifOpen(true);
    setIsNotifLoading(true);
    setTimeout(() => {
      setNotifResult({
        id: crypto.randomUUID(),
        questionExtracted: 'Tentukan akar persamaan x^2 - 5x + 6 = 0',
        subject: 'mathematics',
        questionType: 'calculation',
        shortAnswer: 'x = 2 atau x = 3',
        answer: 'Akar persamaan adalah x = 2 atau x = 3.',
        explanation: 'Difaktorkan menjadi (x - 2)(x - 3) = 0.',
        latex: 'x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \\implies x_1 = 2, \\; x_2 = 3',
        options: [],
        steps: ['Bentuk umum ax^2+bx+c=0', 'Faktorkan (x-2)(x-3)=0', 'Diperoleh x=2 atau x=3'],
        solveMode: 'QUICK',
        inputSource: 'DEMO',
        language: 'id',
        confidence: 0.99,
        warnings: [],
        timestamp: Date.now(),
      });
      setIsNotifLoading(false);
    }, 300);
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F4F6FA] text-slate-800 relative selection:bg-blue-100">
      
      {/* ── Native Mobile Header matching Reference Screenshot ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shadow-2xs pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">DaneX AI</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-Solve ON</span>
          </div>
        </div>
      </header>

      {/* ── Heads-up Notification (Meluncur Turun pada Ask Teks / Demo) ── */}
      {isNotifOpen && (
        <HeadsUpNotification
          result={notifResult}
          isLoading={isNotifLoading}
          onClose={() => setIsNotifOpen(false)}
          onOpenDetail={(item) => openResultDetail(item)}
        />
      )}

      {/* ── Main Scrollable Body ── */}
      <main className="flex-1 px-4 py-3 pb-24 overflow-y-auto space-y-3.5 max-w-lg mx-auto w-full">
        
        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-xs text-red-600 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 1: BERANDA (HOME)
           ══════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            
            {/* ── CARD 1: Automation Toggles (Matching Reference Screenshot) ── */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 space-y-4">
              
              {/* Toggle 1: Auto-Solve on Copy */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Auto-Solve on Copy</h3>
                    <p className="text-[10px] text-slate-400">Memantau clipboard secara otomatis</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAutoSolveOn(!isAutoSolveOn)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-0.8 min-h-[44px] min-w-[48px] ${
                    isAutoSolveOn ? 'bg-sky-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Toggle 2: Notifikasi Jawaban Real-time */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="pl-10">
                  <h3 className="text-xs font-bold text-slate-800">Notifikasi Jawaban Real-time</h3>
                  <p className="text-[10px] text-slate-400">Menampilkan kunci opsi pilihan ganda langsung di notifikasi</p>
                </div>

                <button
                  onClick={() => setIsNotifEnabled(!isNotifEnabled)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-0.8 min-h-[44px] min-w-[48px] ${
                    isNotifEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Toggle 3: Auto-Replace Clipboard dengan Jawaban */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="pl-10">
                  <h3 className="text-xs font-bold text-slate-800">Auto-Replace Clipboard dengan Jawaban</h3>
                  <p className="text-[10px] text-slate-400">Kunci jawaban langsung menggantikan teks di clipboard siap Paste</p>
                </div>

                <button
                  onClick={() => setIsAutoReplaceOn(!isAutoReplaceOn)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-0.8 min-h-[44px] min-w-[48px] ${
                    isAutoReplaceOn ? 'bg-sky-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

            </div>

            {/* ── CARD 2: Isi Clipboard Saat Ini (Matching Reference Screenshot) ── */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardPaste className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-slate-800">Isi Clipboard Saat Ini</span>
                </div>

                <button
                  onClick={refreshClipboard}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl transition min-h-[36px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Live Clipboard Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-800 font-medium min-h-[48px] flex items-center">
                <span>{clipboardText || 'Clipboard kosong'}</span>
              </div>

              {/* Primary Solve Clipboard Button */}
              <button
                onClick={handleSolveClipboardNow}
                disabled={isSolving}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-sm shadow-sky-500/20 flex items-center justify-center gap-2 transition min-h-[48px]"
              >
                {isSolving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Selesaikan Teks di Clipboard Sekarang</span>
                  </>
                )}
              </button>
            </div>

            {/* ── CARD 3: Uji Coba Notifikasi Real-time (Matching Reference Screenshot) ── */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Uji Coba Notifikasi Real-time</h3>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Klik tombol di bawah untuk melihat bagaimana notifikasi kunci pilihan ganda dan matematika tampil di status bar Anda.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleTriggerDemoMCQ}
                  className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 active:scale-98 text-sky-700 rounded-2xl font-bold text-xs border border-sky-100/80 flex items-center justify-center gap-2 transition min-h-[44px]"
                >
                  <span>🔔</span>
                  <span>Kirim Notifikasi Demo Pilihan Ganda</span>
                </button>

                <button
                  onClick={handleTriggerDemoMath}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 active:scale-98 text-indigo-700 rounded-2xl font-bold text-xs border border-indigo-100/80 flex items-center justify-center gap-2 transition min-h-[44px]"
                >
                  <span>📐</span>
                  <span>Kirim Notifikasi Demo Matematika</span>
                </button>
              </div>
            </div>

            {/* ── CARD 4: Simulasi Tandai Teks (Select & Ask) ── */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Simulasi Tandai Teks (Select & Ask)</h3>
                    <p className="text-[10px] text-slate-400">Tandai/blok teks biru di bawah lalu tekan "Ask"</p>
                  </div>
                </div>

                <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  Android Feature
                </span>
              </div>

              {/* Text Selection Box */}
              <TextSelectionPlayground onAskSelection={handleAskSelection} />
            </div>

            {/* 3. Direct Question Input Box */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Ketik / Tempel Soal</span>
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100/70 px-2.5 py-1 rounded-xl transition min-h-[36px]"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Tempel</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik soal matematika, sains, coding, atau pilihan ganda di sini..."
                  rows={3}
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 placeholder-slate-400 resize-none transition"
                />

                {inputText.trim() && (
                  <button
                    onClick={onSolveText}
                    disabled={isSolving}
                    className="mt-2 w-full py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition min-h-[44px]"
                  >
                    {isSolving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Selesaikan Sekarang</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 4. Quick Action Cards (Kamera & Galeri) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setIsWebcamOpen(true)}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-sky-200 transition flex items-center gap-2.5 text-left active:scale-98 min-h-[56px]"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Foto Soal</div>
                  <div className="text-[10px] text-slate-400">Scan via kamera</div>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-sky-200 transition flex items-center gap-2.5 text-left active:scale-98 min-h-[56px]"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Unggah Gambar</div>
                  <div className="text-[10px] text-slate-400">Pilih dari galeri</div>
                </div>
              </button>
            </div>

            {/* 5. Skeleton Loader during solving */}
            {isSolving && (
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                <div className="h-10 bg-sky-100/50 rounded-2xl w-full" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded-md w-full" />
                  <div className="h-3 bg-slate-100 rounded-md w-4/5" />
                </div>
              </div>
            )}

            {/* 6. Recent History Excerpt Card */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">Riwayat Terakhir</span>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-2">
                  {history.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openResultDetail(item)}
                      className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between cursor-pointer hover:border-sky-100 transition active:scale-98 min-h-[52px]"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] uppercase font-bold text-slate-400">
                            {item.subject}
                          </span>
                          <span className="text-[9px] text-slate-300">•</span>
                          <span className="text-[9px] font-bold text-sky-600">
                            {item.shortAnswer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium line-clamp-1">
                          {item.questionExtracted}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: RIWAYAT (HISTORY)
           ══════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-800">Riwayat Soal ({history.length})</h2>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-xl transition min-h-[36px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-2xs space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
                  <HistoryIcon className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-700">Belum Ada Riwayat</div>
                <p className="text-[11px] text-slate-400">
                  Tandai teks atau scan kamera untuk menyimpan solusi di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openResultDetail(item)}
                    className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-sky-100 transition active:scale-98 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 uppercase">
                        {item.subject}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 line-clamp-2">
                      {item.questionExtracted}
                    </p>

                    <div className="text-xs font-bold text-slate-900 bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                      <span className="line-clamp-1">{item.shortAnswer}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3: PENGATURAN (SETTINGS)
           ══════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-slate-800 px-1">Pengaturan Aplikasi</h2>

            {/* AI Gateway Section */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Mesin AI & Mode Jawaban
              </span>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Google Gemini Flash</div>
                  <div className="text-[10px] text-slate-400">Multimodal Text & Vision OCR</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>

              {/* Mode Selector */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-700 font-semibold block mb-2">Mode Penyelesaian</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSolveMode('QUICK')}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border transition text-left min-h-[44px] ${
                      solveMode === 'QUICK'
                        ? 'bg-sky-50 border-sky-400 text-sky-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs">Quick Solve</div>
                      <div className="text-[9px] text-slate-400 font-normal">Kunci Opsi Singkat</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSolveMode('LEARN')}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border transition text-left min-h-[44px] ${
                      solveMode === 'LEARN'
                        ? 'bg-sky-50 border-sky-400 text-sky-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs">Learn Mode</div>
                      <div className="text-[9px] text-slate-400 font-normal">Langkah & Penjelasan</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Toggles Native iOS/Android Style */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Preferensi Tampilan
              </span>

              {/* Toggle 1: Heads-up Notification */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-700 font-semibold block">Notifikasi Pop-up (Heads-up)</span>
                  <span className="text-[10px] text-slate-400">Banner meluncur turun saat klik "Ask"</span>
                </div>
                <button
                  onClick={() => setToggleNotif(!toggleNotif)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-0.8 min-h-[44px] min-w-[48px] ${
                    toggleNotif ? 'bg-sky-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Toggle 2: Auto-Copy */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-700 font-semibold block">Auto-Copy Hasil Jawaban</span>
                  <span className="text-[10px] text-slate-400">Otomatis salin jawaban singkat ke clipboard</span>
                </div>
                <button
                  onClick={() => setToggleAutoCopy(!toggleAutoCopy)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-0.8 min-h-[44px] min-w-[48px] ${
                    toggleAutoCopy ? 'bg-sky-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Toggle 3: Haptic Feedback */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-700 font-semibold block">Getar / Haptic Touch</span>
                  <span className="text-[10px] text-slate-400">Respon getar saat tombol ditekan</span>
                </div>
                <button
                  onClick={() => setToggleHaptic(!toggleHaptic)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-0.8 min-h-[44px] min-w-[48px] ${
                    toggleHaptic ? 'bg-sky-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* About DaneX */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center space-y-1">
              <div className="text-xs font-bold text-slate-800">DaneX Study Assistant v1.0.0</div>
              <p className="text-[10px] text-slate-400">Clean Native Mobile Architecture • PWA & APK</p>
            </div>
          </div>
        )}

      </main>

      {/* Hidden File Input for Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleGalleryUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ── Native Bottom Navigation Bar with Elevated Center Scan Action ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 max-w-lg mx-auto pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
        <div className="h-16 flex items-center justify-around px-2 relative">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => {
              setActiveTab('home');
              setSelectedResult(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] transition ${
              activeTab === 'home' ? 'text-sky-500 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HomeIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* Tab 2: Center Elevated Scan Action (Hero FAB) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => setIsWebcamOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/30 flex items-center justify-center transition active:scale-90 border-4 border-white"
              aria-label="Scan Kamera Soal"
            >
              <Camera className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-bold text-slate-700 mt-1">Scan</span>
          </div>

          {/* Tab 3: History */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] transition ${
              activeTab === 'history' ? 'text-sky-500 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HistoryIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">History</span>
          </button>

          {/* Tab 4: Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] transition ${
              activeTab === 'settings' ? 'text-sky-500 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Settings</span>
          </button>

        </div>
      </nav>

      {/* ── Native Result Bottom Sheet ── */}
      <ResultBottomSheet
        result={selectedResult}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      />

      {/* ── Camera & Crop Modals ── */}
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
