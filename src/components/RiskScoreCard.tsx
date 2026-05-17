'use client';

import { useEffect, useState } from 'react';
import { RiskLevel } from '@/lib/types';

interface RiskScoreCardProps {
  score: number;
  level: RiskLevel;
  recommendation: string;
}

const LEVEL_CONFIG: Record<RiskLevel, { color: string; ringColor: string; bg: string; glow: string }> = {
  Low: {
    color: 'text-risk-low',
    ringColor: '#22c55e',
    bg: 'bg-risk-low-bg',
    glow: 'shadow-green-500/20',
  },
  Medium: {
    color: 'text-risk-medium',
    ringColor: '#eab308',
    bg: 'bg-risk-medium-bg',
    glow: 'shadow-yellow-500/20',
  },
  High: {
    color: 'text-risk-high',
    ringColor: '#f97316',
    bg: 'bg-risk-high-bg',
    glow: 'shadow-orange-500/20',
  },
  Critical: {
    color: 'text-risk-critical',
    ringColor: '#ef4444',
    bg: 'bg-risk-critical-bg',
    glow: 'shadow-red-500/20',
  },
};

function getScoreDescription(score: number): string {
  if (score <= 25) {
    return 'Mostly standard language with relatively limited concern signals.';
  }

  if (score <= 50) {
    return 'Some clauses deserve closer review before you agree.';
  }

  if (score <= 75) {
    return 'Material risks are present and should be negotiated or clarified.';
  }

  return 'The document contains severe or one-sided terms that merit very careful review.';
}

export default function RiskScoreCard({ score, level, recommendation }: RiskScoreCardProps) {
  const config = LEVEL_CONFIG[level];
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;

      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 65;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={`glass rounded-2xl p-6 shadow-xl ${config.glow}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="risk-ring shrink-0 mx-auto lg:mx-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle className="ring-bg" cx="80" cy="80" r="65" />
            <circle
              className="ring-progress"
              cx="80"
              cy="80"
              r="65"
              stroke={config.ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${config.color}`}>{animatedScore}</span>
            <span className="text-xs text-slate-500 mt-0.5">out of 100</span>
          </div>
        </div>

        <div className="flex-1 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}
            >
              {level} Risk
            </span>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-surface-overlay text-slate-300">
              Contract intelligence score
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">Overall risk assessment</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{getScoreDescription(score)}</p>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-overlay text-sm">
            <span className="text-slate-500">Signing recommendation:</span>
            <span className={`font-semibold ${config.color}`}>{recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
