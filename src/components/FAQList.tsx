'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { FAQCard } from './FAQCard';
import type { FAQ } from '@/lib/types';
import { toast } from 'sonner';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
];

export function FAQList() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);

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
  }, [status, search]);

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
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setFaqs((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast.success('FAQ updated');
    } catch {
      toast.error('Failed to update FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success('FAQ deleted');
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  // Group FAQs by document
  const grouped = faqs.reduce<Record<string, { title: string; faqs: FAQ[] }>>((acc, faq) => {
    const key = faq.document_id || 'no-document';
    const title = faq.document?.title || 'Uncategorized';
    if (!acc[key]) acc[key] = { title, faqs: [] };
    acc[key].faqs.push(faq);
    return acc;
  }, {});

  return (
    <div>
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
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Count */}
          <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
          </p>
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
          <HelpCircle className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            No FAQs found
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {search
              ? 'Try a different search term'
              : 'Upload a document on the Overview page to generate FAQs'}
          </p>
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
