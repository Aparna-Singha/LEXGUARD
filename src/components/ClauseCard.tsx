'use client';

import { useState } from 'react';
import { AnalyzedClause, RiskLevel } from '@/lib/types';
import { ChevronDown, ChevronUp, AlertTriangle, Info, Lightbulb } from 'lucide-react';

interface ClauseCardProps {
  clause: AnalyzedClause;
}

const SEVERITY_CONFIG: Record<RiskLevel, { badge: string; border: string; icon: string }> = {
  Low: {
    badge: 'bg-risk-low-bg text-risk-low',
    border: 'border-l-risk-low',
    icon: 'text-risk-low',
  },
  Medium: {
    badge: 'bg-risk-medium-bg text-risk-medium',
    border: 'border-l-risk-medium',
    icon: 'text-risk-medium',
  },
  High: {
    badge: 'bg-risk-high-bg text-risk-high',
    border: 'border-l-risk-high',
    icon: 'text-risk-high',
  },
  Critical: {
    badge: 'bg-risk-critical-bg text-risk-critical',
    border: 'border-l-risk-critical',
    icon: 'text-risk-critical',
  },
};

export default function ClauseCard({ clause }: ClauseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = SEVERITY_CONFIG[clause.severity];

  return (
    <div
      className={`glass rounded-xl border-l-4 ${config.border} overflow-hidden transition-all hover:shadow-lg`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 p-4 text-left group"
      >
        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${config.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.badge}`}>
              {clause.severity}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-overlay text-slate-400">
              {clause.clauseType}
            </span>
            <span className="text-[10px] text-slate-600">Score: {clause.riskScore}/100</span>
          </div>
          <p className="text-sm text-slate-200 line-clamp-2">{clause.plainLanguageExplanation}</p>
        </div>
        <div className="shrink-0 p-1 text-slate-500 group-hover:text-slate-300 transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-border">
          {/* Original text */}
          <div className="mt-4">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Original Clause Text
            </h4>
            <blockquote className="text-xs text-slate-400 italic border-l-2 border-brand-500/30 pl-3 bg-surface-overlay/50 rounded-r p-2.5">
              &ldquo;{clause.clauseText}&rdquo;
            </blockquote>
          </div>

          {/* Why it matters */}
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-medium text-brand-300 mb-0.5">Why This Matters</h4>
              <p className="text-xs text-slate-400">{clause.whyItMatters}</p>
            </div>
          </div>

          {/* Real-world consequence */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-risk-high mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-medium text-risk-high mb-0.5">Real-World Consequence</h4>
              <p className="text-xs text-slate-400">{clause.realWorldConsequence}</p>
            </div>
          </div>

          {/* Negotiation tip */}
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-accent-amber mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-medium text-accent-amber mb-0.5">Negotiation Tip</h4>
              <p className="text-xs text-slate-400">{clause.negotiationTip}</p>
            </div>
          </div>

          {/* Suggested action */}
          <div className="p-3 rounded-lg bg-brand-600/10 border border-brand-500/20">
            <h4 className="text-xs font-medium text-brand-300 mb-0.5">Suggested Action</h4>
            <p className="text-xs text-slate-300">{clause.suggestedAction}</p>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>AI Confidence:</span>
            <div className="w-20 h-1 rounded-full bg-surface-overlay overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${clause.confidence * 100}%` }}
              />
            </div>
            <span>{Math.round(clause.confidence * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
