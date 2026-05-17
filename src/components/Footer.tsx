import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-raised no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-semibold text-slate-300">LexGuard</span>
          </div>
          <p className="text-xs text-slate-500 text-center max-w-2xl">
            This tool provides legal awareness and risk explanation, not legally
            binding advice. Consult a qualified legal professional for final
            decisions.
          </p>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} LexGuard
          </p>
        </div>
      </div>
    </footer>
  );
}
