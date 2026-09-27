import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import type { CodeSnippet } from '../../../shared/types/solver.types';

interface CodeSnippetViewerProps {
  codeSnippet: CodeSnippet;
}

export const CodeSnippetViewer: React.FC<CodeSnippetViewerProps> = ({ codeSnippet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 my-3 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100/80 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
            {codeSnippet.language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-blue-600 font-medium text-[11px]">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 text-[11px]">Salin</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono text-slate-800 overflow-x-auto leading-relaxed bg-slate-50/50">
        <code>{codeSnippet.code}</code>
      </pre>
    </div>
  );
};
