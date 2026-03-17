'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles, Library, Youtube,
  ChevronsLeft, ChevronsRight, X, Sun, Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const navigation = [
  { name: 'Generate', href: '/', icon: Sparkles },
  { name: 'FAQ Library', href: '/faqs', icon: Library },
  { name: 'YouTube Quotes', href: '/youtube-quotes', icon: Youtube },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const sidebarContent = (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300"
      style={{
        width: collapsed ? 72 : 256,
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logos — AdeptiveAI (left) + ADAO (right) */}
      <div className="px-3 flex items-center justify-between border-b" style={{ height: 64, borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {/* AdeptiveAI logo */}
          <a
            href="https://adeptiveai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center overflow-hidden group flex-shrink-0"
          >
            <span className="text-lg font-black gradient-text">&lt;</span>
            {!collapsed && (
              <span className="text-lg font-black gradient-text tracking-tight mx-0.5">AdeptiveAI</span>
            )}
            <span className="text-lg font-black gradient-text">/&gt;</span>
          </a>
          {/* Divider + ADAO logo */}
          {!collapsed && (
            <>
              <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />
              <a
                href="https://www.asbestosdiseaseawareness.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <img
                  src="/images/adao-logo.webp"
                  alt="ADAO"
                  width={40}
                  height={40}
                  className="rounded-sm"
                />
              </a>
            </>
          )}
        </div>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0 ml-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-white font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent)]" />
                  )}
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[var(--accent-light)]' : ''}`} />
                  {!collapsed && (
                    <span className="text-[13px] whitespace-nowrap">{item.name}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg text-xs text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="mt-6 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all duration-150"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && (
            <span className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="hidden md:flex mt-1 w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all duration-150"
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        {collapsed ? (
          <a href="https://adeptiveai.com" target="_blank" rel="noopener noreferrer" className="flex justify-center">
            <span className="text-xs font-black gradient-text">&lt;/&gt;</span>
          </a>
        ) : (
          <a href="https://adeptiveai.com" target="_blank" rel="noopener noreferrer" className="group">
            <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Built by</p>
            <div className="flex items-center">
              <span className="text-sm font-black gradient-text group-hover:brightness-125 transition-all">&lt;</span>
              <span className="text-sm font-black gradient-text group-hover:brightness-125 transition-all tracking-tight mx-0.5">AdeptiveAI</span>
              <span className="text-sm font-black gradient-text group-hover:brightness-125 transition-all">/&gt;</span>
            </div>
          </a>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">{sidebarContent}</div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
