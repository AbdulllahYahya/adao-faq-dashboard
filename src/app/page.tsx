'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { UploadZone } from '@/components/UploadZone';
import { TextPasteArea } from '@/components/TextPasteArea';
import { FAQGeneratorPanel } from '@/components/FAQGeneratorPanel';
import { FileText, HelpCircle, Clock, CheckCircle, Upload, Type, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GeneratedFAQ } from '@/lib/types';

type InputTab = 'file' | 'text';
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

  // Stats
  const [stats, setStats] = useState({ documents: 0, faqs: 0, draft: 0, published: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/faqs?status=all');
      if (res.ok) {
        const data = await res.json();
        const allFaqs = Array.isArray(data) ? data : [];
        const documentIds = new Set(allFaqs.map((f: { document_id: string }) => f.document_id).filter(Boolean));
        setStats({
          documents: documentIds.size,
          faqs: allFaqs.length,
          draft: allFaqs.filter((f: { status: string }) => f.status === 'draft').length,
          published: allFaqs.filter((f: { status: string }) => f.status === 'published').length,
        });
      }
    } catch {
      // Stats are non-critical
    }
  }

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
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
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
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      setState('saved');
      toast.success(`Saved ${selectedFaqs.length} FAQs to database`);
      fetchStats();

      // Reset after a moment
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

  const statCards = [
    { title: 'Documents', value: stats.documents, icon: FileText, color: 'var(--accent)' },
    { title: 'Total FAQs', value: stats.faqs, icon: HelpCircle, color: 'var(--accent-secondary)' },
    { title: 'Draft', value: stats.draft, icon: Clock, color: 'var(--amber)' },
    { title: 'Published', value: stats.published, icon: CheckCircle, color: 'var(--green)' },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          FAQ Generator
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Upload a document or paste text to generate FAQs with AI
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="card-primary p-5 hover-lift">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {stat.title}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
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
            </div>

            {/* Content */}
            {tab === 'file' ? (
              <UploadZone
                onFileSelect={setFile}
                selectedFile={file}
                onClear={() => setFile(null)}
              />
            ) : (
              <TextPasteArea value={text} onChange={setText} />
            )}

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

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={state === 'processing'}
              className="mt-5 flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 hover-lift"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {state === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating FAQs...
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4" />
                  Generate FAQs
                </>
              )}
            </button>
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
            FAQs saved successfully! Redirecting...
          </p>
        </div>
      )}
    </Layout>
  );
}
