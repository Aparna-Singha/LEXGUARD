'use client';

import { ReactNode } from 'react';
import { AnalyzedClause, RiskLevel } from '@/lib/types';
import {
  AlertTriangle,
  BadgeInfo,
  FileSearch,
  Gauge,
  Lightbulb,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

interface ClauseCardProps {
  clause: AnalyzedClause;
}

const SEVERITY_CONFIG: Record<RiskLevel, { badge: string; border: string; accent: string }> = {
  Low: {
    badge: 'bg-risk-low-bg text-risk-low',
    border: 'border-risk-low/35',
    accent: 'text-risk-low',
  },
  Medium: {
    badge: 'bg-risk-medium-bg text-risk-medium',
    border: 'border-risk-medium/35',
    accent: 'text-risk-medium',
  },
  High: {
    badge: 'bg-risk-high-bg text-risk-high',
    border: 'border-risk-high/35',
    accent: 'text-risk-high',
  },
  Critical: {
    badge: 'bg-risk-critical-bg text-risk-critical',
    border: 'border-risk-critical/35',
    accent: 'text-risk-critical',
  },
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.9) {
    return 'High confidence';
  }
  if (confidence >= 0.75) {
    return 'Moderate confidence';
  }
  return 'Lower confidence';
}

export default function ClauseCard({ clause }: ClauseCardProps) {
  const config = SEVERITY_CONFIG[clause.severity];

  return (
    <article className={`glass rounded-2xl p-5 border ${config.border} animate-fade-in-up`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${config.badge}`}>
                {clause.severity}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-overlay text-slate-300">
                {clause.clauseType}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{clause.plainLanguageExplanation}</h3>
          </div>

          <div className="flex items-center gap-3 lg:justify-end">
            <div className="px-3 py-2 rounded-xl bg-surface-overlay min-w-[88px]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Risk score</p>
              <p className={`text-xl font-bold ${config.accent}`}>{clause.riskScore}</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-surface-overlay min-w-[120px]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Confidence</p>
              <p className="text-sm font-semibold text-white">{Math.round(clause.confidence * 100)}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-overlay/70 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileSearch className="w-4 h-4 text-brand-400" />
            <h4 className="text-sm font-semibold text-white">Exact Evidence Text</h4>
          </div>
          <blockquote className="text-sm leading-relaxed text-slate-300 border-l-2 border-brand-500/35 pl-4">
            &ldquo;{clause.clauseText}&rdquo;
          </blockquote>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoBlock
            icon={<BadgeInfo className="w-4 h-4 text-brand-400" />}
            title="Plain English Explanation"
            body={clause.plainLanguageExplanation}
          />
          <InfoBlock
            icon={<TriangleAlert className={`w-4 h-4 ${config.accent}`} />}
            title="Why It Matters"
            body={clause.whyItMatters}
          />
          <InfoBlock
            icon={<AlertTriangle className="w-4 h-4 text-risk-high" />}
            title="Real-World Consequence"
            body={clause.realWorldConsequence}
          />
          <InfoBlock
            icon={<ShieldCheck className="w-4 h-4 text-accent-teal" />}
            title="Suggested Action"
            body={clause.suggestedAction}
          />
        </div>

        <div className="rounded-2xl bg-brand-600/8 border border-brand-500/18 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Negotiation Tip</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{clause.negotiationTip}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay">
            <Gauge className="w-3.5 h-3.5 text-brand-400" />
            <span>{confidenceLabel(clause.confidence)}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay">
            <span className={`${config.accent} font-semibold`}>Severity:</span>
            <span>{clause.severity}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-overlay/40 border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}
