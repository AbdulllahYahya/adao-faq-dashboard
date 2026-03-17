'use client';

import { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { UploadZone } from '@/components/UploadZone';
import { TextPasteArea } from '@/components/TextPasteArea';
import { FAQGeneratorPanel } from '@/components/FAQGeneratorPanel';
import { Sparkles, Upload, Type, Loader2, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { GeneratedFAQ } from '@/lib/types';

type InputTab = 'file' | 'text' | 'import';
type PageState = 'idle' | 'processing' | 'review' | 'saving' | 'saved';

export default function Home() {
  const [tab, setTab] = useState<InputTab>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [state, setState] = useState<PageState>('idle');

  // Generated results
  const [faqs, setFaqs] = useState<GeneratedFAQ[]>([]);
  const [category, setCategory] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);

  // CSV import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    const hasContent = tab === 'file' ? file : text.trim().length >= 50;
    if (!hasContent) {
      toast.error(tab === 'file' ? 'Please select a file' : 'Please enter at least 50 characters');
      return;
    }

    setState('processing');

    try {
      const formData = new FormData();
      if (tab === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }
      if (title) formData.append('title', title);
      if (link) formData.append('link', link);

      const res = await fetch('/api/generate', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Generation failed');
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      const data = await res.json();
      setFaqs(data.faqs);
      setCategory(data.category);
      setDocumentId(data.document_id);
      setState('review');
      toast.success(`Generated ${data.faqs.length} FAQs`);
    } catch (error) {
      setState('idle');
      toast.error(error instanceof Error ? error.message : 'Failed to generate FAQs');
    }
  }

  async function handleSave() {
    const selectedFaqs = faqs.filter((f) => f.selected);
    if (selectedFaqs.length === 0) {
      toast.error('Please select at least one FAQ to save');
      return;
    }

    setState('saving');

    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          faqs: selectedFaqs.map((f) => ({ question: f.question, answer: f.answer })),
          link: link || null,
          category,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Save failed');
      }

      setState('saved');
      toast.success(`Saved ${selectedFaqs.length} FAQs`);

      setTimeout(() => {
        setState('idle');
        setFaqs([]);
        setFile(null);
        setText('');
        setLink('');
        setTitle('');
        setCategory('');
        setDocumentId(null);
      }, 2000);
    } catch (error) {
      setState('review');
      toast.error(error instanceof Error ? error.message : 'Failed to save FAQs');
    }
  }

  async function handleCsvImport() {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const res = await fetch('/api/import', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Import failed');
      }

      const data = await res.json();
      setImportResult(data);
      toast.success(`Imported ${data.imported} FAQs`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Generate FAQs
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Upload a document, paste text, or import FAQs from CSV
        </p>
      </div>

      {/* Input Section */}
      {(state === 'idle' || state === 'processing') && (
        <div className="card-primary p-6 mb-6">
          <div className="relative z-10">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-5">
              <button
                onClick={() => setTab('file')}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: tab === 'file' ? 'var(--accent-soft)' : 'transparent',
                  color: tab === 'file' ? 'var(--accent-light)' : 'var(--text-tertiary)',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
              <button
                onClick={() => setTab('text')}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: tab === 'text' ? 'var(--accent-soft)' : 'transparent',
                  color: tab === 'text' ? 'var(--accent-light)' : 'var(--text-tertiary)',
                }}
              >
                <Type className="w-3.5 h-3.5" />
                Paste Text
              </button>
              <button
                onClick={() => setTab('import')}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: tab === 'import' ? 'var(--green-soft)' : 'transparent',
                  color: tab === 'import' ? 'var(--green)' : 'var(--text-tertiary)',
                }}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Import CSV
              </button>
            </div>

            {/* Content */}
            {tab === 'file' ? (
              <>
                <UploadZone
                  onFileSelect={setFile}
                  selectedFile={file}
                  onClear={() => setFile(null)}
                />

                {/* Title + Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Document title..."
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Source Link (optional)
                    </label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={state === 'processing'}
                  className="btn-primary mt-5 flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm"
                >
                  {state === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating FAQs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate FAQs
                    </>
                  )}
                </button>
              </>
            ) : tab === 'text' ? (
              <>
                <TextPasteArea value={text} onChange={setText} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Document title..."
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Source Link (optional)
                    </label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={state === 'processing'}
                  className="btn-primary mt-5 flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm"
                >
                  {state === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating FAQs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate FAQs
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Import CSV Tab */
              <>
                <div className="mb-4">
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Import FAQs directly from a CSV file. Expected columns: <strong>FAQ</strong>, <strong>ANSWER</strong>, <strong>URL</strong>, <strong>CATEGORY</strong>. Rows without a question or answer are skipped.
                  </p>

                  {csvFile ? (
                    <div
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--green-soft)' }}
                      >
                        <FileSpreadsheet className="w-5 h-5" style={{ color: 'var(--green)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {csvFile.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {(csvFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => { setCsvFile(null); setImportResult(null); }}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-zone p-12 flex flex-col items-center justify-center text-center cursor-pointer"
                      onClick={() => csvInputRef.current?.click()}
                    >
                      <FileSpreadsheet className="w-10 h-10 mb-3" style={{ color: 'var(--green)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Click to select your CSV file
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Columns: FAQ, ANSWER, URL, CATEGORY
                      </p>
                      <input
                        ref={csvInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setCsvFile(f); setImportResult(null); }
                        }}
                      />
                    </div>
                  )}
                </div>

                {importResult && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl mb-4"
                    style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--green)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--green)' }}>
                        Import complete
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {importResult.imported} FAQs imported, {importResult.skipped} rows skipped (out of {importResult.total} total rows)
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCsvImport}
                  disabled={importing || !csvFile}
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Import FAQs
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Processing Skeleton */}
      {state === 'processing' && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {(state === 'review' || state === 'saving' || state === 'saved') && (
        <FAQGeneratorPanel
          faqs={faqs}
          category={category}
          documentId={documentId}
          link={link}
          onFaqsChange={setFaqs}
          onSave={handleSave}
          saving={state === 'saving'}
        />
      )}

      {/* Saved Success */}
      {state === 'saved' && (
        <div className="card-secondary p-4 mt-4 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--green)' }}>
            FAQs saved successfully!
          </p>
        </div>
      )}
    </Layout>
  );
}
