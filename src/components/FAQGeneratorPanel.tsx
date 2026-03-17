'use client';

import { useState } from 'react';
import { Check, X, Save, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GeneratedFAQ } from '@/lib/types';

interface FAQGeneratorPanelProps {
  faqs: GeneratedFAQ[];
  category: string;
  documentId: string | null;
  link: string;
  onFaqsChange: (faqs: GeneratedFAQ[]) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function FAQGeneratorPanel({
  faqs,
  category,
  documentId,
  link,
  onFaqsChange,
  onSave,
  saving,
}: FAQGeneratorPanelProps) {
  const selectedCount = faqs.filter((f) => f.selected).length;

  const toggleAll = () => {
    const allSelected = faqs.every((f) => f.selected);
    onFaqsChange(faqs.map((f) => ({ ...f, selected: !allSelected })));
  };

  const toggleFaq = (index: number) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    onFaqsChange(updated);
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    onFaqsChange(updated);
  };

  return (
    <div className="card-primary p-6">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Generated FAQs
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-light)' }}
              >
                {category}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {selectedCount} of {faqs.length} selected
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {faqs.every((f) => f.selected) ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              {faqs.every((f) => f.selected) ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={onSave}
              disabled={saving || selectedCount === 0}
              className="btn-primary flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQEditItem
              key={index}
              faq={faq}
              index={index}
              onToggle={() => toggleFaq(index)}
              onUpdate={(field, value) => updateFaq(index, field, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQEditItem({
  faq,
  index,
  onToggle,
  onUpdate,
}: {
  faq: GeneratedFAQ;
  index: number;
  onToggle: () => void;
  onUpdate: (field: 'question' | 'answer', value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);

  const handleSave = () => {
    onUpdate('question', question);
    onUpdate('answer', answer);
    setEditing(false);
  };

  const handleCancel = () => {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="card-tertiary p-4"
      style={{ opacity: faq.selected ? 1 : 0.5 }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-colors"
          style={{ color: faq.selected ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {faq.selected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className="w-full p-2 text-sm rounded-lg border resize-none"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="w-full p-2 text-sm rounded-lg border resize-none"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-lg p-1 -m-1 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {faq.question}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {faq.answer}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Click to edit
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
