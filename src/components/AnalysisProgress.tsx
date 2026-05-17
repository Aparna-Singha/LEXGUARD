'use client';

import { AgentStep } from '@/lib/types';
import { Bot, Check, Loader2, AlertCircle } from 'lucide-react';

interface AnalysisProgressProps {
  steps: AgentStep[];
  currentStep: number;
}

const STEP_ICONS: Record<string, string> = {
  pending: '○',
  running: '◉',
  complete: '●',
  error: '✕',
};

export default function AnalysisProgress({ steps, currentStep }: AnalysisProgressProps) {
  return (
    <div className="glass rounded-xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Bot className="w-6 h-6 text-brand-400" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Multi-Agent Analysis</h3>
          <p className="text-xs text-slate-500">Processing your document through specialized agents</p>
        </div>
      </div>

      <div className="space-y-1">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = step.status === 'complete';
          const isError = step.status === 'error';

          return (
            <div
              key={step.agent}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-brand-600/10 border border-brand-500/20'
                  : isComplete
                  ? 'bg-green-500/5'
                  : isError
                  ? 'bg-red-500/5'
                  : ''
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isActive ? (
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                ) : isComplete ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <span className="text-xs text-slate-600">{STEP_ICONS[step.status]}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-brand-300'
                      : isComplete
                      ? 'text-green-300'
                      : isError
                      ? 'text-red-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.agent}
                </p>
                <p className={`text-xs ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                  {step.description}
                </p>
              </div>

              {isActive && (
                <div className="w-16 h-1 rounded-full bg-surface-overlay overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full animate-shimmer" style={{ width: '60%' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs text-slate-400 font-medium">
            {steps.filter((s) => s.status === 'complete').length} / {steps.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-overlay overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-accent-violet rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(steps.filter((s) => s.status === 'complete').length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
