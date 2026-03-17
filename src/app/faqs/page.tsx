'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { FAQList } from '@/components/FAQList';
import { FileText, HelpCircle, Clock, CheckCircle } from 'lucide-react';

export default function FAQsPage() {
  const [stats, setStats] = useState({ documents: 0, faqs: 0, draft: 0, published: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/faqs?status=all');
      if (res.ok) {
        const data = await res.json().catch(() => []);
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

  const statCards = [
    { title: 'Documents', value: stats.documents, icon: FileText, color: 'var(--accent)' },
    { title: 'Total FAQs', value: stats.faqs, icon: HelpCircle, color: 'var(--accent-secondary)' },
    { title: 'Draft', value: stats.draft, icon: Clock, color: 'var(--amber)' },
    { title: 'Published', value: stats.published, icon: CheckCircle, color: 'var(--green)' },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          FAQ Library
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Browse, manage, and publish your generated FAQs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <FAQList onStatsChange={fetchStats} />
    </Layout>
  );
}
