import React, { useMemo } from 'react';
import katex from 'katex';

interface KatexRendererProps {
  latex: string;
  displayMode?: boolean;
}

export const KatexRenderer: React.FC<KatexRendererProps> = ({ latex, displayMode = true }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [latex, displayMode]);

  if (!html) {
    return <code className="text-blue-600 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{latex}</code>;
  }

  return (
    <div
      className="overflow-x-auto py-2 my-1 text-slate-800 text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
