'use client';

import { X } from 'lucide-react';

interface TextPasteAreaProps {
  value: string;
  onChange: (text: string) => void;
}

export function TextPasteArea({ value, onChange }: TextPasteAreaProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your document text here..."
        rows={8}
        className="w-full p-4 text-sm resize-none rounded-xl border"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-strong)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {value.length.toLocaleString()} characters
        </p>
        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
