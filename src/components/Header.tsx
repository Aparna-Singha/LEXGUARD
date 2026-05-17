'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-brand-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-brand-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Lex</span>
              <span className="text-brand-400">Guard</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/analyze"
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-brand-500/25"
            >
              Analyze Document
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
