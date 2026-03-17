'use client';

import { Layout } from '@/components/Layout';
import { FAQList } from '@/components/FAQList';

export default function FAQsPage() {
  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          FAQ Library
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          View and manage all generated FAQs
        </p>
      </div>

      <FAQList />
    </Layout>
  );
}
