'use client';

import { Layout } from '@/components/Layout';
import { Upload, FileText, HelpCircle, TrendingUp } from 'lucide-react';

const stats = [
  { title: 'Documents Uploaded', value: '0', icon: FileText, color: 'var(--accent)' },
  { title: 'FAQs Generated', value: '0', icon: HelpCircle, color: 'var(--accent-secondary)' },
  { title: 'Pending Review', value: '0', icon: TrendingUp, color: 'var(--amber)' },
  { title: 'Published', value: '0', icon: Upload, color: 'var(--green)' },
];

export default function Home() {
  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          AI-powered FAQ generation for ADAO
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="card-primary p-5 hover-lift">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
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

      {/* Quick Upload Section */}
      <div className="card-primary p-6">
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Upload
          </h2>
          <div className="upload-zone p-12 flex flex-col items-center justify-center text-center cursor-pointer">
            <Upload className="w-10 h-10 mb-3" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Drop documents here or click to upload
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Supports PDF, DOCX, TXT, CSV files
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-secondary p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent FAQs
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <HelpCircle className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No FAQs generated yet. Upload a document to get started.
          </p>
        </div>
      </div>
    </Layout>
  );
}
