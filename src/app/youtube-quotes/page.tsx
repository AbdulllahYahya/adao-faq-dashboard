'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Youtube, Loader2, Quote, Copy, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { YouTubeQuote } from '@/lib/types';

type PageState = 'idle' | 'processing' | 'results';

export default function YouTubeQuotesPage() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<PageState>('idle');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [quotes, setQuotes] = useState<YouTubeQuote[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleExtract() {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setState('processing');

    try {
      const res = await fetch('/api/youtube-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to extract quotes');
      }

      const data = await res.json();
      setVideoTitle(data.videoTitle);
      setVideoUrl(data.videoUrl);
      setVideoId(data.videoId);
      setQuotes(data.quotes);
      setState('results');
      toast.success(`Extracted ${data.quotes.length} quotes`);
    } catch (error) {
      setState('idle');
      toast.error(error instanceof Error ? error.message : 'Failed to extract quotes');
    }
  }

  function handleCopyQuote(quote: YouTubeQuote, index: number) {
    const text = `"${quote.quote}"\n— ${videoTitle} (${quote.timestamp})\n${videoUrl}&t=${timestampToSeconds(quote.timestamp)}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Quote copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleCopyAll() {
    const selected = quotes.filter((q) => q.selected);
    if (selected.length === 0) {
      toast.error('No quotes selected');
      return;
    }
    const text = selected
      .map((q) => `"${q.quote}"\n— ${videoTitle} (${q.timestamp})`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${selected.length} quotes`);
  }

  function handleReset() {
    setState('idle');
    setUrl('');
    setQuotes([]);
    setVideoTitle('');
    setVideoUrl('');
    setVideoId('');
  }

  function toggleQuote(index: number) {
    const updated = [...quotes];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setQuotes(updated);
  }

  const selectedCount = quotes.filter((q) => q.selected).length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          YouTube Quotes
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Extract powerful quotes with timestamps from any YouTube video
        </p>
      </div>

      {/* Input Section */}
      {(state === 'idle' || state === 'processing') && (
        <div className="card-primary p-6 mb-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 0, 0, 0.12)' }}
              >
                <Youtube className="w-4 h-4" style={{ color: '#FF0000' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Paste YouTube URL
                </h2>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  The video must have captions/subtitles enabled
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !state.includes('processing') && handleExtract()}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 text-sm rounded-xl border"
                disabled={state === 'processing'}
              />
              <button
                onClick={handleExtract}
                disabled={state === 'processing'}
                className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm whitespace-nowrap"
              >
                {state === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Quote className="w-4 h-4" />
                    Extract Quotes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Skeleton */}
      {state === 'processing' && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {state === 'results' && (
        <div>
          {/* Video Info Bar */}
          <div className="card-secondary p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {videoId && (
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt=""
                    className="w-20 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {videoTitle}
                  </p>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-1 hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open on YouTube
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyAll}
                  disabled={selectedCount === 0}
                  className="btn-primary flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy {selectedCount} Quote{selectedCount !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  New Video
                </button>
              </div>
            </div>
          </div>

          {/* Quotes List */}
          <div className="space-y-3">
            {quotes.map((quote, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                className="card-tertiary p-5 group"
                style={{
                  opacity: quote.selected ? 1 : 0.5,
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Select checkbox */}
                  <button
                    onClick={() => toggleQuote(index)}
                    className="mt-1 flex-shrink-0 transition-colors"
                    style={{ color: quote.selected ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {quote.selected ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--text-muted)' }} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Quote */}
                    <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent)', fontSize: '1.2em', fontWeight: 700 }}>&ldquo;</span>
                      {quote.quote}
                      <span style={{ color: 'var(--accent)', fontSize: '1.2em', fontWeight: 700 }}>&rdquo;</span>
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`${videoUrl}&t=${timestampToSeconds(quote.timestamp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full hover:brightness-125 transition-all"
                        style={{ background: 'rgba(255, 0, 0, 0.1)', color: '#FF4444' }}
                      >
                        <Clock className="w-3 h-3" />
                        {quote.timestamp}
                      </a>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {quote.context}
                      </span>
                    </div>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => handleCopyQuote(quote, index)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors opacity-50 group-hover:opacity-100 flex-shrink-0"
                    style={{ color: copiedIndex === index ? 'var(--green)' : 'var(--text-muted)' }}
                    title="Copy quote"
                  >
                    {copiedIndex === index ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

function timestampToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}
