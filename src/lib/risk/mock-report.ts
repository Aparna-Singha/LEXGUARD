/**
 * Mock report for development/demo when no API key is available.
 * Clearly marked as mock data.
 */

import { RiskReport } from '@/lib/types';

export function getMockReport(documentType: string): RiskReport {
  return {
    documentType,
    overallRiskScore: 68,
    overallRiskLevel: 'High',
    executiveSummary:
      '⚠️ MOCK DATA — This is a sample report generated without AI analysis. Set GEMINI_API_KEY in .env.local for real analysis.\n\n' +
      'This document contains several concerning clauses that warrant careful review. The analysis identified high-risk provisions related to intellectual property assignment, non-compete restrictions, and termination conditions. Multiple ambiguous terms were found that could be interpreted unfavorably. The overall risk level is elevated due to the combination of restrictive covenants and one-sided termination provisions.\n\n' +
      'Key areas of concern include a broad IP assignment clause that extends beyond work-related creations, an unusually restrictive non-compete provision, and an arbitration clause that limits your legal remedies. Several financial obligations are buried in secondary clauses that may not be immediately obvious.',
    topConcerns: [
      'Broad intellectual property assignment covering personal projects',
      'Non-compete clause with excessive geographic and time restrictions',
      'Mandatory arbitration with company-selected arbitrator',
      'Automatic renewal with penalties for early termination',
      'Vague "cause" definition for termination without severance',
    ],
    clauses: [
      {
        id: 'clause_1',
        clauseType: 'IP Ownership',
        severity: 'Critical',
        riskScore: 92,
        clauseText:
          'All intellectual property, inventions, discoveries, and creative works conceived, developed, or reduced to practice during the term of this agreement, whether or not during working hours or using company resources, shall be the sole and exclusive property of the Company.',
        plainLanguageExplanation:
          'Everything you create — even personal projects made at home on weekends — belongs to the company. This includes side projects, open-source contributions, and personal inventions.',
        whyItMatters:
          'This clause could prevent you from working on any personal projects, contributing to open source, or building a side business while employed.',
        realWorldConsequence:
          'If you build a successful side project or app in your free time, the company could claim ownership of it and any revenue it generates.',
        suggestedAction:
          'Negotiate to limit IP assignment to work created using company resources or directly related to company business.',
        negotiationTip:
          'Propose adding: "excluding inventions developed entirely on Employee\'s own time without use of Company resources and unrelated to Company business."',
        confidence: 0.95,
      },
      {
        id: 'clause_2',
        clauseType: 'Non-compete',
        severity: 'High',
        riskScore: 78,
        clauseText:
          'Employee agrees not to engage in any business or activity that competes with the Company within a radius of 100 miles for a period of 24 months following termination of employment.',
        plainLanguageExplanation:
          'After leaving, you cannot work for any competitor within 100 miles for 2 years. This could severely limit your job options.',
        whyItMatters:
          'A 24-month, 100-mile non-compete is unusually restrictive and may not be enforceable in many states, but fighting it in court is expensive.',
        realWorldConsequence:
          'You might be unable to find work in your field for two years after leaving, forcing you into a different industry or to relocate.',
        suggestedAction:
          'Negotiate to reduce to 6-12 months and limit to direct competitors only.',
        negotiationTip:
          'Many jurisdictions limit non-competes. Ask: "Can we reduce this to 12 months and define specific competitors rather than a broad restriction?"',
        confidence: 0.9,
      },
      {
        id: 'clause_3',
        clauseType: 'Arbitration',
        severity: 'High',
        riskScore: 72,
        clauseText:
          'Any dispute arising from this agreement shall be resolved through binding arbitration administered by an arbitration service selected by the Company, with the arbitration taking place in the Company\'s home jurisdiction.',
        plainLanguageExplanation:
          'If you have a dispute with the company, you cannot go to court. Instead, the company gets to choose the arbitration service and location.',
        whyItMatters:
          'Company-selected arbitrators may have a bias toward repeat clients (the company). You also lose the right to a jury trial.',
        realWorldConsequence:
          'If the company wrongs you (unpaid wages, discrimination, etc.), you\'re forced into a process the company controls rather than having access to the public court system.',
        suggestedAction:
          'Request mutual agreement on arbitration service, or add exceptions for certain claim types.',
        negotiationTip:
          'Ask for: "Arbitration through a mutually agreed-upon service such as AAA or JAMS, with costs shared equally."',
        confidence: 0.88,
      },
      {
        id: 'clause_4',
        clauseType: 'Termination',
        severity: 'Medium',
        riskScore: 55,
        clauseText:
          'The Company may terminate this agreement at any time for Cause, which shall be determined at the sole discretion of the Company.',
        plainLanguageExplanation:
          'The company can fire you for "cause" — but they get to decide what "cause" means, without your input.',
        whyItMatters:
          'Without a clear definition of "cause," the company could terminate you for almost any reason and deny severance or benefits.',
        realWorldConsequence:
          'You could be fired without severance for something trivial, and have no recourse because "cause" was never clearly defined.',
        suggestedAction: 'Request a specific, enumerated list of what constitutes "cause."',
        negotiationTip:
          'Ask: "Can we define cause as: conviction of a felony, material breach after written notice and cure period, or willful misconduct?"',
        confidence: 0.85,
      },
      {
        id: 'clause_5',
        clauseType: 'Payment',
        severity: 'Medium',
        riskScore: 45,
        clauseText:
          'Payment terms are Net 60 from invoice date, subject to adjustment at Company\'s discretion.',
        plainLanguageExplanation:
          'You won\'t get paid until 60 days after invoicing, and the company can extend that timeline whenever they want.',
        whyItMatters:
          'Net 60 is already slow. "Subject to adjustment" means they could delay payments indefinitely.',
        realWorldConsequence:
          'Cash flow problems — you might have to cover 2+ months of expenses before seeing any payment.',
        suggestedAction: 'Negotiate to Net 30 with a late payment penalty clause.',
        negotiationTip:
          'Propose: "Payment terms Net 30 with 1.5% monthly interest on overdue balances."',
        confidence: 0.82,
      },
      {
        id: 'clause_6',
        clauseType: 'Renewal',
        severity: 'Medium',
        riskScore: 50,
        clauseText:
          'This agreement shall automatically renew for successive one-year terms unless either party provides written notice of non-renewal at least 90 days prior to the expiration date.',
        plainLanguageExplanation:
          'The contract auto-renews every year. You must remember to cancel exactly 90 days before the renewal date, or you\'re locked in for another year.',
        whyItMatters:
          '90 days is a long notice period that\'s easy to miss, locking you into unwanted commitments.',
        realWorldConsequence:
          'If you forget to cancel by the deadline, you\'re bound for another full year — potentially with outdated or unfavorable terms.',
        suggestedAction: 'Reduce notice period to 30 days or switch to manual renewal.',
        negotiationTip:
          'Ask: "Can we change to 30-day notice and add a reminder obligation?"',
        confidence: 0.8,
      },
    ],
    riskCategories: {
      financial: {
        score: 55,
        summary:
          'Moderate financial risks due to extended payment terms and automatic renewal with penalties.',
        risks: [
          'Net 60 payment terms with discretionary adjustments',
          'Early termination penalties not clearly defined',
          'Automatic renewal could trap you in unfavorable terms',
        ],
      },
      privacy: {
        score: 35,
        summary: 'Some data collection provisions but within typical range.',
        risks: [
          'Company may monitor work communications',
          'Data retention period not specified',
        ],
      },
      employment: {
        score: 72,
        summary:
          'High employment risk due to restrictive covenants and vague termination terms.',
        risks: [
          'Broad non-compete limits future opportunities',
          'Vague "cause" definition for termination',
          'No guaranteed severance package',
        ],
      },
      intellectualProperty: {
        score: 88,
        summary:
          'Critical IP risk — the broad assignment clause could capture personal creations.',
        risks: [
          'All IP assigned to company regardless of when/where created',
          'No carve-out for pre-existing IP',
          'No provision for personal projects',
        ],
      },
      termination: {
        score: 60,
        summary: 'Significant termination risks with one-sided provisions.',
        risks: [
          'Company can terminate for vaguely defined "cause"',
          'No mutual termination rights',
          'Restrictive post-termination obligations',
        ],
      },
      disputeResolution: {
        score: 70,
        summary: 'Dispute resolution heavily favors the company.',
        risks: [
          'Mandatory arbitration with company-chosen provider',
          'Arbitration in company\'s jurisdiction',
          'Waiver of right to jury trial',
        ],
      },
      compliance: {
        score: 30,
        summary: 'Standard compliance obligations with minor concerns.',
        risks: [
          'Broad confidentiality obligations that survive termination indefinitely',
          'Compliance with unspecified future policies',
        ],
      },
    },
    ambiguousTerms: [
      {
        term: 'Cause',
        evidence:
          'The Company may terminate this agreement at any time for Cause, which shall be determined at the sole discretion of the Company.',
        whyAmbiguous:
          '"Cause" is not defined anywhere in the agreement, giving the company unlimited discretion to determine what constitutes grounds for termination.',
        questionToAsk:
          'Can you provide a specific, exhaustive list of what constitutes "cause" for termination?',
      },
      {
        term: 'reasonable efforts',
        evidence:
          'Employee shall use reasonable efforts to complete assigned tasks in a timely manner.',
        whyAmbiguous:
          '"Reasonable efforts" has no measurable standard and could be interpreted differently by each party.',
        questionToAsk:
          'Can we define specific deliverables, timelines, and performance metrics instead of "reasonable efforts"?',
      },
      {
        term: 'at Company\'s discretion',
        evidence: 'Payment terms are Net 60 from invoice date, subject to adjustment at Company\'s discretion.',
        whyAmbiguous:
          'This gives the company unlimited power to change payment terms without your agreement.',
        questionToAsk: 'What specific circumstances would trigger a payment term adjustment, and what is the maximum delay?',
      },
    ],
    hiddenObligations: [
      {
        obligation: 'Post-termination non-solicitation',
        evidence:
          'For a period of 18 months following termination, Employee shall not directly or indirectly solicit any clients, customers, or employees of the Company.',
        impact:
          'Even after leaving, you cannot work with any of the company\'s clients or recruit former colleagues for 18 months.',
        suggestedAction:
          'Negotiate to limit non-solicitation to clients you directly worked with, and reduce the period to 6-12 months.',
      },
      {
        obligation: 'Compliance with future policies',
        evidence:
          'Employee agrees to comply with all Company policies, including those adopted after the execution of this agreement.',
        impact:
          'The company can create new policies at any time, and you\'re automatically bound by them — even if they change your working conditions.',
        suggestedAction:
          'Add: "Material changes to policies require written notice and Employee\'s acknowledgment."',
      },
    ],
    recommendedQuestions: [
      'Can the IP assignment clause be limited to work created using company resources and related to company business?',
      'What specific actions constitute "cause" for termination? Can we enumerate them?',
      'Is the non-compete negotiable? Can we reduce it to 12 months with a narrower geographic scope?',
      'Can we switch to Net 30 payment terms with a fixed schedule?',
      'Is there a severance package if the company terminates without cause?',
      'Can we use a mutually agreed-upon arbitration service instead of one selected by the company?',
      'Are there any carve-outs for pre-existing intellectual property I bring to the role?',
    ],
    signingRecommendation: 'Negotiate before signing',
    disclaimer:
      '⚠️ MOCK DATA — This is a sample report for demonstration purposes. This analysis is generated by AI for informational purposes only. It does not constitute legal advice. Consult a qualified legal professional before making any decisions based on this report.',
  };
}
