'use client';

import { ReactNode } from 'react';
import { SampleDocumentDefinition } from '@/lib/samples';
import {
  ArrowRight,
  Briefcase,
  CreditCard,
  FileText,
  Lock,
  Users,
} from 'lucide-react';

interface SampleDocumentPickerProps {
  samples: SampleDocumentDefinition[];
  disabled?: boolean;
  onAnalyzeSample: (sample: SampleDocumentDefinition) => void;
}

const ICONS: Record<SampleDocumentDefinition['documentType'], ReactNode> = {
  'Employment Contract': <Briefcase className="w-4 h-4" />,
  'Offer Letter': <FileText className="w-4 h-4" />,
  'Freelance Agreement': <Briefcase className="w-4 h-4" />,
  'Rental Agreement': <FileText className="w-4 h-4" />,
  'Vendor Agreement': <Users className="w-4 h-4" />,
  'Subscription Terms': <CreditCard className="w-4 h-4" />,
  'Privacy Policy': <Lock className="w-4 h-4" />,
  'Terms of Service': <FileText className="w-4 h-4" />,
  'Insurance Policy': <FileText className="w-4 h-4" />,
  'Quotation / Purchase Terms': <FileText className="w-4 h-4" />,
  'Ticket Terms': <FileText className="h-5 w-5" />,
  Other: <FileText className="w-4 h-4" />,
};

export default function SampleDocumentPicker({
  samples,
  disabled = false,
  onAnalyzeSample,
}: SampleDocumentPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300">Try a sample document</label>
          <p className="text-xs text-slate-500 mt-1">
            Use fictional demo content if you do not want to upload a file.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onAnalyzeSample(sample)}
            disabled={disabled}
            className="glass rounded-xl p-4 text-left border border-border-light hover:border-brand-500/35 hover:bg-brand-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-600/15 flex items-center justify-center text-brand-400 shrink-0">
                  {ICONS[sample.documentType]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{sample.title}</p>
                  <p className="text-xs text-brand-300 mt-1">{sample.documentType}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
            </div>

            <p className="text-sm text-slate-400 mt-3">{sample.description}</p>

            <div className="flex flex-wrap gap-2 mt-3">
              {sample.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="px-2 py-1 rounded-full bg-surface-overlay text-[11px] text-slate-300"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
