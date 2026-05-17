'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RiskScoreCard from '@/components/RiskScoreCard';
import RiskCategoryCard from '@/components/RiskCategoryCard';
import ClauseCard from '@/components/ClauseCard';
import ChatPanel from '@/components/ChatPanel';
import ExportButton from '@/components/ExportButton';
import Disclaimer from '@/components/Disclaimer';
import { RiskReport, RiskLevel } from '@/lib/types';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileText,
  DollarSign,
  Lock,
  Briefcase,
  Lightbulb,
  Scale,
  Shield,
  ClipboardCheck,
  HelpCircle,
  Eye,
  MessageCircleQuestion,
  AlertTriangle,
} from 'lucide-react';

interface ReportData {
  id: string;
  report: RiskReport;
  documentType: string;
  fileName: string;
  createdAt: string;
}

const CATEGORY_CONFIG = [
  { key: 'financial' as const, name: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'privacy' as const, name: 'Privacy & Data', icon: <Lock className="w-4 h-4" /> },
  { key: 'employment' as const, name: 'Employment', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'intellectualProperty' as const, name: 'Intellectual Property', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'termination' as const, name: 'Termination', icon: <AlertCircle className="w-4 h-4" /> },
  { key: 'disputeResolution' as const, name: 'Dispute Resolution', icon: <Scale className="w-4 h-4" /> },
  { key: 'compliance' as const, name: 'Compliance', icon: <ClipboardCheck className="w-4 h-4" /> },
];

function getSeverityOrder(level: RiskLevel): number {
  const order: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return order[level];
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
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Report not found' : 'Failed to load report');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading report...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">Report Not Found</h2>
            <p className="text-sm text-slate-400 mb-6">{error || 'The report may have expired.'}</p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Analyze Another Document
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { report } = data;
  const sortedClauses = [...report.clauses].sort(
    (a, b) => getSeverityOrder(a.severity) - getSeverityOrder(b.severity)
  );
  const criticalClauses = sortedClauses.filter((c) => c.severity === 'Critical' || c.severity === 'High');
  const otherClauses = sortedClauses.filter((c) => c.severity === 'Medium' || c.severity === 'Low');

  return (
    <>
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link
                href="/analyze"
                className="p-2 rounded-lg hover:bg-surface-overlay text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" />
                  <h1 className="text-lg font-bold text-white">{data.fileName}</h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {data.documentType} • Analyzed {new Date(data.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <ExportButton reportId={reportId} />
          </div>

          {/* Risk Score */}
          <section className="mb-8">
            <RiskScoreCard
              score={report.overallRiskScore}
              level={report.overallRiskLevel}
              recommendation={report.signingRecommendation}
            />
          </section>

          {/* Executive Summary */}
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="glass rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Executive Summary
              </h2>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {report.executiveSummary}
              </div>
            </div>
          </section>

          {/* Top Concerns */}
          {report.topConcerns.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="glass rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-risk-high" />
                  Top Concerns
                </h2>
                <div className="grid gap-2">
                  {report.topConcerns.map((concern, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-risk-high-bg/30"
                    >
                      <span className="w-5 h-5 rounded-full bg-risk-high/20 text-risk-high text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300">{concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Risk Categories */}
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" />
              Risk Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {CATEGORY_CONFIG.map(({ key, name, icon }) => (
                <RiskCategoryCard
                  key={key}
                  name={name}
                  category={report.riskCategories[key]}
                  icon={icon}
                />
              ))}
            </div>
          </section>

          {/* High-Risk Clauses */}
          {criticalClauses.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-risk-critical" />
                High-Risk & Critical Clauses
                <span className="px-2 py-0.5 rounded-full bg-risk-critical-bg text-risk-critical text-[10px] font-bold">
                  {criticalClauses.length}
                </span>
              </h2>
              <div className="space-y-3">
                {criticalClauses.map((clause) => (
                  <ClauseCard key={clause.id} clause={clause} />
                ))}
              </div>
            </section>
          )}

          {/* Other Clauses */}
          {otherClauses.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-risk-medium" />
                Other Noted Clauses
                <span className="px-2 py-0.5 rounded-full bg-risk-medium-bg text-risk-medium text-[10px] font-bold">
                  {otherClauses.length}
                </span>
              </h2>
              <div className="space-y-3">
                {otherClauses.map((clause) => (
                  <ClauseCard key={clause.id} clause={clause} />
                ))}
              </div>
            </section>
          )}

          {/* Ambiguous Terms */}
          {report.ambiguousTerms.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <div className="glass rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-accent-amber" />
                  Ambiguous Terms
                  <span className="px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber text-[10px] font-bold">
                    {report.ambiguousTerms.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {report.ambiguousTerms.map((term, i) => (
                    <div key={i} className="p-4 rounded-lg bg-surface-overlay/50 border border-border">
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded bg-accent-amber/10 text-accent-amber text-[10px] font-bold uppercase shrink-0 mt-0.5">
                          {term.term}
                        </span>
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-xs text-slate-400">{term.whyAmbiguous}</p>
                          <blockquote className="text-xs text-slate-500 italic border-l-2 border-accent-amber/30 pl-2">
                            &ldquo;{term.evidence}&rdquo;
                          </blockquote>
                          <div className="flex items-start gap-1.5 p-2 rounded bg-accent-amber/5">
                            <MessageCircleQuestion className="w-3.5 h-3.5 text-accent-amber shrink-0 mt-0.5" />
                            <p className="text-xs text-accent-amber/80">{term.questionToAsk}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Hidden Obligations */}
          {report.hiddenObligations.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="glass rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent-rose" />
                  Hidden Obligations
                  <span className="px-2 py-0.5 rounded-full bg-accent-rose/10 text-accent-rose text-[10px] font-bold">
                    {report.hiddenObligations.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {report.hiddenObligations.map((obl, i) => (
                    <div key={i} className="p-4 rounded-lg bg-surface-overlay/50 border border-border">
                      <h3 className="text-sm font-medium text-white mb-2">{obl.obligation}</h3>
                      <blockquote className="text-xs text-slate-500 italic border-l-2 border-accent-rose/30 pl-2 mb-2">
                        &ldquo;{obl.evidence}&rdquo;
                      </blockquote>
                      <p className="text-xs text-slate-400 mb-2">
                        <strong className="text-slate-300">Impact:</strong> {obl.impact}
                      </p>
                      <div className="p-2 rounded bg-brand-600/10 border border-brand-500/20">
                        <p className="text-xs text-brand-300">
                          <strong>Action:</strong> {obl.suggestedAction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recommended Questions */}
          {report.recommendedQuestions.length > 0 && (
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
              <div className="glass rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircleQuestion className="w-4 h-4 text-accent-teal" />
                  Questions to Ask Before Signing
                </h2>
                <div className="grid gap-2">
                  {report.recommendedQuestions.map((question, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors"
                    >
                      <span className="w-5 h-5 rounded-full bg-accent-teal/20 text-accent-teal text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Disclaimer */}
          <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <Disclaimer />
          </section>
        </div>
      </main>

      <Footer />

      {/* Chat Panel */}
      <ChatPanel reportId={reportId} />
    </>
  );
}
