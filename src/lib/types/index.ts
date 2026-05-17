// ─── Document Types ─────────────────────────────────────────────
export const DOCUMENT_TYPES = [
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
  'Other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// ─── Risk Levels ────────────────────────────────────────────────
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type SigningRecommendation =
  | 'Safe to sign'
  | 'Review carefully'
  | 'Negotiate before signing'
  | 'Seek legal help before signing';

// ─── Clause Types ───────────────────────────────────────────────
export type ClauseType =
  | 'Non-compete'
  | 'Arbitration'
  | 'Termination'
  | 'Liability'
  | 'IP Ownership'
  | 'Privacy'
  | 'Payment'
  | 'Renewal'
  | 'Confidentiality'
  | 'Indemnification'
  | 'Data Collection'
  | 'Force Majeure'
  | 'Governing Law'
  | 'Other';

// ─── Clause ─────────────────────────────────────────────────────
export interface AnalyzedClause {
  id: string;
  clauseType: ClauseType;
  severity: RiskLevel;
  riskScore: number;
  clauseText: string;
  plainLanguageExplanation: string;
  whyItMatters: string;
  realWorldConsequence: string;
  suggestedAction: string;
  negotiationTip: string;
  confidence: number;
}

// ─── Risk Category ──────────────────────────────────────────────
export interface RiskCategoryDetail {
  score: number;
  summary: string;
  risks: string[];
}

export interface RiskCategories {
  financial: RiskCategoryDetail;
  privacy: RiskCategoryDetail;
  employment: RiskCategoryDetail;
  intellectualProperty: RiskCategoryDetail;
  termination: RiskCategoryDetail;
  disputeResolution: RiskCategoryDetail;
  compliance: RiskCategoryDetail;
}

// ─── Ambiguous Term ─────────────────────────────────────────────
export interface AmbiguousTerm {
  term: string;
  evidence: string;
  whyAmbiguous: string;
  questionToAsk: string;
}

// ─── Hidden Obligation ──────────────────────────────────────────
export interface HiddenObligation {
  obligation: string;
  evidence: string;
  impact: string;
  suggestedAction: string;
}

// ─── Full Risk Report ───────────────────────────────────────────
export interface RiskReport {
  id?: string;
  documentName?: string;
  documentType: string;
  createdAt?: string;
  analysisMode?: 'ai_enriched' | 'deterministic_fallback';
  analysisSource?: 'gemini_enriched' | 'fallback_risk_engine';
  fallbackReason?:
    | 'missing_api_key'
    | 'ai_failed'
    | 'invalid_ai_output'
    | 'forced_dev_mock_mode';
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  executiveSummary: string;
  topConcerns: string[];
  clauses: AnalyzedClause[];
  riskCategories: RiskCategories;
  ambiguousTerms: AmbiguousTerm[];
  hiddenObligations: HiddenObligation[];
  recommendedQuestions: string[];
  signingRecommendation: SigningRecommendation;
  disclaimer: string;
}

// ─── Stored Report ──────────────────────────────────────────────
export interface StoredReport {
  id: string;
  report: RiskReport;
  documentText: string;
  documentType: DocumentType;
  fileName: string;
  createdAt: string;
}

// ─── Chat Message ───────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RelevantClauseReference {
  clauseId: string;
  clauseType: ClauseType;
  severity: RiskLevel;
  evidence: string;
}

// ─── Agent Step ─────────────────────────────────────────────────
export interface AgentStep {
  agent: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  description: string;
}

// ─── API Response Types ─────────────────────────────────────────
export interface AnalyzeResponse {
  success: true;
  reportId: string;
  report: RiskReport;
}

export interface ChatResponse {
  answer: string;
  relevantClauses: RelevantClauseReference[];
  riskLevel: RiskLevel;
  suggestedNextStep: string;
  disclaimer: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
