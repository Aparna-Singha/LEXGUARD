import { AIJsonParseError, generateAndParseJson } from './jsonUtils';
import { ambiguityDetectorAgent } from './agents/ambiguityDetectorAgent';
import { clauseExtractorAgent } from './agents/clauseExtractorAgent';
import { negotiationAdvisorAgent } from './agents/negotiationAdvisorAgent';
import { reportSynthesizerAgent } from './agents/reportSynthesizerAgent';
import { riskCriticAgent } from './agents/riskCriticAgent';
import { userImpactAgent } from './agents/userImpactAgent';
import {
  buildFallbackRiskReport,
  matchEvidenceToDocument,
  normalizeForComparison,
} from '@/lib/risk/fallbackRiskEngine';
import {
  AmbiguousTerm,
  AnalyzedClause,
  ClauseType,
  HiddenObligation,
  RiskCategories,
  RiskCategoryDetail,
  RiskLevel,
  RiskReport,
  SigningRecommendation,
} from '@/lib/types';

const MAX_DOCUMENT_LENGTH = 100000;
const MAX_CLAUSES = 18;
const REPORT_DISCLAIMER = 'This tool provides legal awareness, not legal advice.';
const GENERIC_CATEGORY_SUMMARY =
  'No significant risks were detected in this category from the extracted text.';

interface ExtractedClauseCandidate {
  id: string;
  clauseType: string;
  clauseText: string;
  summary: string;
}

interface RiskFindingCandidate {
  clauseId: string;
  severity: string;
  riskScore: number;
  whyItMatters: string;
  realWorldConsequence: string;
  hiddenObligation?: {
    obligation: string;
    impact: string;
    suggestedAction: string;
  } | null;
}

interface AmbiguousTermCandidate {
  term: string;
  evidence: string;
  whyAmbiguous: string;
  questionToAsk: string;
}

interface UserImpactCandidate {
  clauseId: string;
  plainLanguageExplanation: string;
  whyItMatters?: string;
  realWorldConsequence?: string;
}

interface NegotiationAdviceCandidate {
  clauseId: string;
  suggestedAction: string;
  negotiationTip: string;
}

interface ReportSynthesizerCandidate {
  executiveSummary: string;
  topConcerns: string[];
  signingRecommendation: string;
  recommendedQuestions?: string[];
}

interface AgentWorkflowResult {
  clauseExtractor: {
    clauses: ExtractedClauseCandidate[];
  };
  riskCritic: {
    findings: RiskFindingCandidate[];
  };
  ambiguityDetector: {
    ambiguousTerms: AmbiguousTermCandidate[];
  };
  userImpact: {
    impacts: UserImpactCandidate[];
  };
  negotiationAdvisor: {
    advice: NegotiationAdviceCandidate[];
    recommendedQuestions: string[];
  };
  reportSynthesizer: ReportSynthesizerCandidate;
}

const CLAUSE_CATEGORY_MAP: Record<ClauseType, Array<keyof RiskCategories>> = {
  'Non-compete': ['employment', 'compliance'],
  Arbitration: ['disputeResolution'],
  Termination: ['termination', 'employment'],
  Liability: ['compliance'],
  'IP Ownership': ['intellectualProperty', 'compliance'],
  Privacy: ['privacy', 'compliance'],
  Payment: ['financial'],
  Renewal: ['financial', 'termination'],
  Confidentiality: ['compliance'],
  Indemnification: ['compliance'],
  'Data Collection': ['privacy', 'compliance'],
  'Force Majeure': ['compliance'],
  'Governing Law': ['disputeResolution'],
  Other: ['compliance'],
};

/**
 * Main LEXGUARD AI entrypoint.
 *
 * v1 keeps latency hackathon-friendly by using a single combined LLM call, but
 * the code is intentionally organized as a six-agent adversarial workflow:
 * clause extraction -> risk criticism -> ambiguity detection -> user impact ->
 * negotiation advice -> report synthesis.
 *
 * The final RiskReport is assembled locally so the schema, disclaimer, and
 * evidence grounding stay deterministic even when AI output is noisy.
 */
export async function analyzeContract(
  documentText: string,
  documentType: string
): Promise<RiskReport> {
  if (isForcedFallbackModeEnabled()) {
    console.warn('LEXGUARD fallback mode forced by environment. Using fallback risk engine.');
    return buildFallbackRiskReport(documentText, documentType, {
      fallbackReason: 'forced_dev_mock_mode',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('No GEMINI_API_KEY found. Using fallback risk engine.');
    return buildFallbackRiskReport(documentText, documentType, {
      fallbackReason: 'missing_api_key',
    });
  }

  const baselineReport = buildFallbackRiskReport(documentText, documentType, {
    fallbackReason: 'invalid_ai_output',
  });

  const truncatedText =
    documentText.length > MAX_DOCUMENT_LENGTH
      ? `${documentText.slice(0, MAX_DOCUMENT_LENGTH)}\n\n[... Document truncated due to length ...]`
      : documentText;

  try {
    const workflow = await runCombinedAgentWorkflow(truncatedText, documentType, baselineReport);
    return synthesizeRiskReport(workflow, documentText, documentType, baselineReport);
  } catch (error) {
    if (error instanceof AIJsonParseError) {
      console.warn('AI returned invalid multi-agent JSON. Using fallback risk engine report.');
      return baselineReport;
    }

    console.error('AI multi-agent workflow failed. Returning fallback risk engine report.', error);
    return buildFallbackRiskReport(documentText, documentType, {
      fallbackReason: 'ai_failed',
    });
  }
}

export const analyzeDocument = analyzeContract;

async function runCombinedAgentWorkflow(
  documentText: string,
  documentType: string,
  baselineReport: RiskReport
): Promise<AgentWorkflowResult> {
  return generateAndParseJson<AgentWorkflowResult>({
    prompt: buildWorkflowPrompt(documentText, documentType, baselineReport),
    systemInstruction: buildWorkflowSystemInstruction(),
    temperature: 0.15,
    maxTokens: 8192,
    label: 'LEXGUARD multi-agent workflow',
    retries: 1,
    repairWithModel: true,
    validate: isAgentWorkflowResult,
  });
}

function buildWorkflowSystemInstruction(): string {
  return [
    'You are LEXGUARD, an adversarial contract review system composed of specialist agents.',
    'Shared rules:',
    '- Never claim legal certainty.',
    '- Never provide legal advice.',
    '- Every clauseText and evidence field must be copied exactly from the document.',
    '- If evidence cannot be quoted exactly, omit the finding.',
    '- Return one valid JSON object only.',
    '',
    clauseExtractorAgent.systemPrompt,
    '',
    riskCriticAgent.systemPrompt,
    '',
    ambiguityDetectorAgent.systemPrompt,
    '',
    userImpactAgent.systemPrompt,
    '',
    negotiationAdvisorAgent.systemPrompt,
    '',
    reportSynthesizerAgent.systemPrompt,
  ].join('\n');
}

function buildWorkflowPrompt(
  documentText: string,
  documentType: string,
  baselineReport: RiskReport
): string {
  return [
    `Analyze this ${documentType} using the six-agent workflow described below.`,
    'You may use the deterministic baseline hints as leads, but you must verify every final clause or evidence field directly against the document text.',
    '',
    'DETERMINISTIC BASELINE HINTS:',
    buildBaselineHints(baselineReport),
    '',
    'DOCUMENT TEXT:',
    '---',
    documentText,
    '---',
    '',
    clauseExtractorAgent.buildTaskPrompt(documentType),
    '',
    riskCriticAgent.buildTaskPrompt(),
    '',
    ambiguityDetectorAgent.buildTaskPrompt(),
    '',
    userImpactAgent.buildTaskPrompt(),
    '',
    negotiationAdvisorAgent.buildTaskPrompt(),
    '',
    reportSynthesizerAgent.buildTaskPrompt(),
    '',
    'Return one JSON object with exactly these top-level keys:',
    '{',
    '  "clauseExtractor": { "clauses": [] },',
    '  "riskCritic": { "findings": [] },',
    '  "ambiguityDetector": { "ambiguousTerms": [] },',
    '  "userImpact": { "impacts": [] },',
    '  "negotiationAdvisor": { "advice": [], "recommendedQuestions": [] },',
    '  "reportSynthesizer": { "executiveSummary": "", "topConcerns": [], "signingRecommendation": "Review carefully", "recommendedQuestions": [] }',
    '}',
  ].join('\n');
}

function synthesizeRiskReport(
  workflow: AgentWorkflowResult,
  documentText: string,
  documentType: string,
  baselineReport: RiskReport
): RiskReport {
  const aiClauses = buildAIClausesFromWorkflow(workflow, documentText);
  const mergedClauses = mergeClauses(baselineReport.clauses, aiClauses);
  const mergedAmbiguousTerms = mergeAmbiguousTerms(
    baselineReport.ambiguousTerms,
    buildAmbiguousTermsFromWorkflow(workflow, documentText)
  );
  const mergedHiddenObligations = mergeHiddenObligations(
    baselineReport.hiddenObligations,
    buildHiddenObligationsFromWorkflow(workflow, documentText)
  );
  const riskCategories = buildRiskCategories(mergedClauses);
  const overallRiskScore = calculateOverallRiskScore(
    mergedClauses,
    mergedAmbiguousTerms,
    mergedHiddenObligations
  );
  const overallRiskLevel = getRiskLevel(overallRiskScore);

  return {
    ...baselineReport,
    analysisMode: 'ai_enriched',
    analysisSource: 'gemini_enriched',
    fallbackReason: undefined,
    documentType,
    overallRiskScore,
    overallRiskLevel,
    executiveSummary:
      sanitizeParagraphs(workflow.reportSynthesizer.executiveSummary) || baselineReport.executiveSummary,
    topConcerns: buildTopConcerns(
      workflow.reportSynthesizer.topConcerns,
      mergedClauses,
      mergedHiddenObligations,
      mergedAmbiguousTerms,
      baselineReport.topConcerns
    ),
    clauses: mergedClauses,
    riskCategories,
    ambiguousTerms: mergedAmbiguousTerms,
    hiddenObligations: mergedHiddenObligations,
    recommendedQuestions: buildRecommendedQuestions(
      workflow.reportSynthesizer.recommendedQuestions,
      workflow.negotiationAdvisor.recommendedQuestions,
      baselineReport.recommendedQuestions
    ),
    signingRecommendation:
      normalizeSigningRecommendation(workflow.reportSynthesizer.signingRecommendation) ||
      getSigningRecommendation(overallRiskScore),
    disclaimer: REPORT_DISCLAIMER,
  };
}

function buildAIClausesFromWorkflow(
  workflow: AgentWorkflowResult,
  documentText: string
): AnalyzedClause[] {
  const riskMap = new Map(workflow.riskCritic.findings.map((finding) => [finding.clauseId, finding]));
  const impactMap = new Map(workflow.userImpact.impacts.map((impact) => [impact.clauseId, impact]));
  const adviceMap = new Map(workflow.negotiationAdvisor.advice.map((advice) => [advice.clauseId, advice]));

  const clauses: AnalyzedClause[] = [];

  for (const extractedClause of workflow.clauseExtractor.clauses) {
    const evidence = matchEvidenceToDocument(documentText, extractedClause.clauseText);
    if (!evidence) {
      continue;
    }

    const riskFinding = riskMap.get(extractedClause.id);
    const impact = impactMap.get(extractedClause.id);
    const advice = adviceMap.get(extractedClause.id);

    if (!riskFinding && !impact && !advice) {
      continue;
    }

    const severity = normalizeRiskLevel(riskFinding?.severity) ?? 'Medium';
    const whyItMatters =
      sanitizeSentence(riskFinding?.whyItMatters) ||
      sanitizeSentence(impact?.whyItMatters) ||
      sanitizeSentence(extractedClause.summary);
    const realWorldConsequence =
      sanitizeSentence(riskFinding?.realWorldConsequence) ||
      sanitizeSentence(impact?.realWorldConsequence) ||
      'This clause could create a practical downside if it is enforced as written.';

    if (!whyItMatters) {
      continue;
    }

    clauses.push({
      id: extractedClause.id,
      clauseType: normalizeClauseType(extractedClause.clauseType),
      severity,
      riskScore: clampNumber(
        Number.isFinite(riskFinding?.riskScore) ? riskFinding!.riskScore : inferRiskScoreFromSeverity(severity),
        0,
        100
      ),
      clauseText: evidence,
      plainLanguageExplanation:
        sanitizeSentence(impact?.plainLanguageExplanation) || sanitizeSentence(extractedClause.summary),
      whyItMatters,
      realWorldConsequence,
      suggestedAction:
        sanitizeSentence(advice?.suggestedAction) ||
        'Ask the other side to clarify, narrow, or soften this clause before signing.',
      negotiationTip:
        sanitizeSentence(advice?.negotiationTip) ||
        'Request a narrower scope, clearer definitions, or mutual protections around this clause.',
      confidence: buildClauseConfidence(riskFinding, impact, advice),
    });
  }

  return clauses;
}

function buildAmbiguousTermsFromWorkflow(
  workflow: AgentWorkflowResult,
  documentText: string
): AmbiguousTerm[] {
  const ambiguousTerms: AmbiguousTerm[] = [];

  for (const candidate of workflow.ambiguityDetector.ambiguousTerms) {
    const evidence = matchEvidenceToDocument(documentText, candidate.evidence);
    if (!evidence) {
      continue;
    }

    const term = sanitizeSentence(candidate.term);
    const whyAmbiguous = sanitizeSentence(candidate.whyAmbiguous);
    const questionToAsk = sanitizeSentence(candidate.questionToAsk);
    if (!term || !whyAmbiguous || !questionToAsk) {
      continue;
    }

    ambiguousTerms.push({
      term,
      evidence,
      whyAmbiguous,
      questionToAsk,
    });
  }

  return ambiguousTerms;
}

function buildHiddenObligationsFromWorkflow(
  workflow: AgentWorkflowResult,
  documentText: string
): HiddenObligation[] {
  const clauseMap = new Map(workflow.clauseExtractor.clauses.map((clause) => [clause.id, clause.clauseText]));
  const obligations: HiddenObligation[] = [];

  for (const finding of workflow.riskCritic.findings) {
    const hiddenObligation = finding.hiddenObligation;
    if (!hiddenObligation) {
      continue;
    }

    const clauseText = clauseMap.get(finding.clauseId);
    const evidence = clauseText ? matchEvidenceToDocument(documentText, clauseText) : null;
    if (!evidence) {
      continue;
    }

    const obligation = sanitizeSentence(hiddenObligation.obligation);
    const impact = sanitizeSentence(hiddenObligation.impact);
    const suggestedAction = sanitizeSentence(hiddenObligation.suggestedAction);

    if (!obligation || !impact || !suggestedAction) {
      continue;
    }

    obligations.push({
      obligation,
      evidence,
      impact,
      suggestedAction,
    });
  }

  return obligations;
}

function mergeClauses(baselineClauses: AnalyzedClause[], aiClauses: AnalyzedClause[]): AnalyzedClause[] {
  const merged = new Map<string, AnalyzedClause>();

  for (const clause of baselineClauses) {
    merged.set(normalizeForComparison(clause.clauseText), { ...clause });
  }

  let nextClauseIndex = baselineClauses.length + 1;

  for (const aiClause of aiClauses) {
    const key = normalizeForComparison(aiClause.clauseText);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...aiClause,
        id: `clause_${nextClauseIndex++}`,
      });
      continue;
    }

    merged.set(key, {
      ...existing,
      clauseType: aiClause.clauseType || existing.clauseType,
      severity: maxSeverity(existing.severity, aiClause.severity),
      riskScore: Math.max(existing.riskScore, aiClause.riskScore),
      plainLanguageExplanation:
        sanitizeSentence(aiClause.plainLanguageExplanation) || existing.plainLanguageExplanation,
      whyItMatters: sanitizeSentence(aiClause.whyItMatters) || existing.whyItMatters,
      realWorldConsequence:
        sanitizeSentence(aiClause.realWorldConsequence) || existing.realWorldConsequence,
      suggestedAction: sanitizeSentence(aiClause.suggestedAction) || existing.suggestedAction,
      negotiationTip: sanitizeSentence(aiClause.negotiationTip) || existing.negotiationTip,
      confidence: clampNumber(Math.max(existing.confidence, aiClause.confidence), 0, 1),
    });
  }

  return Array.from(merged.values())
    .sort(compareClausesByRisk)
    .slice(0, MAX_CLAUSES)
    .map((clause, index) => ({
      ...clause,
      id: `clause_${index + 1}`,
    }));
}

function mergeAmbiguousTerms(
  baselineTerms: AmbiguousTerm[],
  aiTerms: AmbiguousTerm[]
): AmbiguousTerm[] {
  const merged = new Map<string, AmbiguousTerm>();

  for (const term of [...baselineTerms, ...aiTerms]) {
    const key = `${sanitizeSentence(term.term).toLowerCase()}:${normalizeForComparison(term.evidence)}`;
    if (!key) {
      continue;
    }

    merged.set(key, term);
  }

  return Array.from(merged.values()).slice(0, 10);
}

function mergeHiddenObligations(
  baselineObligations: HiddenObligation[],
  aiObligations: HiddenObligation[]
): HiddenObligation[] {
  const merged = new Map<string, HiddenObligation>();

  for (const obligation of [...baselineObligations, ...aiObligations]) {
    const key = `${sanitizeSentence(obligation.obligation).toLowerCase()}:${normalizeForComparison(
      obligation.evidence
    )}`;
    if (!key) {
      continue;
    }

    merged.set(key, obligation);
  }

  return Array.from(merged.values()).slice(0, 8);
}

function buildRiskCategories(clauses: AnalyzedClause[]): RiskCategories {
  const emptyCategory = (): RiskCategoryDetail => ({
    score: 0,
    summary: GENERIC_CATEGORY_SUMMARY,
    risks: [],
  });

  const categories: RiskCategories = {
    financial: emptyCategory(),
    privacy: emptyCategory(),
    employment: emptyCategory(),
    intellectualProperty: emptyCategory(),
    termination: emptyCategory(),
    disputeResolution: emptyCategory(),
    compliance: emptyCategory(),
  };

  const groupedClauses: Record<keyof RiskCategories, AnalyzedClause[]> = {
    financial: [],
    privacy: [],
    employment: [],
    intellectualProperty: [],
    termination: [],
    disputeResolution: [],
    compliance: [],
  };

  for (const clause of clauses) {
    for (const category of CLAUSE_CATEGORY_MAP[clause.clauseType]) {
      groupedClauses[category].push(clause);
    }
  }

  for (const category of Object.keys(groupedClauses) as Array<keyof RiskCategories>) {
    const categoryClauses = groupedClauses[category];
    if (categoryClauses.length === 0) {
      continue;
    }

    const maxScore = Math.max(...categoryClauses.map((clause) => clause.riskScore));
    const averageScore =
      categoryClauses.reduce((sum, clause) => sum + clause.riskScore, 0) / categoryClauses.length;
    const score = clampNumber(Math.round(maxScore * 0.65 + averageScore * 0.35), 0, 100);

    categories[category] = {
      score,
      summary: summarizeCategory(category, categoryClauses),
      risks: uniqueValues(categoryClauses.map((clause) => clause.whyItMatters)).slice(0, 3),
    };
  }

  return categories;
}

function calculateOverallRiskScore(
  clauses: AnalyzedClause[],
  ambiguousTerms: AmbiguousTerm[],
  hiddenObligations: HiddenObligation[]
): number {
  if (clauses.length === 0) {
    if (ambiguousTerms.length > 0) {
      return clampNumber(18 + ambiguousTerms.length * 6, 18, 42);
    }

    return hiddenObligations.length > 0 ? 28 : 8;
  }

  const criticalCount = clauses.filter((clause) => clause.severity === 'Critical').length;
  const highOrCriticalCount = clauses.filter(
    (clause) => clause.severity === 'High' || clause.severity === 'Critical'
  ).length;
  const mediumOrHigherCount = clauses.filter((clause) => clause.severity !== 'Low').length;

  const hasIpRisk = clauses.some(
    (clause) => clause.clauseType === 'IP Ownership' && clause.riskScore >= 74
  );
  const hasDisputeRisk = clauses.some(
    (clause) => clause.clauseType === 'Arbitration' && clause.riskScore >= 72
  );
  const hasTerminationRisk = clauses.some(
    (clause) => clause.clauseType === 'Termination' && clause.riskScore >= 68
  );

  const topClauses = clauses.slice(0, 6);
  const weightedScore = topClauses.reduce((sum, clause, index) => {
    const weight = 1 - index * 0.07;
    return sum + clause.riskScore * weight;
  }, 0);
  const totalWeight = topClauses.reduce((sum, _clause, index) => sum + (1 - index * 0.07), 0);

  let score = Math.round(weightedScore / totalWeight);
  score += Math.min(ambiguousTerms.length * 2, 10);
  score += Math.min(hiddenObligations.length * 3, 12);

  if ((hasIpRisk && hasDisputeRisk && hasTerminationRisk) || criticalCount >= 3 || highOrCriticalCount >= 6) {
    score = Math.max(score, 86);
  } else if (highOrCriticalCount >= 3 || mediumOrHigherCount >= 6 || (hasIpRisk && hasDisputeRisk)) {
    score = Math.max(score, 67);
  } else if (mediumOrHigherCount >= 2 || ambiguousTerms.length >= 2 || hiddenObligations.length >= 1) {
    score = Math.max(score, 42);
  } else {
    score = Math.max(score, 18);
  }

  return clampNumber(score, 0, 100);
}

function buildTopConcerns(
  aiTopConcerns: string[],
  clauses: AnalyzedClause[],
  hiddenObligations: HiddenObligation[],
  ambiguousTerms: AmbiguousTerm[],
  fallbackTopConcerns: string[]
): string[] {
  const synthesizedConcerns = aiTopConcerns
    .map((concern) => sanitizeSentence(concern))
    .filter(Boolean);

  if (synthesizedConcerns.length > 0) {
    return uniqueValues([...synthesizedConcerns, ...fallbackTopConcerns]).slice(0, 5);
  }

  const concerns = clauses.slice(0, 4).map((clause) => `${clause.clauseType}: ${clause.whyItMatters}`);

  for (const obligation of hiddenObligations.slice(0, 2)) {
    concerns.push(`${obligation.obligation}: ${obligation.impact}`);
  }

  if (concerns.length < 3) {
    for (const ambiguity of ambiguousTerms.slice(0, 2)) {
      concerns.push(`Ambiguous term "${ambiguity.term}": ${ambiguity.whyAmbiguous}`);
    }
  }

  return uniqueValues([...concerns, ...fallbackTopConcerns]).slice(0, 5);
}

function buildRecommendedQuestions(
  synthesizedQuestions: string[] | undefined,
  negotiationQuestions: string[],
  fallbackQuestions: string[]
): string[] {
  return uniqueValues(
    [...(synthesizedQuestions ?? []), ...negotiationQuestions, ...fallbackQuestions]
      .map((question) => sanitizeSentence(question))
      .filter(Boolean)
  ).slice(0, 8);
}

function buildBaselineHints(baselineReport: RiskReport): string {
  const clauseHints = baselineReport.clauses
    .slice(0, 6)
    .map((clause) => `- ${clause.clauseType} | ${clause.severity} | ${clause.clauseText}`)
    .join('\n');
  const ambiguityHints = baselineReport.ambiguousTerms
    .slice(0, 3)
    .map((term) => `- Ambiguous: ${term.term} | ${term.evidence}`)
    .join('\n');

  return [clauseHints, ambiguityHints].filter(Boolean).join('\n') || '- No deterministic hints available.';
}

function isAgentWorkflowResult(value: unknown): value is AgentWorkflowResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.clauseExtractor) &&
    Array.isArray(value.clauseExtractor.clauses) &&
    isRecord(value.riskCritic) &&
    Array.isArray(value.riskCritic.findings) &&
    isRecord(value.ambiguityDetector) &&
    Array.isArray(value.ambiguityDetector.ambiguousTerms) &&
    isRecord(value.userImpact) &&
    Array.isArray(value.userImpact.impacts) &&
    isRecord(value.negotiationAdvisor) &&
    Array.isArray(value.negotiationAdvisor.advice) &&
    Array.isArray(value.negotiationAdvisor.recommendedQuestions) &&
    isRecord(value.reportSynthesizer) &&
    typeof value.reportSynthesizer.executiveSummary === 'string' &&
    Array.isArray(value.reportSynthesizer.topConcerns) &&
    typeof value.reportSynthesizer.signingRecommendation === 'string'
  );
}

function normalizeClauseType(value: string): ClauseType {
  const normalized = sanitizeSentence(value).toLowerCase();

  switch (normalized) {
    case 'non-compete':
    case 'noncompete':
    case 'non solicitation':
    case 'non-solicitation':
      return 'Non-compete';
    case 'arbitration':
    case 'dispute resolution':
      return 'Arbitration';
    case 'termination':
      return 'Termination';
    case 'liability':
      return 'Liability';
    case 'ip ownership':
    case 'intellectual property':
    case 'ip':
      return 'IP Ownership';
    case 'privacy':
      return 'Privacy';
    case 'payment':
      return 'Payment';
    case 'renewal':
      return 'Renewal';
    case 'confidentiality':
      return 'Confidentiality';
    case 'indemnification':
    case 'indemnity':
      return 'Indemnification';
    case 'data collection':
      return 'Data Collection';
    case 'force majeure':
      return 'Force Majeure';
    case 'governing law':
    case 'jurisdiction':
      return 'Governing Law';
    default:
      return 'Other';
  }
}

function normalizeRiskLevel(value: string | undefined): RiskLevel | null {
  const normalized = sanitizeSentence(value).toLowerCase();

  switch (normalized) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'critical':
      return 'Critical';
    default:
      return null;
  }
}

function normalizeSigningRecommendation(value: string | undefined): SigningRecommendation | null {
  const normalized = sanitizeSentence(value);

  switch (normalized) {
    case 'Safe to sign':
    case 'Review carefully':
    case 'Negotiate before signing':
    case 'Seek legal help before signing':
      return normalized;
    default:
      return null;
  }
}

function buildClauseConfidence(
  riskFinding?: RiskFindingCandidate,
  impact?: UserImpactCandidate,
  advice?: NegotiationAdviceCandidate
): number {
  let confidence = 0.72;

  if (riskFinding) {
    confidence += 0.1;
  }
  if (impact) {
    confidence += 0.08;
  }
  if (advice) {
    confidence += 0.06;
  }

  return clampNumber(confidence, 0, 0.96);
}

function inferRiskScoreFromSeverity(severity: RiskLevel): number {
  switch (severity) {
    case 'Critical':
      return 86;
    case 'High':
      return 72;
    case 'Medium':
      return 48;
    default:
      return 20;
  }
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) {
    return 'Low';
  }
  if (score <= 50) {
    return 'Medium';
  }
  if (score <= 75) {
    return 'High';
  }
  return 'Critical';
}

function getSigningRecommendation(score: number): SigningRecommendation {
  if (score <= 25) {
    return 'Safe to sign';
  }
  if (score <= 50) {
    return 'Review carefully';
  }
  if (score <= 75) {
    return 'Negotiate before signing';
  }
  return 'Seek legal help before signing';
}

function summarizeCategory(category: keyof RiskCategories, clauses: AnalyzedClause[]): string {
  const clauseNames = uniqueValues(clauses.map((clause) => clause.clauseType.toLowerCase()));
  if (clauseNames.length === 0) {
    return GENERIC_CATEGORY_SUMMARY;
  }

  return `${capitalizeCategory(category)} risk is mainly driven by ${clauseNames.join(', ')} language detected in the document.`;
}

function capitalizeCategory(category: keyof RiskCategories): string {
  switch (category) {
    case 'intellectualProperty':
      return 'Intellectual property';
    case 'disputeResolution':
      return 'Dispute resolution';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

function compareClausesByRisk(left: AnalyzedClause, right: AnalyzedClause): number {
  if (right.riskScore !== left.riskScore) {
    return right.riskScore - left.riskScore;
  }

  return severityRank(right.severity) - severityRank(left.severity);
}

function maxSeverity(left: RiskLevel, right: RiskLevel): RiskLevel {
  return severityRank(right) > severityRank(left) ? right : left;
}

function severityRank(severity: RiskLevel): number {
  switch (severity) {
    case 'Critical':
      return 4;
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    default:
      return 1;
  }
}

function sanitizeSentence(value?: string): string {
  return value?.replace(/\s+/g, ' ').trim() || '';
}

function sanitizeParagraphs(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function uniqueValues<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isForcedFallbackModeEnabled(): boolean {
  return isTruthyEnv(process.env.LEXGUARD_FORCE_FALLBACK) || isTruthyEnv(process.env.LEXGUARD_DEV_MOCK_MODE);
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
