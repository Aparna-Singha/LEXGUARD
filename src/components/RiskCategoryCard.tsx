'use client';

import { ReactNode } from 'react';
import { RiskCategoryDetail } from '@/lib/types';

interface RiskCategoryCardProps {
  name: string;
  category: RiskCategoryDetail;
  icon: ReactNode;
}

function getScoreColor(score: number) {
  if (score <= 25) {
    return {
      text: 'text-risk-low',
      badge: 'bg-risk-low-bg text-risk-low',
      progress: 'bg-risk-low',
    };
  }

  if (score <= 50) {
    return {
      text: 'text-risk-medium',
      badge: 'bg-risk-medium-bg text-risk-medium',
      progress: 'bg-risk-medium',
    };
  }

  if (score <= 75) {
    return {
      text: 'text-risk-high',
      badge: 'bg-risk-high-bg text-risk-high',
      progress: 'bg-risk-high',
    };
  }

  return {
    text: 'text-risk-critical',
    badge: 'bg-risk-critical-bg text-risk-critical',
    progress: 'bg-risk-critical',
  };
}

export default function RiskCategoryCard({ name, category, icon }: RiskCategoryCardProps) {
  const colors = getScoreColor(category.score);
  const riskCount = category.risks.length;

  return (
    <div className="glass rounded-2xl p-5 border border-white/6 hover:border-border-light transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.badge}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Category intelligence</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-2xl font-bold leading-none ${colors.text}`}>{category.score}</p>
          <p className="text-[11px] text-slate-500 mt-1">/100</p>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-surface-overlay mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.progress} transition-all duration-1000 ease-out`}
          style={{ width: `${category.score}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-slate-500">Risk count</span>
        <span className={`px-2 py-1 rounded-full font-medium ${colors.badge}`}>{riskCount}</span>
      </div>

      <p className="text-sm text-slate-400 leading-relaxed">{category.summary}</p>
    </div>
  );
}
