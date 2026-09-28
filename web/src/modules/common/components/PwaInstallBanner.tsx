import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Untuk memasang di HP / Laptop: Buka menu browser (titik tiga) lalu pilih "Tambahkan ke Layar Utama" / "Install DaneX".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold">Install DaneX PWA</span>
          <span className="opacity-90 hidden sm:inline"> — Pasang ke Layar Utama HP / Desktop untuk akses instan & offline</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1 rounded-xl shadow-xs transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
