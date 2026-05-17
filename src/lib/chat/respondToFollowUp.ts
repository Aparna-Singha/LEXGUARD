import { AIJsonParseError, generateAndParseJson } from '@/lib/ai/jsonUtils';
import {
  AnalyzedClause,
  ChatResponse,
  ClauseType,
  RelevantClauseReference,
  RiskLevel,
  StoredReport,
} from '@/lib/types';

const CHAT_DISCLAIMER = 'This tool provides legal awareness, not legal advice.';
const MAX_RELEVANT_CLAUSES = 3;

interface QuestionContext {
  isRelated: boolean;
  relevantClauses: AnalyzedClause[];
  intent:
    | 'most_dangerous'
    | 'negotiate'
    | 'ip_rights'
    | 'termination'
    | 'questions_before_signing'
    | 'general';
}

interface AIChatResult {
  answer: string;
  referencedClauseIds: string[];
  suggestedNextStep: string;
  unrelated?: boolean;
}

export async function respondToFollowUp(
  storedReport: StoredReport,
  question: string
): Promise<ChatResponse> {
  const trimmedQuestion = question.trim();
  const context = buildQuestionContext(trimmedQuestion, storedReport);

  if (!context.isRelated) {
    return buildUnrelatedResponse(storedReport);
  }

  if (!process.env.GEMINI_API_KEY) {
    return buildRuleBasedChatResponse(storedReport, trimmedQuestion, context);
  }

  try {
    const aiResult = await runAIChatResponse(storedReport, trimmedQuestion, context);

    if (aiResult.unrelated) {
      return buildUnrelatedResponse(storedReport);
    }

    const relevantClauses = mapReferencedClauses(storedReport, aiResult.referencedClauseIds, context.relevantClauses);
    const fallbackResponse = buildRuleBasedChatResponse(storedReport, trimmedQuestion, context);

    return {
      answer:
        ensureEvidenceCitation(sanitizeAnswer(aiResult.answer), relevantClauses) || fallbackResponse.answer,
      relevantClauses: relevantClauses.length > 0 ? relevantClauses : fallbackResponse.relevantClauses,
      riskLevel: deriveRiskLevel(relevantClauses, fallbackResponse.riskLevel),
      suggestedNextStep:
        sanitizeSentence(aiResult.suggestedNextStep) || fallbackResponse.suggestedNextStep,
      disclaimer: CHAT_DISCLAIMER,
    };
  } catch (error) {
    if (error instanceof AIJsonParseError) {
      console.warn('Chat AI returned invalid JSON. Falling back to deterministic chat response.');
    } else {
      console.error('Chat AI failed. Falling back to deterministic chat response.', error);
    }

    return buildRuleBasedChatResponse(storedReport, trimmedQuestion, context);
  }
}

function buildQuestionContext(question: string, storedReport: StoredReport): QuestionContext {
  const normalized = normalize(question);
  const intent = detectIntent(normalized);
  const relevantClauses = selectRelevantClauses(normalized, intent, storedReport.report.clauses);
  const isGeneralDocumentQuestion = /document|report|risk|sign|signing|agreement|contract|clause|question|negotiate|ip|rights|terminate|notice|warning|danger/i.test(
    question
  );

  return {
    isRelated: relevantClauses.length > 0 || isGeneralDocumentQuestion,
    relevantClauses,
    intent,
  };
}

async function runAIChatResponse(
  storedReport: StoredReport,
  question: string,
  context: QuestionContext
): Promise<AIChatResult> {
  return generateAndParseJson<AIChatResult>({
    label: 'LEXGUARD follow-up chat',
    retries: 1,
    repairWithModel: true,
    temperature: 0.2,
    maxTokens: 2048,
    systemInstruction: [
      'You are LexGuard, a legal awareness assistant for contract intelligence reports.',
      'Answer only using the provided report facts and exact evidence from the uploaded document.',
      'If the question is unrelated to the document or report, set "unrelated" to true and politely redirect.',
      'Do not provide legal advice or legal certainty.',
      'Keep the answer concise, practical, and grounded in the cited clauses.',
      'Return JSON only.',
    ].join('\n'),
    prompt: buildAIChatPrompt(storedReport, question, context),
    validate: isAIChatResult,
  });
}

function buildAIChatPrompt(
  storedReport: StoredReport,
  question: string,
  context: QuestionContext
): string {
  const clauseContext = context.relevantClauses.length > 0 ? context.relevantClauses : storedReport.report.clauses.slice(0, 3);
  const documentSnippets = buildDocumentContextSnippets(storedReport.documentText, question, clauseContext);

  return [
    `User question: ${question}`,
    '',
    `Document type: ${storedReport.documentType}`,
    `Overall risk: ${storedReport.report.overallRiskLevel} (${storedReport.report.overallRiskScore}/100)`,
    `Signing recommendation: ${storedReport.report.signingRecommendation}`,
    `Intent hint: ${context.intent}`,
    '',
    'Original document evidence excerpts:',
    ...clauseContext.map((clause) => `- ${clause.clauseText}`),
    '',
    'Stored extracted document text snippets:',
    ...documentSnippets.map((snippet) => `- ${snippet}`),
    '',
    'Relevant clause sources:',
    ...clauseContext.map((clause) =>
      JSON.stringify({
        clauseId: clause.id,
        clauseType: clause.clauseType,
        severity: clause.severity,
        riskScore: clause.riskScore,
        evidence: clause.clauseText,
        plainLanguageExplanation: clause.plainLanguageExplanation,
        whyItMatters: clause.whyItMatters,
        realWorldConsequence: clause.realWorldConsequence,
        suggestedAction: clause.suggestedAction,
        negotiationTip: clause.negotiationTip,
      })
    ),
    '',
    'Recommended questions from the report:',
    ...storedReport.report.recommendedQuestions.slice(0, 5).map((value) => `- ${value}`),
    '',
    'Top concerns from the report:',
    ...storedReport.report.topConcerns.slice(0, 4).map((value) => `- ${value}`),
    '',
    'Return JSON with this exact shape:',
    '{"answer":"...","referencedClauseIds":["clause_1"],"suggestedNextStep":"...","unrelated":false}',
  ].join('\n');
}

function buildDocumentContextSnippets(
  documentText: string,
  question: string,
  clauses: AnalyzedClause[]
): string[] {
  const snippets: string[] = [];
  const compactText = documentText.replace(/\s+/g, ' ').trim();

  for (const clause of clauses) {
    const snippet = findSnippetInDocument(compactText, clause.clauseText);
    if (snippet) {
      snippets.push(snippet);
    }
  }

  if (snippets.length === 0) {
    const keywordSnippet = findSnippetByKeywords(compactText, tokenize(normalize(question)));
    if (keywordSnippet) {
      snippets.push(keywordSnippet);
    }
  }

  if (snippets.length === 0 && compactText) {
    snippets.push(compactText.slice(0, 320));
  }

  return unique(snippets).slice(0, MAX_RELEVANT_CLAUSES);
}

function buildRuleBasedChatResponse(
  storedReport: StoredReport,
  question: string,
  context: QuestionContext
): ChatResponse {
  const relevantClauses = toRelevantClauseReferences(context.relevantClauses);
  const answer = buildRuleBasedAnswer(storedReport, question, context, relevantClauses);
  const suggestedNextStep = buildSuggestedNextStep(storedReport, context.relevantClauses);

  return {
    answer,
    relevantClauses,
    riskLevel: deriveRiskLevel(relevantClauses, storedReport.report.overallRiskLevel),
    suggestedNextStep,
    disclaimer: CHAT_DISCLAIMER,
  };
}

function buildRuleBasedAnswer(
  storedReport: StoredReport,
  question: string,
  context: QuestionContext,
  relevantClauses: RelevantClauseReference[]
): string {
  const report = storedReport.report;
  const topClause = context.relevantClauses[0];

  switch (context.intent) {
    case 'most_dangerous':
      if (topClause) {
        return `${topClause.clauseType} looks like the strongest concern in this report. It is rated ${topClause.severity} (${topClause.riskScore}/100). Evidence: "${topClause.clauseText}" In plain terms, ${lowercaseFirst(topClause.plainLanguageExplanation)} This matters because ${lowercaseFirst(topClause.whyItMatters)}.`;
      }
      break;
    case 'negotiate':
      if (topClause) {
        return `Yes, this is a clause you should try to negotiate. The most relevant item is the ${topClause.clauseType} clause rated ${topClause.severity} (${topClause.riskScore}/100). Evidence: "${topClause.clauseText}" The report suggests: ${topClause.suggestedAction} A practical negotiation angle is: ${topClause.negotiationTip}`;
      }
      break;
    case 'ip_rights':
      if (topClause) {
        return `This document could affect your IP rights. The strongest IP-related clause is rated ${topClause.severity} (${topClause.riskScore}/100). Evidence: "${topClause.clauseText}" In plain language, ${lowercaseFirst(topClause.plainLanguageExplanation)} The likely consequence is that ${lowercaseFirst(topClause.realWorldConsequence)}`;
      }
      break;
    case 'termination':
      if (topClause) {
        return `Termination risk is present in this document. The most relevant clause is rated ${topClause.severity} (${topClause.riskScore}/100). Evidence: "${topClause.clauseText}" The report says this matters because ${lowercaseFirst(topClause.whyItMatters)} and the real-world consequence could be that ${lowercaseFirst(topClause.realWorldConsequence)}`;
      }
      break;
    case 'questions_before_signing':
      return `Before signing, the report suggests focusing on the biggest risk areas first. The overall recommendation is "${report.signingRecommendation}" with an overall risk level of ${report.overallRiskLevel}. The most useful questions to raise are: ${report.recommendedQuestions.slice(0, 3).join(' ')}.`;
    default:
      break;
  }

  if (relevantClauses.length > 0) {
    const clause = context.relevantClauses[0];
    if (clause) {
      return `Based on the report, the most relevant clause here is ${clause.clauseType}, rated ${clause.severity} (${clause.riskScore}/100). Evidence: "${clause.clauseText}" In plain language, ${lowercaseFirst(clause.plainLanguageExplanation)} This matters because ${lowercaseFirst(clause.whyItMatters)}.`;
    }
  }

  return `This question relates to the document generally rather than one clause. The report rates the document ${report.overallRiskLevel} overall (${report.overallRiskScore}/100), and the main concerns are ${report.topConcerns.slice(0, 2).join(' ')}.`;
}

function buildUnrelatedResponse(storedReport: StoredReport): ChatResponse {
  return {
    answer:
      'I can only answer questions about the uploaded document and the generated risk report. Try asking about a clause, a risk area, your IP rights, termination terms, or what to negotiate before signing.',
    relevantClauses: [],
    riskLevel: storedReport.report.overallRiskLevel,
    suggestedNextStep:
      'Ask a document-specific question such as "What is the most dangerous clause?" or "What should I ask before signing?"',
    disclaimer: CHAT_DISCLAIMER,
  };
}

function buildSuggestedNextStep(storedReport: StoredReport, clauses: AnalyzedClause[]): string {
  if (clauses[0]?.suggestedAction) {
    return clauses[0].suggestedAction;
  }

  return (
    storedReport.report.recommendedQuestions[0] ||
    `Review the ${storedReport.report.overallRiskLevel.toLowerCase()} risk findings and ask the other side for written clarification before signing.`
  );
}

function selectRelevantClauses(
  normalizedQuestion: string,
  intent: QuestionContext['intent'],
  clauses: AnalyzedClause[]
): AnalyzedClause[] {
  const tokens = tokenize(normalizedQuestion);

  const scored = clauses
    .map((clause) => ({
      clause,
      score: scoreClauseForQuestion(clause, tokens, normalizedQuestion, intent),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.clause.riskScore - left.clause.riskScore;
    })
    .slice(0, MAX_RELEVANT_CLAUSES)
    .map((entry) => entry.clause);

  if (scored.length > 0) {
    return scored;
  }

  if (intent === 'most_dangerous' || intent === 'questions_before_signing' || intent === 'negotiate') {
    return [...clauses].sort((left, right) => right.riskScore - left.riskScore).slice(0, MAX_RELEVANT_CLAUSES);
  }

  return [];
}

function scoreClauseForQuestion(
  clause: AnalyzedClause,
  tokens: string[],
  normalizedQuestion: string,
  intent: QuestionContext['intent']
): number {
  const haystack = normalize(
    [
      clause.clauseType,
      clause.clauseText,
      clause.plainLanguageExplanation,
      clause.whyItMatters,
      clause.realWorldConsequence,
      clause.suggestedAction,
      clause.negotiationTip,
    ].join(' ')
  );

  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 8;
    }
  }

  const typeKeywords = clauseTypeKeywords(clause.clauseType);
  for (const keyword of typeKeywords) {
    if (normalizedQuestion.includes(keyword)) {
      score += 22;
    }
  }

  if (intent === 'most_dangerous') {
    score += clause.riskScore;
  }

  if (intent === 'negotiate') {
    score += clause.riskScore >= 60 ? 25 : 8;
  }

  if (intent === 'ip_rights' && clause.clauseType === 'IP Ownership') {
    score += 40;
  }

  if (intent === 'termination' && clause.clauseType === 'Termination') {
    score += 40;
  }

  if (/without notice|notice/.test(normalizedQuestion) && /without notice|notice/.test(haystack)) {
    score += 30;
  }

  if (/can i negotiate|negotiate/.test(normalizedQuestion) && clause.negotiationTip) {
    score += 18;
  }

  return score;
}

function detectIntent(question: string): QuestionContext['intent'] {
  if (/most dangerous|biggest risk|worst clause|most risky/.test(question)) {
    return 'most_dangerous';
  }
  if (/negotiate|negotiable|push back/.test(question)) {
    return 'negotiate';
  }
  if (/\bip\b|intellectual property|ownership rights|rights\b/.test(question)) {
    return 'ip_rights';
  }
  if (/terminate|termination|without notice|fired|dismiss/.test(question)) {
    return 'termination';
  }
  if (/before signing|ask before signing|what should i ask/.test(question)) {
    return 'questions_before_signing';
  }
  return 'general';
}

function clauseTypeKeywords(clauseType: ClauseType): string[] {
  switch (clauseType) {
    case 'IP Ownership':
      return ['ip', 'intellectual property', 'ownership'];
    case 'Termination':
      return ['terminate', 'termination', 'notice', 'fired'];
    case 'Arbitration':
      return ['arbitration', 'dispute', 'court', 'trial'];
    case 'Non-compete':
      return ['non compete', 'non-compete', 'competition'];
    case 'Payment':
      return ['payment', 'fee', 'refund', 'non-refundable'];
    case 'Renewal':
      return ['renewal', 'renew', 'cancellation'];
    case 'Privacy':
    case 'Data Collection':
      return ['privacy', 'data', 'sharing', 'collection'];
    case 'Liability':
    case 'Indemnification':
      return ['liability', 'indemnify', 'indemnification', 'hold harmless'];
    default:
      return [normalize(clauseType)];
  }
}

function toRelevantClauseReferences(clauses: AnalyzedClause[]): RelevantClauseReference[] {
  return clauses.slice(0, MAX_RELEVANT_CLAUSES).map((clause) => ({
    clauseId: clause.id,
    clauseType: clause.clauseType,
    severity: clause.severity,
    evidence: clause.clauseText,
  }));
}

function mapReferencedClauses(
  storedReport: StoredReport,
  referencedClauseIds: string[],
  fallbackClauses: AnalyzedClause[]
): RelevantClauseReference[] {
  const clausesById = new Map(storedReport.report.clauses.map((clause) => [clause.id, clause]));
  const mapped = referencedClauseIds
    .map((clauseId) => clausesById.get(clauseId))
    .filter((clause): clause is AnalyzedClause => Boolean(clause));

  if (mapped.length > 0) {
    return toRelevantClauseReferences(mapped);
  }

  return toRelevantClauseReferences(fallbackClauses);
}

function deriveRiskLevel(
  relevantClauses: RelevantClauseReference[],
  fallbackLevel: RiskLevel
): RiskLevel {
  if (relevantClauses.some((clause) => clause.severity === 'Critical')) {
    return 'Critical';
  }
  if (relevantClauses.some((clause) => clause.severity === 'High')) {
    return 'High';
  }
  if (relevantClauses.some((clause) => clause.severity === 'Medium')) {
    return 'Medium';
  }
  if (relevantClauses.some((clause) => clause.severity === 'Low')) {
    return 'Low';
  }

  return fallbackLevel;
}

function isAIChatResult(value: unknown): value is AIChatResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.answer === 'string' &&
    Array.isArray(candidate.referencedClauseIds) &&
    candidate.referencedClauseIds.every((item) => typeof item === 'string') &&
    typeof candidate.suggestedNextStep === 'string' &&
    (typeof candidate.unrelated === 'boolean' || typeof candidate.unrelated === 'undefined')
  );
}

function tokenize(value: string): string[] {
  return unique(
    value
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

function unique(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function findSnippetInDocument(documentText: string, evidence: string): string | null {
  const normalizedEvidence = evidence.replace(/\s+/g, ' ').trim();
  if (!normalizedEvidence) {
    return null;
  }

  const directIndex = documentText.indexOf(normalizedEvidence);
  if (directIndex >= 0) {
    return sliceWithContext(documentText, directIndex, normalizedEvidence.length);
  }

  const shortenedEvidence = normalizedEvidence.slice(0, Math.min(80, normalizedEvidence.length));
  const partialIndex = shortenedEvidence ? documentText.indexOf(shortenedEvidence) : -1;
  if (partialIndex >= 0) {
    return sliceWithContext(documentText, partialIndex, shortenedEvidence.length);
  }

  return null;
}

function findSnippetByKeywords(documentText: string, keywords: string[]): string | null {
  const match = keywords.find((keyword) => keyword.length > 3 && documentText.toLowerCase().includes(keyword));
  if (!match) {
    return null;
  }

  const index = documentText.toLowerCase().indexOf(match);
  if (index < 0) {
    return null;
  }

  return sliceWithContext(documentText, index, match.length);
}

function sliceWithContext(text: string, startIndex: number, matchLength: number): string {
  const start = Math.max(0, startIndex - 100);
  const end = Math.min(text.length, startIndex + matchLength + 180);
  const snippet = text.slice(start, end).trim();
  return snippet.length > 320 ? `${snippet.slice(0, 317)}...` : snippet;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function sanitizeAnswer(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitizeSentence(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function ensureEvidenceCitation(answer: string, relevantClauses: RelevantClauseReference[]): string {
  if (!answer) {
    return answer;
  }

  if (relevantClauses.length === 0) {
    return answer;
  }

  const hasClauseMention = relevantClauses.some(
    (clause) =>
      answer.toLowerCase().includes(clause.clauseType.toLowerCase()) ||
      answer.includes(clause.evidence.slice(0, Math.min(20, clause.evidence.length)))
  );

  if (hasClauseMention) {
    return answer;
  }

  const primaryClause = relevantClauses[0];
  return `${answer} Relevant evidence: "${primaryClause.evidence}"`;
}

function lowercaseFirst(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}
