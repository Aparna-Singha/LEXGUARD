import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-amber/5 border border-accent-amber/20">
      <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-accent-amber mb-1">Important Disclaimer</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          This tool provides legal awareness and risk explanation, not legally binding advice.
          AI-generated analysis may contain inaccuracies. Consult a qualified legal professional
          for final decisions before signing any document.
        </p>
      </div>
    </div>
  );
}
