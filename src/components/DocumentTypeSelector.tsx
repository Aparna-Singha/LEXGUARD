'use client';

import { DOCUMENT_TYPES, DocumentType } from '@/lib/types';
import {
  FileText,
  Briefcase,
  Home,
  Users,
  CreditCard,
  Lock,
  ScrollText,
  Shield,
  FileSearch,
  HelpCircle,
  HandshakeIcon,
} from 'lucide-react';

interface DocumentTypeSelectorProps {
  value: DocumentType | '';
  onChange: (type: DocumentType) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  'Employment Contract': <Briefcase className="w-4 h-4" />,
  'Offer Letter': <FileText className="w-4 h-4" />,
  'Freelance Agreement': <HandshakeIcon className="w-4 h-4" />,
  'Rental Agreement': <Home className="w-4 h-4" />,
  'Vendor Agreement': <Users className="w-4 h-4" />,
  'Subscription Terms': <CreditCard className="w-4 h-4" />,
  'Privacy Policy': <Lock className="w-4 h-4" />,
  'Terms of Service': <ScrollText className="w-4 h-4" />,
  'Insurance Policy': <Shield className="w-4 h-4" />,
  'Quotation / Purchase Terms': <FileSearch className="w-4 h-4" />,
  'Other': <HelpCircle className="w-4 h-4" />,
};

export default function DocumentTypeSelector({ value, onChange }: DocumentTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Document Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {DOCUMENT_TYPES.map((type) => {
          const isSelected = value === type;
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isSelected
                  ? 'bg-brand-600/20 border border-brand-500/40 text-brand-300 shadow-lg shadow-brand-500/10'
                  : 'bg-surface-overlay/50 border border-transparent hover:border-border-light text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={isSelected ? 'text-brand-400' : 'text-slate-500'}>
                {ICONS[type]}
              </span>
              <span className="truncate">{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
