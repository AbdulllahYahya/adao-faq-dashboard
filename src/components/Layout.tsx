'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';
import { Menu, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <a
            href="https://adeptiveai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <span className="text-sm font-black gradient-text">&lt;</span>
            <span className="text-sm font-black gradient-text tracking-tight mx-0.5">AdeptiveAI</span>
            <span className="text-sm font-black gradient-text">/&gt;</span>
          </a>
          <div className="w-px h-5" style={{ background: 'var(--border)' }} />
          <a
            href="https://www.asbestosdiseaseawareness.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="https://www.asbestosdiseaseawareness.org/wp-content/uploads/2015/12/adao-logo200x75.jpg.webp"
                unoptimized
              alt="ADAO"
              width={34}
              height={34}
              className="rounded-sm"
            />
          </a>
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <main
        className="transition-all duration-300 min-h-screen dot-grid"
        style={{ marginLeft: sidebarCollapsed ? 72 : 256 }}
      >
        <div className="px-4 py-4 md:px-8 md:py-6 mobile-main">
          {children}
        </div>
      </main>

      <Toaster
        theme={isDark ? 'dark' : 'light'}
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
    </div>
  );
}
