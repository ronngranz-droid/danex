import React, { useState } from 'react';
import {
  Camera,
  Crop,
  History,
  Settings,
  Home,
  Send,
  Sparkles,
  ClipboardPaste,
  ChevronLeft,
  Copy,
  Check,
  Zap,
  BookOpen,
} from 'lucide-react';
import type { SolveMode, SolveResult, SolveStatus } from '../../../shared/types/solver.types';
import { SolverApiClient } from '../../../shared/api-client/solver.client';
import { KatexRenderer } from './KatexRenderer';
import { CodeSnippetViewer } from './CodeSnippetViewer';
import { OptionListSelector } from './OptionListSelector';
import { WebcamCaptureModal } from './WebcamCaptureModal';
import { ScreenCropModal } from './ScreenCropModal';
import { HeadsUpNotification } from './HeadsUpNotification';
import { TextSelectionPlayground } from './TextSelectionPlayground';
import { AlertCircle } from 'lucide-react';

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
  const [viewingDetail, setViewingDetail] = useState<SolveResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Heads-up Notification State for "Mark Teks -> Ask -> Notifikasi Muncul"
  const [notifResult, setNotifResult] = useState<SolveResult | null>(null);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Settings Toggles State
  const [toggleNotif, setToggleNotif] = useState(true);
  const [toggleOcr, setToggleOcr] = useState(true);
  const [toggleSecure, setToggleSecure] = useState(true);
  const [toggleFloating, setToggleFloating] = useState(true);

  const handleAskSelection = async (selectedText: string) => {
    setIsNotifLoading(true);
    setIsNotifOpen(true);
    try {
      const res = await SolverApiClient.solveText(
        selectedText,
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeResult = viewingDetail || result;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      {/* ── Android Phone Bezel Frame (Clean Minimal Light Chassis) ── */}
      <div className="relative w-[375px] h-[750px] bg-[#F4F6FA] border-[10px] border-white rounded-[50px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-200/80">
        
        {/* Top Status Bar */}
        <div className="h-8 bg-[#F4F6FA] flex items-center justify-between px-7 pt-2 text-[11px] text-slate-600 select-none z-20 font-medium">
          <span>09:41</span>
          <div className="w-16 h-3.5 bg-slate-200/80 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* ── Screen Viewport Content ── */}
        <div className="flex-1 bg-[#F4F6FA] overflow-y-auto relative flex flex-col">
          
          {/* Heads-up System Notification (Android Popup on "Ask") */}
          {isNotifOpen && (
            <HeadsUpNotification
              result={notifResult}
              isLoading={isNotifLoading}
              onClose={() => setIsNotifOpen(false)}
              onOpenDetail={(item) => {
                setViewingDetail(item);
                setActiveTab('home');
              }}
            />
          )}

          {/* Top Header */}
          <div className="px-5 py-3.5 bg-[#F4F6FA]/90 backdrop-blur-xs flex items-center justify-between sticky top-0 z-10">
            {activeResult && activeTab === 'home' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingDetail(null)}
                  className="p-1 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-sky-500">Hasil Solusi</h1>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <h1 className="text-base font-bold text-sky-500 tracking-tight">
                  {activeTab === 'home' ? 'DaneX' : activeTab === 'history' ? 'Riwayat' : 'Settings'}
                </h1>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
            )}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 px-4 py-2 space-y-4">
            
            {/* ════ TAB: BERANDA (HOME) ════ */}
            {activeTab === 'home' && (
              <>
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {isSolving ? (
                  <div className="py-20 text-center space-y-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto animate-pulse">
                      <Sparkles className="w-7 h-7 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">{status}...</p>
                      <p className="text-[11px] text-slate-400">Sedang menyelesaikan soal akademis...</p>
                    </div>
                  </div>
                ) : activeResult ? (
                  <div className="space-y-3 pb-16 animate-in fade-in duration-200">
                    
                    {/* Solution Card */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                          {activeResult.subject}
                        </span>
                        <button
                          onClick={() => handleCopy(`${activeResult.shortAnswer || activeResult.answer}\n\n${activeResult.explanation}`)}
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 transition"
                        >
                          {copied ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          <span>{copied ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>

                      {/* Question Preview */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed">
                        {activeResult.questionExtracted}
                      </div>

                      {/* Option List (if MCQ) */}
                      <OptionListSelector options={activeResult.options} answerOption={activeResult.answerOption} />

                      {/* Verified Answer Highlight */}
                      <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Jawaban</div>
                        <div className="text-sm font-bold text-slate-900 leading-snug">
                          {activeResult.shortAnswer || activeResult.answer}
                        </div>
                      </div>

                      {/* KaTeX Math Formula */}
                      {activeResult.latex && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Formula LaTeX</div>
                          <KatexRenderer latex={activeResult.latex} />
                        </div>
                      )}

                      {/* Code Snippet */}
                      {activeResult.codeSnippet && <CodeSnippetViewer codeSnippet={activeResult.codeSnippet} />}

                      {/* Explanation */}
                      {activeResult.explanation && (
                        <div className="space-y-1 pt-1 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penjelasan</div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {activeResult.explanation}
                          </p>
                        </div>
                      )}

                      {/* Steps (Learn mode) */}
                      {activeResult.steps && activeResult.steps.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Langkah Penyelesaian ({activeResult.steps.length})
                          </div>
                          <div className="space-y-1.5">
                            {activeResult.steps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="flex-1 leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setViewingDetail(null)}
                      className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-2xl shadow-xs hover:bg-slate-50 transition"
                    >
                      ← Kembali ke Input
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ── Feature Highlight: Mark Teks Biru & Muncul Notifikasi ── */}
                    <TextSelectionPlayground onAskSelection={handleAskSelection} />

                    {/* ── Group 1: Quick Action Cards (Foto Soal & Tangkap Layar) ── */}
                    <div className="bg-white rounded-3xl p-1.5 shadow-sm border border-slate-100 divide-y divide-slate-100">
                      
                      {/* Action 1: Foto Soal */}
                      <div
                        onClick={() => setIsWebcamOpen(true)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-2xs">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Foto Soal</div>
                            <div className="text-[10px] text-slate-400">Pindai buku atau tugas</div>
                          </div>
                        </div>
                        <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                      </div>

                      {/* Action 2: Tangkap Layar */}
                      <div
                        onClick={() => setIsCropModalOpen(true)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-2xs">
                            <Crop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Tangkap Layar</div>
                            <div className="text-[10px] text-slate-400">Tarik kotak seleksi</div>
                          </div>
                        </div>
                        <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                      </div>
                    </div>

                    {/* ── Group 2: Input Soal (Behance Community section style) ── */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                        INPUT PERTANYAAN
                      </div>

                      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
                        {/* Mode switchers */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Teks / Soal</span>
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[10px]">
                            <button
                              onClick={() => setSolveMode('QUICK')}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                solveMode === 'QUICK' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                              }`}
                            >
                              <Zap className="w-2.5 h-2.5 inline mr-0.5" /> Quick
                            </button>
                            <button
                              onClick={() => setSolveMode('LEARN')}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                solveMode === 'LEARN' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                              }`}
                            >
                              <BookOpen className="w-2.5 h-2.5 inline mr-0.5" /> Learn
                            </button>
                          </div>
                        </div>

                        {/* Textarea */}
                        <textarea
                          rows={3}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Tempel atau ketik soal di sini..."
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none leading-relaxed transition"
                        />

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePaste}
                            className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 shadow-2xs transition"
                          >
                            <ClipboardPaste className="w-3 h-3 text-slate-500" />
                            Tempel
                          </button>
                          <button
                            onClick={onSolveText}
                            disabled={!inputText.trim() || isSolving}
                            className="flex-1 py-2 px-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            Selesaikan Soal
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Group 3: Recent History preview ── */}
                    {history.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                          <span>RIWAYAT TERBARU</span>
                          <button
                            onClick={() => setActiveTab('history')}
                            className="text-sky-500 hover:underline capitalize"
                          >
                            Lihat Semua
                          </button>
                        </div>
                        <div className="bg-white rounded-3xl p-1.5 shadow-sm border border-slate-100 divide-y divide-slate-100">
                          {history.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setViewingDetail(item);
                                onSelectHistory(item);
                              }}
                              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition"
                            >
                              <div className="space-y-0.5 flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {item.subject}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-800 truncate">
                                    {item.shortAnswer || item.answer}
                                  </span>
                                </div>
                                <p className="text-slate-400 line-clamp-1 text-[11px]">{item.questionExtracted}</p>
                              </div>
                              <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ════ TAB: RIWAYAT (HISTORY) ════ */}
            {activeTab === 'history' && (
              <div className="space-y-3 pb-16">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    SEMUA RIWAYAT ({history.length})
                  </span>
                  {history.length > 0 && (
                    <button
                      onClick={onClearHistory}
                      className="text-[11px] text-red-500 font-semibold hover:underline"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl p-6 border border-slate-100 text-slate-400 text-xs">
                    Belum ada riwayat soal yang tersimpan.
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-1.5 shadow-sm border border-slate-100 divide-y divide-slate-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setViewingDetail(item);
                          onSelectHistory(item);
                          setActiveTab('home');
                        }}
                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="space-y-1 flex-1 pr-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {item.subject}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium line-clamp-2 text-xs">{item.questionExtracted}</p>
                          <div className="text-blue-600 font-bold text-xs">{item.shortAnswer || item.answer}</div>
                        </div>
                        <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ TAB: PENGATURAN (SETTINGS - Behance Right Screen Replica) ════ */}
            {activeTab === 'settings' && (
              <div className="space-y-4 pb-16">
                
                {/* Section 1: Navigation Links with >> */}
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer rounded-2xl transition">
                    <span>Edit profil</span>
                    <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer rounded-2xl transition">
                    <span>Change Password</span>
                    <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer rounded-2xl transition">
                    <span>Change language</span>
                    <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer rounded-2xl transition">
                    <span>Change location</span>
                    <span className="text-slate-300 font-semibold text-xs tracking-tighter">&gt;&gt;</span>
                  </div>
                </div>

                {/* Section 2: Toggle Switches (Replicating the Behance Switch Card) */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-4">
                  
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Receive notification</span>
                    <button
                      onClick={() => setToggleNotif(!toggleNotif)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        toggleNotif ? 'bg-sky-400 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-600 font-medium">Receive newsletters</span>
                    <button
                      onClick={() => setToggleOcr(!toggleOcr)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        toggleOcr ? 'bg-sky-400 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-600 font-medium">Receive special offers</span>
                    <button
                      onClick={() => setToggleSecure(!toggleSecure)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        toggleSecure ? 'bg-sky-400 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Toggle 4 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-600 font-medium">Receive Updates</span>
                    <button
                      onClick={() => setToggleFloating(!toggleFloating)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        toggleFloating ? 'bg-sky-400 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>

                {/* About DaneX */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-800">DaneX v1.0.0</div>
                  <p className="text-[11px] text-slate-400">Universal Study Assistant • Clean Native Edition</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Floating "DX" Quick Trigger ── */}
          <button
            onClick={() => setIsCropModalOpen(true)}
            className="absolute bottom-20 right-4 w-11 h-11 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 flex items-center justify-center font-bold text-xs transition active:scale-95 z-30"
            title="Floating Quick Capture Trigger"
          >
            DX
          </button>

          {/* ── Bottom Navigation Bar (Clean Minimal Behance style) ── */}
          <div className="h-16 bg-white border-t border-slate-100 flex items-center justify-around px-4 sticky bottom-0 z-20 text-[10px]">
            
            <button
              onClick={() => {
                setActiveTab('home');
                setViewingDetail(null);
              }}
              className={`flex flex-col items-center gap-1 transition ${
                activeTab === 'home' ? 'text-slate-800 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setIsWebcamOpen(true)}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-1 transition ${
                activeTab === 'history' ? 'text-slate-800 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 transition ${
                activeTab === 'settings' ? 'text-slate-800 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Setting</span>
            </button>
          </div>

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
