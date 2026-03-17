'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, HelpCircle, Sparkles, ArrowUpCircle } from 'lucide-react';
import { FAQCard } from './FAQCard';
import type { FAQ, FAQBucket } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Fundamentals': 'var(--cat-fundamentals)',
  'Exposure Contexts': 'var(--cat-exposure)',
  'Legal & Compensation': 'var(--cat-legal)',
  'Events & Advocacy': 'var(--cat-events)',
  'ADAO Org & Leadership': 'var(--cat-org)',
  'Regulation & Policy': 'var(--cat-regulation)',
  'Health Effects': 'var(--cat-health)',
  'Safety & Abatement': 'var(--cat-safety)',
  'Medical Management': 'var(--cat-medical)',
};

interface FAQListProps {
  onStatsChange?: () => void;
}

export function FAQList({ onStatsChange }: FAQListProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [buckets, setBuckets] = useState<(FAQBucket & { faq_count: number })[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Fetch buckets with counts on mount
  const fetchBuckets = useCallback(() => {
    fetch('/api/buckets')
      .then((res) => res.ok ? res.json() : { buckets: [], totalCount: 0 })
      .then((data) => {
        setBuckets(Array.isArray(data.buckets) ? data.buckets : []);
        setTotalCount(data.totalCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      if (selectedBucket) params.set('bucket_id', selectedBucket);

      const res = await fetch(`/api/faqs?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to fetch');
      }
      const data = await res.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [status, search, selectedBucket]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleUpdate = async (id: string, updates: Partial<FAQ>) => {
    try {
      const res = await fetch(`/api/faqs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to update');
      }
      const updated = await res.json();
      setFaqs((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast.success('FAQ updated');
      onStatsChange?.();
      fetchBuckets();
    } catch {
      toast.error('Failed to update FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to delete');
      }
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success('FAQ deleted');
      onStatsChange?.();
      fetchBuckets();
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  const handlePublishAll = async () => {
    const draftIds = faqs.filter((f) => f.status === 'draft').map((f) => f.id);
    if (draftIds.length === 0) return;

    setPublishing(true);
    try {
      const res = await fetch('/api/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: draftIds, status: 'published' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to publish');
      }
      const updated = await res.json();
      setFaqs((prev) =>
        prev.map((f) => {
          const u = updated.find((u: FAQ) => u.id === f.id);
          return u || f;
        })
      );
      toast.success(`Published ${draftIds.length} FAQs`);
      onStatsChange?.();
      fetchBuckets();
    } catch {
      toast.error('Failed to publish FAQs');
    } finally {
      setPublishing(false);
    }
  };

  const draftCount = faqs.filter((f) => f.status === 'draft').length;

  // Group FAQs by document
  const grouped = faqs.reduce<Record<string, { title: string; faqs: FAQ[] }>>((acc, faq) => {
    const key = faq.document_id || 'no-document';
    const title = faq.document?.title || 'Uncategorized';
    if (!acc[key]) acc[key] = { title, faqs: [] };
    acc[key].faqs.push(faq);
    return acc;
  }, {});

  const selectedBucketName = buckets.find((b) => b.id === selectedBucket)?.name;

  return (
    <div>
      {/* Category Tabs */}
      {buckets.length > 0 && (
        <div className="category-tabs mb-4">
          <button
            onClick={() => setSelectedBucket(null)}
            className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background: !selectedBucket ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: !selectedBucket ? 'var(--accent-light)' : 'var(--text-tertiary)',
              border: `1px solid ${!selectedBucket ? 'var(--border-accent)' : 'var(--border)'}`,
            }}
          >
            All ({totalCount})
          </button>
          {buckets.map((bucket) => {
            const isActive = selectedBucket === bucket.id;
            const color = CATEGORY_COLORS[bucket.name] || 'var(--accent)';
            return (
              <button
                key={bucket.id}
                onClick={() => setSelectedBucket(isActive ? null : bucket.id)}
                className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background: isActive ? `color-mix(in srgb, ${color} 15%, transparent)` : 'var(--bg-surface)',
                  color: isActive ? color : 'var(--text-tertiary)',
                  border: `1px solid ${isActive ? `color-mix(in srgb, ${color} 30%, transparent)` : 'var(--border)'}`,
                }}
              >
                {bucket.name} {bucket.faq_count > 0 && `(${bucket.faq_count})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-secondary p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatus(filter.value)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{
                  background: status === filter.value ? 'var(--accent-soft)' : 'transparent',
                  color: status === filter.value ? 'var(--accent-light)' : 'var(--text-tertiary)',
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 w-full sm:w-auto relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="search"
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
            />
          </div>

          {/* Publish All + Count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {draftCount > 0 && (
              <button
                onClick={handlePublishAll}
                disabled={publishing}
                className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                {publishing ? 'Publishing...' : `Publish All (${draftCount})`}
              </button>
            )}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="card-secondary p-12 flex flex-col items-center justify-center text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--accent-soft)' }}
          >
            <HelpCircle className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {search
              ? `No FAQs matching "${search}"`
              : selectedBucketName
              ? `No FAQs in ${selectedBucketName}`
              : 'No FAQs yet'}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            {search
              ? 'Try a different search term'
              : selectedBucketName
              ? 'Try another category or generate new FAQs'
              : 'Generate your first FAQs from a document or text'}
          </p>
          {!search && !selectedBucketName && (
            <Link
              href="/"
              className="btn-primary flex items-center gap-2 text-xs px-4 py-2 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate FAQs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                {group.title}
              </p>
              <div className="space-y-2">
                {group.faqs.map((faq) => (
                  <FAQCard
                    key={faq.id}
                    faq={faq}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
