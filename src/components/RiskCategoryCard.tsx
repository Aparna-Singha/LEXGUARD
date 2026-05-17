'use client';

import { RiskCategoryDetail } from '@/lib/types';

interface RiskCategoryCardProps {
  name: string;
  category: RiskCategoryDetail;
  icon: React.ReactNode;
}

function getScoreColor(score: number) {
  if (score <= 25) return { text: 'text-risk-low', bg: 'bg-risk-low', barBg: 'bg-risk-low-bg' };
  if (score <= 50) return { text: 'text-risk-medium', bg: 'bg-risk-medium', barBg: 'bg-risk-medium-bg' };
  if (score <= 75) return { text: 'text-risk-high', bg: 'bg-risk-high', barBg: 'bg-risk-high-bg' };
  return { text: 'text-risk-critical', bg: 'bg-risk-critical', barBg: 'bg-risk-critical-bg' };
}

export default function RiskCategoryCard({ name, category, icon }: RiskCategoryCardProps) {
  const colors = getScoreColor(category.score);

  return (
    <div className="glass rounded-xl p-4 hover:border-border-light transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${colors.text} transition-transform group-hover:scale-110`}>{icon}</span>
          <h3 className="text-sm font-semibold text-white">{name}</h3>
        </div>
        <span className={`text-lg font-bold ${colors.text}`}>{category.score}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-surface-overlay mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bg} transition-all duration-1000 ease-out`}
          style={{ width: `${category.score}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{category.summary}</p>

      {category.risks.length > 0 && (
        <ul className="space-y-1">
          {category.risks.slice(0, 3).map((risk, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
              <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${colors.bg}`} />
              <span className="line-clamp-1">{risk}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
