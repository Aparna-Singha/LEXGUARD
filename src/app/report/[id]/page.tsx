'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  Eye,
  FileText,
  HelpCircle,
  Lightbulb,
  Lock,
  MessageCircleQuestion,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import ClauseCard from '@/components/ClauseCard';
import ExportButton from '@/components/ExportButton';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import RiskCategoryCard from '@/components/RiskCategoryCard';
import RiskScoreCard from '@/components/RiskScoreCard';
import { RiskLevel, RiskReport } from '@/lib/types';

interface ReportData {
  id: string;
  report: RiskReport;
  documentType: string;
  fileName: string;
  createdAt: string;
}

const CATEGORY_CONFIG = [
  { key: 'financial' as const, name: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'privacy' as const, name: 'Privacy', icon: <Lock className="w-4 h-4" /> },
  { key: 'employment' as const, name: 'Employment', icon: <Briefcase className="w-4 h-4" /> },
  {
    key: 'intellectualProperty' as const,
    name: 'Intellectual Property',
    icon: <Lightbulb className="w-4 h-4" />,
  },
  { key: 'termination' as const, name: 'Termination', icon: <AlertCircle className="w-4 h-4" /> },
  {
    key: 'disputeResolution' as const,
    name: 'Dispute Resolution',
    icon: <Scale className="w-4 h-4" />,
  },
  { key: 'compliance' as const, name: 'Compliance', icon: <ClipboardCheck className="w-4 h-4" /> },
];

function getSeverityOrder(level: RiskLevel): number {
  const order: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return order[level];
}

function formatCreatedAt(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatAnalysisMode(report: RiskReport): string {
  if (report.analysisMode === 'ai_enriched') {
    return 'AI-enriched analysis';
  }

  return 'Deterministic fallback analysis';
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/report/${reportId}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Report not found' : 'Failed to load report');
        }

        const json = (await response.json()) as ReportData;
        setData(json);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    void fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-fade-in space-y-6">
              <div className="glass rounded-3xl p-6">
                <div className="h-4 w-44 rounded bg-surface-overlay animate-pulse mb-4" />
                <div className="h-9 w-2/3 rounded bg-surface-overlay animate-pulse mb-3" />
                <div className="h-4 w-full rounded bg-surface-overlay animate-pulse mb-2" />
                <div className="h-4 w-5/6 rounded bg-surface-overlay animate-pulse" />
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="glass rounded-3xl p-6 h-[260px] animate-pulse bg-surface-raised/60" />
                <div className="glass rounded-3xl p-6 h-[260px] animate-pulse bg-surface-raised/60" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="glass rounded-2xl p-5 h-40 animate-pulse bg-surface-raised/60" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-lg px-4">
            <div className="glass rounded-3xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Unable to load report</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {error || 'This report may have expired or could not be found in temporary storage.'}
              </p>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Analyze another document
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { report } = data;
  const sortedClauses = [...report.clauses].sort(
    (left, right) => getSeverityOrder(left.severity) - getSeverityOrder(right.severity)
  );
  const highRiskClauses = sortedClauses.filter(
    (clause) => clause.severity === 'Critical' || clause.severity === 'High'
  );
  const displayedClauses =
    highRiskClauses.length > 0 ? highRiskClauses : sortedClauses.slice(0, Math.min(3, sortedClauses.length));

  return (
    <>
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-6 no-print">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-overlay hover:bg-border-light text-sm text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to analysis
            </Link>
            <ExportButton reportId={reportId} />
          </div>

          <section className="glass rounded-3xl p-6 sm:p-8 mb-8 animate-fade-in-up">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/20 text-xs font-medium text-brand-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Contract Intelligence Report
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-overlay text-slate-300">
                    {formatAnalysisMode(report)}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{data.fileName}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-overlay">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <span>{data.documentType}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-overlay">
                    <CalendarDays className="w-4 h-4 text-brand-400" />
                    <span>{formatCreatedAt(data.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:max-w-md w-full">
                <div className="rounded-2xl bg-accent-amber/8 border border-accent-amber/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-accent-amber mb-1">Disclaimer</h2>
                      <p className="text-sm text-slate-300 leading-relaxed">{report.disclaimer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <SectionHeading
              icon={<Shield className="w-4 h-4 text-brand-400" />}
              title="Overall Risk"
              description="High-level contract intelligence summary before you dive into clause details."
            />
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <RiskScoreCard
                score={report.overallRiskScore}
                level={report.overallRiskLevel}
                recommendation={report.signingRecommendation}
              />

              <div className="glass rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Executive Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {report.executiveSummary}
                </p>
              </div>
            </div>
          </section>

          {report.topConcerns.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
              <SectionHeading
                icon={<AlertTriangle className="w-4 h-4 text-risk-high" />}
                title="Top Concerns"
                description="The fastest way to see what could hurt the signer in practice."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {report.topConcerns.map((concern, index) => (
                  <div key={index} className="glass rounded-2xl p-5 border border-risk-high/18">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-risk-high-bg text-risk-high text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">{concern}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <SectionHeading
              icon={<ClipboardCheck className="w-4 h-4 text-brand-400" />}
              title="Risk Categories"
              description="Category-level scoring for the main contract intelligence dimensions."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {CATEGORY_CONFIG.map(({ key, name, icon }) => (
                <RiskCategoryCard key={key} name={name} category={report.riskCategories[key]} icon={icon} />
              ))}
            </div>
          </section>

          {displayedClauses.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <SectionHeading
                icon={<Eye className="w-4 h-4 text-risk-critical" />}
                title={highRiskClauses.length > 0 ? 'High-Risk Clauses' : 'Key Clauses'}
                description="Clause-by-clause contract intelligence with exact evidence and practical next steps."
                count={displayedClauses.length}
              />
              <div className="space-y-4">
                {displayedClauses.map((clause) => (
                  <ClauseCard key={clause.id} clause={clause} />
                ))}
              </div>
            </section>
          )}

          {report.ambiguousTerms.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
              <SectionHeading
                icon={<HelpCircle className="w-4 h-4 text-accent-amber" />}
                title="Ambiguous Terms"
                description="Vague language that could expand obligations or create room for one-sided interpretation."
                count={report.ambiguousTerms.length}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {report.ambiguousTerms.map((term, index) => (
                  <div key={index} className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-semibold text-white">{term.term}</h3>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent-amber/10 text-accent-amber">
                        Ambiguous
                      </span>
                    </div>
                    <div className="rounded-2xl bg-surface-overlay/70 border border-white/5 p-4 mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                      <blockquote className="text-sm text-slate-300 border-l-2 border-accent-amber/35 pl-3">
                        &ldquo;{term.evidence}&rdquo;
                      </blockquote>
                    </div>
                    <div className="space-y-3">
                      <InfoRow title="Why ambiguous" body={term.whyAmbiguous} />
                      <InfoRow title="Question to ask" body={term.questionToAsk} accent="text-accent-amber" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {report.hiddenObligations.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '280ms' }}>
              <SectionHeading
                icon={<Eye className="w-4 h-4 text-accent-rose" />}
                title="Hidden Obligations"
                description="Buried duties and commitments that may not be obvious on a quick read."
                count={report.hiddenObligations.length}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {report.hiddenObligations.map((obligation, index) => (
                  <div key={index} className="glass rounded-2xl p-5">
                    <h3 className="text-base font-semibold text-white mb-3">{obligation.obligation}</h3>
                    <div className="rounded-2xl bg-surface-overlay/70 border border-white/5 p-4 mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                      <blockquote className="text-sm text-slate-300 border-l-2 border-accent-rose/35 pl-3">
                        &ldquo;{obligation.evidence}&rdquo;
                      </blockquote>
                    </div>
                    <div className="space-y-3">
                      <InfoRow title="Impact" body={obligation.impact} />
                      <InfoRow title="Suggested action" body={obligation.suggestedAction} accent="text-brand-300" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {report.recommendedQuestions.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
              <SectionHeading
                icon={<MessageCircleQuestion className="w-4 h-4 text-accent-teal" />}
                title="Recommended Questions Before Signing"
                description="Questions the signer should ask to negotiate or clarify the riskiest parts."
              />
              <div className="grid gap-3 md:grid-cols-2">
                {report.recommendedQuestions.map((question, index) => (
                  <div key={index} className="glass rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-accent-teal/15 text-accent-teal text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-16 animate-fade-in-up no-print" style={{ animationDelay: '360ms' }}>
            <SectionHeading
              icon={<MessageCircleQuestion className="w-4 h-4 text-brand-400" />}
              title="Follow-Up Chat"
              description="Ask grounded follow-up questions about the report, the evidence, or what to negotiate next."
            />
            <ChatPanel reportId={reportId} variant="embedded" />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  count,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {typeof count === 'number' && (
          <span className="px-2.5 py-1 rounded-full bg-surface-overlay text-xs font-medium text-slate-300">
            {count}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function InfoRow({
  title,
  body,
  accent = 'text-slate-300',
}: {
  title: string;
  body: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-overlay/40 border border-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{title}</p>
      <p className={`text-sm leading-relaxed ${accent}`}>{body}</p>
    </div>
  );
}
