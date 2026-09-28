import { useState, useEffect } from 'react';
import {
  Sparkles,
  Monitor,
  Smartphone,
  History as HistoryIcon,
} from 'lucide-react';
import type { SolveMode, SolveResult, SolveStatus, UsageStats } from './shared/types/solver.types';
import { SolverApiClient } from './shared/api-client/solver.client';
import { DesktopDashboard } from './modules/solver/components/DesktopDashboard';
import { MobileSimulator } from './modules/solver/components/MobileSimulator';
import { HistoryDrawer } from './modules/solver/components/HistoryDrawer';
import { PwaInstallBanner } from './modules/common/components/PwaInstallBanner';

const LOCAL_STORAGE_HISTORY_KEY = 'danex_web_history';

function isMobileClient(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function App() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(() => {
    return isMobileClient() ? 'mobile' : 'desktop';
  });
  const [inputText, setInputText] = useState('');
  const [solveMode, setSolveMode] = useState<SolveMode>('QUICK');
  const [status, setStatus] = useState<SolveStatus>('IDLE');
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Local storage history
  const [history, setHistory] = useState<SolveResult[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Check health and usage
  const refreshBackendData = async () => {
    const healthy = await SolverApiClient.checkHealth();
    setIsBackendOnline(healthy);
    const stats = await SolverApiClient.getUsageStats();
    setUsageStats(stats);
  };

  useEffect(() => {
    refreshBackendData();
    const interval = setInterval(refreshBackendData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSolveText = async () => {
    if (!inputText.trim()) return;
    setError(null);
    setStatus('READING');

    try {
      await new Promise((r) => setTimeout(r, 200));
      setStatus('UNDERSTANDING');
      await new Promise((r) => setTimeout(r, 250));
      setStatus('SOLVING');

      const solveResponse = await SolverApiClient.solveText(
        inputText.trim(),
        solveMode,
        'id',
        viewMode === 'desktop' ? 'DESKTOP_WEB' : 'MOBILE_SIMULATOR'
      );

      setStatus('VERIFYING');
      await new Promise((r) => setTimeout(r, 150));

      setResult(solveResponse);
      setStatus('SUCCESS');

      // Save to history
      setHistory((prev) => [solveResponse, ...prev.filter((h) => h.id !== solveResponse.id)]);
      refreshBackendData();
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || 'Gagal menghubungi server penyelesai.');
    }
  };

  const handleSolveVision = async (base64Image: string, prompt?: string) => {
    setError(null);
    setStatus('READING');

    try {
      await new Promise((r) => setTimeout(r, 200));
      setStatus('UNDERSTANDING');
      await new Promise((r) => setTimeout(r, 300));
      setStatus('SOLVING');

      const solveResponse = await SolverApiClient.solveVision(
        base64Image,
        'image/jpeg',
        prompt || inputText || 'Selesaikan soal dalam gambar',
        solveMode,
        'id'
      );

      setStatus('VERIFYING');
      await new Promise((r) => setTimeout(r, 150));

      setResult(solveResponse);
      setStatus('SUCCESS');

      // Save to history
      setHistory((prev) => [solveResponse, ...prev.filter((h) => h.id !== solveResponse.id)]);
      refreshBackendData();
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || 'Gagal memproses visual via Vision AI.');
    }
  };

  const loadPreset = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900 relative overflow-x-hidden">
      {/* ── PWA Quick Install Banner ── */}
      <PwaInstallBanner />

      {/* ── Soft Ambient Pastel Illustration Shapes (matching Behance presentation) ── */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500 flex items-center justify-center font-black text-sm text-white shadow-sm shadow-sky-500/20">
              DX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">DaneX</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  Study Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Select. Scan. Solve.</p>
            </div>
          </div>

          {/* Center Viewport Switcher (Only on Desktop/Laptops) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'desktop'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Tampilan Desktop</span>
            </button>

            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'mobile'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulasi HP Android</span>
            </button>
          </div>

          {/* Right Actions: Status + History Drawer Toggle */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isBackendOnline
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
              />
              <span className="hidden sm:inline">{isBackendOnline ? 'Server Online' : 'Offline'}</span>
            </div>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="relative p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition"
              title="Buka Riwayat Soal"
            >
              <HistoryIcon className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Preset Questions Chips Bar ── */}
      <div className="bg-white/60 border-b border-slate-200/60 py-2.5 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-500" /> Contoh Soal Cepat:
          </span>
          <button
            onClick={() => loadPreset('Organel sel manakah yang berfungsi menghasilkan energi utama berupa ATP? A. Nukleus B. Ribosom C. Mitokondria D. Lisosom E. Badan Golgi')}
            className="text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition flex-shrink-0"
          >
            🧬 Biologi (MCQ Sel)
          </button>
          <button
            onClick={() => loadPreset('Tentukan akar-akar persamaan kuadrat x^2 - 5x + 6 = 0')}
            className="text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition flex-shrink-0"
          >
            📐 Matematika (Kuadrat & LaTeX)
          </button>
          <button
            onClick={() => loadPreset('Setarakan persamaan reaksi kimia pembakaran hidrogen: H2 + O2 -> H2O')}
            className="text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition flex-shrink-0"
          >
            🧪 Kimia (Reaksi Setara)
          </button>
          <button
            onClick={() => loadPreset('Buat fungsi Python untuk menghitung total elemen array/list numerik')}
            className="text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition flex-shrink-0"
          >
            💻 Pemrograman (Python)
          </button>
        </div>
      </div>

      {/* ── Main Content Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {viewMode === 'desktop' ? (
          <DesktopDashboard
            inputText={inputText}
            setInputText={setInputText}
            solveMode={solveMode}
            setSolveMode={setSolveMode}
            status={status}
            result={result}
            error={error}
            onSolveText={handleSolveText}
            onSolveVision={handleSolveVision}
            usageStats={usageStats}
            onRefreshStats={refreshBackendData}
          />
        ) : (
          <MobileSimulator
            inputText={inputText}
            setInputText={setInputText}
            solveMode={solveMode}
            setSolveMode={setSolveMode}
            status={status}
            result={result}
            error={error}
            onSolveText={handleSolveText}
            onSolveVision={handleSolveVision}
            history={history}
            onSelectHistory={(item) => setResult(item)}
            onClearHistory={() => setHistory([])}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="py-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
        DaneX Universal Study Assistant • Clean Native Mobile & Desktop Edition
      </footer>

      {/* ── History Drawer ── */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(item) => {
          setResult(item);
          setInputText(item.questionExtracted);
        }}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}

export default App;
