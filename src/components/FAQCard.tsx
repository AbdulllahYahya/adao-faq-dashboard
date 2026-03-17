'use client';

import { useState } from 'react';
import { Check, X, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { FAQ } from '@/lib/types';

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

function getCategoryColor(name?: string): string {
  return (name && CATEGORY_COLORS[name]) || 'var(--accent)';
}

interface FAQCardProps {
  faq: FAQ;
  onUpdate: (id: string, updates: Partial<FAQ>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FAQCard({ faq, onUpdate, onDelete }: FAQCardProps) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const catColor = getCategoryColor(faq.bucket?.name);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(faq.id, { question, answer });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setEditing(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await onDelete(faq.id);
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = faq.status === 'draft' ? 'published' : 'draft';
    await onUpdate(faq.id, { status: newStatus });
  };

  return (
    <div
      className="card-tertiary p-4 group"
      style={{ borderLeft: `3px solid ${catColor}` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          {faq.bucket && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${catColor} 12%, transparent)`, color: catColor }}
            >
              {faq.bucket.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!editing && !confirmDelete && (
            <>
              <button
                onClick={toggleStatus}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                style={{
                  background: faq.status === 'published' ? 'var(--green-soft)' : 'var(--amber-soft)',
                  color: faq.status === 'published' ? 'var(--green)' : 'var(--amber)',
                }}
                title={faq.status === 'draft' ? 'Click to publish' : 'Click to unpublish'}
              >
                {faq.status === 'draft' ? (
                  <><ArrowUpCircle className="w-3 h-3" /> Publish</>
                ) : (
                  <><ArrowDownCircle className="w-3 h-3" /> Published</>
                )}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors opacity-50 group-hover:opacity-100"
                style={{ color: 'var(--text-muted)' }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--red-soft)] transition-colors opacity-50 group-hover:opacity-100"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {confirmDelete ? (
        <div className="flex items-center gap-3 py-2">
          <p className="text-xs flex-1" style={{ color: 'var(--red)' }}>
            Delete this FAQ?
          </p>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: 'var(--red-soft)', color: 'var(--red)' }}
          >
            {saving ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
      ) : editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className="w-full p-2.5 text-sm rounded-lg border resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Answer
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full p-2.5 text-sm rounded-lg border resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {faq.question}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {faq.answer}
          </p>
          {faq.link && (
            <a
              href={faq.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] mt-2 inline-block hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              {faq.link}
            </a>
          )}
        </>
      )}
    </div>
  );
}
