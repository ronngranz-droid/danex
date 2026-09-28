import { useState, useEffect } from 'react';
import type { SolveMode, SolveResult, SolveStatus } from './shared/types/solver.types';
import { SolverApiClient } from './shared/api-client/solver.client';
import { MobileSimulator } from './modules/solver/components/MobileSimulator';
import { HistoryDrawer } from './modules/solver/components/HistoryDrawer';
import { PwaInstallBanner } from './modules/common/components/PwaInstallBanner';

const LOCAL_STORAGE_HISTORY_KEY = 'danex_web_history';

export function App() {
  const [inputText, setInputText] = useState('');
  const [solveMode, setSolveMode] = useState<SolveMode>('QUICK');
  const [status, setStatus] = useState<SolveStatus>('IDLE');
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  // Check health
  const refreshBackendData = async () => {
    await SolverApiClient.checkHealth();
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
        'MOBILE_SIMULATOR'
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

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 flex flex-col justify-center items-center relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* ── PWA Quick Install Banner ── */}
      <PwaInstallBanner />

      {/* ── Soft Ambient Background ── */}
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-40 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Dedicated Pure Mobile Native App ── */}
      <main className="w-full max-w-md min-h-screen sm:min-h-0 flex flex-col justify-center p-0 sm:py-6">
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
      </main>

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
