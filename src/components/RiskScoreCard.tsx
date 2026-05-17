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
    <div className={`glass rounded-2xl p-6 animate-fade-in-up shadow-xl ${config.glow}`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring */}
        <div className="risk-ring shrink-0">
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
            <span className={`text-4xl font-bold ${config.color}`}>
              {animatedScore}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}
            >
              {level} Risk
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Overall Risk Assessment</h2>
          <p className="text-sm text-slate-400 mb-3">
            {score <= 25 && 'This document appears to have mostly standard, fair terms.'}
            {score > 25 && score <= 50 && 'Some concerns identified that warrant review.'}
            {score > 50 && score <= 75 && 'Significant risks detected — careful review needed.'}
            {score > 75 && 'Critical risks found — professional review strongly recommended.'}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-overlay text-xs">
            <span className="text-slate-500">Recommendation:</span>
            <span className={`font-medium ${config.color}`}>{recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
