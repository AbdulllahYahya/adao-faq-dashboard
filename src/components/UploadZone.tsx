'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv'];

export function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  function isValidFile(file: File): boolean {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (selectedFile) {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-soft)' }}
        >
          <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {selectedFile.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatSize(selectedFile.size)}
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone p-12 flex flex-col items-center justify-center text-center cursor-pointer ${
        dragOver ? 'dragover' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="w-10 h-10 mb-3" style={{ color: 'var(--accent)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Drop your file here or click to browse
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
        Supports PDF, DOCX, TXT, CSV files
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={Object.values(ACCEPTED_TYPES).join(',')}
        onChange={handleFileChange}
      />
    </div>
  );
}
