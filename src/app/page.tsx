import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Disclaimer from '@/components/Disclaimer';
import {
  Shield,
  Search,
  AlertTriangle,
  FileText,
  Brain,
  Scale,
  Eye,
  Handshake,
  ArrowRight,
  Zap,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'Multi-Agent AI Analysis',
    description:
      'Six specialized AI agents work adversarially to extract clauses, detect risks, find ambiguities, and generate actionable advice.',
    color: 'text-brand-400',
    bg: 'bg-brand-600/10',
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Risk Scoring & Classification',
    description:
      'Every clause is scored 0-100 and classified by severity. Risk categories cover financial, privacy, IP, termination, and more.',
    color: 'text-risk-high',
    bg: 'bg-risk-high/10',
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Hidden Clause Detection',
    description:
      'Uncovers buried obligations, automatic renewals, broad IP transfers, and one-sided arbitration you might have missed.',
    color: 'text-accent-violet',
    bg: 'bg-accent-violet/10',
  },
  {
    icon: <Scale className="w-6 h-6" />,
    title: 'Plain Language Explanations',
    description:
      'Complex legal jargon translated into everyday language with real-world consequences anyone can understand.',
    color: 'text-accent-teal',
    bg: 'bg-accent-teal/10',
  },
  {
    icon: <Handshake className="w-6 h-6" />,
    title: 'Negotiation Guidance',
    description:
      'Actionable tips for every risky clause — what to ask for, what alternative language to propose, and what is negotiable.',
    color: 'text-accent-amber',
    bg: 'bg-accent-amber/10',
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Follow-Up Q&A',
    description:
      'Chat with AI about your document. Ask specific questions and get answers with evidence cited from the original text.',
    color: 'text-brand-300',
    bg: 'bg-brand-500/10',
  },
];

const DOCUMENT_TYPES = [
  'Employment Contract',
  'Offer Letter',
  'Freelance Agreement',
  'Rental Agreement',
  'Vendor Agreement',
  'Subscription Terms',
  'Privacy Policy',
  'Terms of Service',
  'Insurance Policy',
  'Quotation / Purchase Terms',
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-surface to-surface pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/8 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 mb-6 animate-fade-in">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-medium text-brand-300">
                AI-Powered Contract Intelligence
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
              <span className="text-white">Know What You&apos;re</span>
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-accent-violet to-accent-teal bg-clip-text text-transparent animate-gradient">
                Signing Into
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Upload any contract, offer letter, or legal document. Our adversarial multi-agent AI
              system detects exploitative clauses, hidden liabilities, and ambiguous language —
              before you agree to them.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link
                href="/analyze"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shadow-xl shadow-brand-600/25 hover:shadow-brand-500/30 hover:scale-[1.02]"
              >
                <Shield className="w-5 h-5" />
                Analyze a Document
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 mt-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
              {[
                { icon: <Lock className="w-3.5 h-3.5" />, text: 'Your documents stay private' },
                { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'No account required' },
                { icon: <FileText className="w-3.5 h-3.5" />, text: 'PDF, DOCX & TXT supported' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-slate-600">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">Adversarial Multi-Agent Analysis</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Six specialized AI agents work together — and challenge each other — to deliver the most thorough risk analysis possible.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-5 hover:border-border-light transition-all group animate-fade-in-up"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <span className={feature.color}>{feature.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Supported Document Types ────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Supported Document Types</h2>
            <p className="text-sm text-slate-400">
              Analyze virtually any legal or quasi-legal document
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <span
                key={type}
                className="px-3 py-1.5 rounded-lg bg-surface-overlay border border-border text-xs text-slate-300 hover:border-brand-500/30 hover:text-brand-300 transition-colors cursor-default"
              >
                {type}
              </span>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass rounded-2xl p-8 text-center gradient-border">
            <h2 className="text-xl font-bold text-white mb-3">
              Don&apos;t Sign Blind
            </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              Upload your document now and get a comprehensive risk analysis in under a minute.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25"
            >
              <Shield className="w-5 h-5" />
              Start Free Analysis
            </Link>
          </div>

          <div className="mt-8">
            <Disclaimer />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
