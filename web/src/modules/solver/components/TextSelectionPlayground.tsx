import React, { useState, useRef } from 'react';
import { Sparkles, HelpCircle, ArrowUpRight } from 'lucide-react';

interface TextSelectionPlaygroundProps {
  onAskSelection: (selectedText: string) => void;
}

const SAMPLE_EXAM_QUESTIONS = [
  {
    id: 1,
    title: 'Biologi - Organel Sel & Metabolisme',
    content:
      'Organel sel manakah yang memiliki membran ganda dan berfungsi utama dalam respirasi seluler untuk menghasilkan energi ATP? Pilihan: A. Nukleus, B. Ribosom, C. Mitokondria, D. Lisosom, E. Badan Golgi.',
  },
  {
    id: 2,
    title: 'Matematika - Persamaan Kuadrat',
    content:
      'Tentukan himpunan penyelesaian dari persamaan kuadrat x^2 - 7x + 12 = 0.',
  },
  {
    id: 3,
    title: 'Fisika - Hukum Gerak Newton',
    content:
      'Sebuah balok bermassa 5 kg ditarik dengan gaya mendatar sebesar 20 N. Jika koefisien gesekan lantai diabaikan, berapakah percepatan balok tersebut?',
  },
  {
    id: 4,
    title: 'Kimia - Ikatan Kimia',
    content:
      'Senyawa NaCl terbentuk melalui ikatan ionik antara atom natrium (Na) yang melepaskan satu elektron dan atom klorin (Cl) yang menerima elektron.',
  },
];

export const TextSelectionPlayground: React.FC<TextSelectionPlaygroundProps> = ({
  onAskSelection,
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setToolbarPos(null);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setToolbarPos(null);
      setSelectedText('');
      return;
    }

    setSelectedText(text);

    // Calculate position for contextual "Ask" toolbar
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setToolbarPos({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 42,
        });
      }
    } catch {
      setToolbarPos(null);
    }
  };

  const handleAsk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedText) {
      onAskSelection(selectedText);
      setToolbarPos(null);
    }
  };

  // Preset quick mark handler
  const handleQuickMark = (text: string) => {
    setSelectedText(text);
    onAskSelection(text);
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      className="relative bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3 selection:bg-sky-200 selection:text-sky-950"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800">Simulasi Tandai Teks (Select & Ask)</span>
            <div className="text-[10px] text-slate-400">Tandai/blok teks biru di bawah lalu tekan "Ask"</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
          Android Feature
        </span>
      </div>

      {/* Floating Contextual Android Toolbar "Ask" */}
      {toolbarPos && selectedText && (
        <div
          style={{
            position: 'absolute',
            left: `${toolbarPos.x}px`,
            top: `${toolbarPos.y}px`,
            transform: 'translateX(-50%)',
          }}
          className="z-40 animate-in zoom-in-90 duration-150"
        >
          <button
            onClick={handleAsk}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-xl ring-2 ring-white/80 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Ask DaneX</span>
          </button>
        </div>
      )}

      {/* Document / Questions Stream */}
      <div className="space-y-2.5 pt-1">
        {SAMPLE_EXAM_QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 transition group"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>{q.title}</span>
              <button
                onClick={() => handleQuickMark(q.content)}
                className="opacity-0 group-hover:opacity-100 transition text-sky-600 hover:underline flex items-center gap-0.5"
                title="Klik untuk langsung tes tanya"
              >
                <span>Tanya Cepat</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-slate-800 leading-relaxed font-medium cursor-text">
              {q.content}
            </p>
          </div>
        ))}
      </div>

      <div className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-start gap-2 text-[11px] text-sky-900">
        <HelpCircle className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong>Cara kerja di HP:</strong> Blok teks apa pun di aplikasi apa pun (Google Docs, browser, chat), menu <strong>"Ask DaneX"</strong> akan muncul otomatis dan jawaban langsung hadir di <strong>Notifikasi HP</strong> tanpa keluar dari aplikasi!
        </p>
      </div>
    </div>
  );
};
