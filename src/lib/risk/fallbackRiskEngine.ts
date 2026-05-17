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

export type FallbackReason =
  | 'missing_api_key'
  | 'ai_failed'
  | 'invalid_ai_output'
  | 'forced_dev_mock_mode';

export interface FallbackRiskEngineOptions {
  fallbackReason: FallbackReason;
  maxClauses?: number;
}

interface RiskPhraseRule {
  id: string;
  label: string;
  pattern: RegExp;
  clauseType: ClauseType;
  severity: RiskLevel;
  riskScore: number;
  categories: Array<keyof RiskCategories>;
  plainLanguageExplanation: string;
  whyItMatters: string;
  realWorldConsequence: string;
  suggestedAction: string;
  negotiationTip: string;
  hiddenObligation?: {
    obligation: string;
    impact: string;
    suggestedAction: string;
  };
  ambiguity?: {
    term: string;
    whyAmbiguous: string;
    questionToAsk: string;
  };
}

interface RuleMatch {
  rule: RiskPhraseRule;
  evidence: string;
}

const REPORT_DISCLAIMER = 'This tool provides legal awareness, not legal advice.';
const DEFAULT_MAX_CLAUSES = 18;
const MAX_SEGMENTS = 160;
const MIN_SEGMENT_LENGTH = 24;
const GENERIC_CATEGORY_SUMMARY =
  'No significant risks were detected in this category from the extracted text.';

const RISK_PHRASE_RULES: RiskPhraseRule[] = [
  {
    id: 'employment_non_compete',
    label: 'non-compete',
    pattern: /\bnon[-\s]?compete\b/i,
    clauseType: 'Non-compete',
    severity: 'High',
    riskScore: 78,
    categories: ['employment', 'compliance'],
    plainLanguageExplanation:
      'This clause can restrict where you work or who you work for after the agreement ends.',
    whyItMatters:
      'A non-compete can limit future jobs, side projects, or client work in your field.',
    realWorldConsequence:
      'You may be blocked from accepting a new role or face legal threats if the company claims it is competitive.',
    suggestedAction:
      'Ask to narrow the scope to specific competitors, a short time period, and a clearly defined geography.',
    negotiationTip:
      'Propose limiting the clause to direct competitors for no more than 6 to 12 months.',
  },
  {
    id: 'employment_non_solicitation',
    label: 'non-solicitation',
    pattern: /\bnon[-\s]?solicit(?:ation)?\b|\bnot solicit\b/i,
    clauseType: 'Non-compete',
    severity: 'High',
    riskScore: 70,
    categories: ['employment', 'compliance'],
    plainLanguageExplanation:
      'This clause can stop you from working with former clients, customers, or co-workers after leaving.',
    whyItMatters:
      'Non-solicitation restrictions can quietly reduce your ability to build a new business or recruit a team.',
    realWorldConsequence:
      'You might lose business opportunities or be accused of breach for contacting people you previously worked with.',
    suggestedAction:
      'Ask to limit the restriction to clients or employees you directly worked with and shorten the duration.',
    negotiationTip:
      'Request a shorter term and a narrower definition tied only to active relationships during the engagement.',
    hiddenObligation: {
      obligation: 'Post-termination non-solicitation obligation',
      impact:
        'The contract may keep limiting who you can contact or work with even after the relationship ends.',
      suggestedAction:
        'Ask for a shorter post-termination period and a narrow definition of covered contacts.',
    },
  },
  {
    id: 'employment_moonlighting',
    label: 'moonlighting',
    pattern: /\bmoonlighting\b|\boutside employment\b|\boutside work\b/i,
    clauseType: 'Other',
    severity: 'Medium',
    riskScore: 54,
    categories: ['employment'],
    plainLanguageExplanation:
      'This clause may limit your ability to take second jobs, freelance work, or side projects.',
    whyItMatters:
      'Moonlighting restrictions can reduce income options and create conflict over personal projects.',
    realWorldConsequence:
      'You could be disciplined or terminated for doing outside work that you thought was harmless.',
    suggestedAction:
      'Ask for written carve-outs for passive investments, open-source work, and unrelated side projects.',
    negotiationTip:
      'Propose language allowing outside work that does not conflict with duties or use confidential information.',
  },
  {
    id: 'employment_exclusive_employment',
    label: 'exclusive employment',
    pattern:
      /\bexclusive employment\b|\bno other employment\b|\bdevote .*full working time\b|\bwork exclusively for\b/i,
    clauseType: 'Other',
    severity: 'High',
    riskScore: 68,
    categories: ['employment'],
    plainLanguageExplanation:
      'This clause can require you to work only for this employer or client and block other professional work.',
    whyItMatters:
      'Exclusive employment language can prevent consulting, freelance work, or even unrelated paid activities.',
    realWorldConsequence:
      'You may need approval before taking outside work or risk breach if you earn income elsewhere.',
    suggestedAction:
      'Ask for a conflict-based standard instead of a blanket exclusivity requirement.',
    negotiationTip:
      'Suggest allowing outside work that does not interfere with duties or compete directly.',
    hiddenObligation: {
      obligation: 'Exclusive service obligation',
      impact:
        'The contract may require you to prioritize this relationship over any other work arrangement.',
      suggestedAction:
        'Ask for exceptions for outside projects that do not create a real conflict of interest.',
    },
  },
  {
    id: 'employment_terminate_without_notice',
    label: 'terminate without notice',
    pattern:
      /\bterminate(?:d|s|ion)?\b[\s\S]{0,120}\bwithout notice\b|\bwithout notice\b[\s\S]{0,120}\bterminate(?:d|s|ion)?\b/i,
    clauseType: 'Termination',
    severity: 'Critical',
    riskScore: 86,
    categories: ['termination', 'employment'],
    plainLanguageExplanation:
      'This clause may let the other side end the agreement immediately without warning.',
    whyItMatters:
      'Termination without notice can leave you with no time to fix issues, protect your income, or plan a transition.',
    realWorldConsequence:
      'You could lose access, income, or benefits abruptly with little practical recourse.',
    suggestedAction:
      'Ask for notice, a cure period, and a clear definition of the events that allow immediate termination.',
    negotiationTip:
      'Propose immediate termination only for serious misconduct, with notice for ordinary breaches.',
  },
  {
    id: 'ip_all_intellectual_property',
    label: 'all intellectual property',
    pattern: /\ball intellectual property\b/i,
    clauseType: 'IP Ownership',
    severity: 'Critical',
    riskScore: 92,
    categories: ['intellectualProperty', 'compliance'],
    plainLanguageExplanation:
      'This clause can claim ownership over all covered work product, often more broadly than expected.',
    whyItMatters:
      'Broad IP ownership language can capture side projects, templates, inventions, or other material you expected to keep.',
    realWorldConsequence:
      'The company may claim ownership of work you create and restrict how you reuse or monetize it later.',
    suggestedAction:
      'Ask for carve-outs for pre-existing materials, personal projects, and work unrelated to the engagement.',
    negotiationTip:
      'Limit assignment to deliverables created specifically for the engagement using company resources or confidential information.',
    hiddenObligation: {
      obligation: 'Broad IP assignment obligation',
      impact:
        'You may be giving up ownership or reuse rights in far more work product than you intended.',
      suggestedAction:
        'Ask for narrow assignment language and explicit exclusions for pre-existing and personal materials.',
    },
  },
  {
    id: 'ip_hereby_assigns',
    label: 'hereby assigns',
    pattern: /\bhereby assigns?\b/i,
    clauseType: 'IP Ownership',
    severity: 'Critical',
    riskScore: 88,
    categories: ['intellectualProperty'],
    plainLanguageExplanation:
      'This phrase usually means ownership transfers automatically now, not only later after additional paperwork.',
    whyItMatters:
      'Automatic assignment language can transfer rights immediately with very little room for later dispute.',
    realWorldConsequence:
      'You may permanently lose ownership of covered inventions or creative work as soon as they are created.',
    suggestedAction:
      'Ask to limit the assignment to clearly defined deliverables created for the engagement.',
    negotiationTip:
      'Propose assignment only after payment and only for work specifically commissioned under the contract.',
  },
  {
    id: 'ip_perpetual_license',
    label: 'perpetual license',
    pattern: /\bperpetual license\b/i,
    clauseType: 'IP Ownership',
    severity: 'High',
    riskScore: 74,
    categories: ['intellectualProperty'],
    plainLanguageExplanation:
      'This clause can grant rights that never expire.',
    whyItMatters:
      'A perpetual license can outlast the business relationship and remain valuable long after the deal ends.',
    realWorldConsequence:
      'The other party may keep using your work forever even if the relationship ends or circumstances change.',
    suggestedAction:
      'Ask whether the license really needs to be perpetual and whether termination rights should exist.',
    negotiationTip:
      'Suggest a narrower term, revocation rights for breach, or use limits tied to the purpose of the deal.',
  },
  {
    id: 'ip_irrevocable_license',
    label: 'irrevocable license',
    pattern: /\birrevocable license\b/i,
    clauseType: 'IP Ownership',
    severity: 'High',
    riskScore: 76,
    categories: ['intellectualProperty'],
    plainLanguageExplanation:
      'This clause can make the granted rights impossible to take back later.',
    whyItMatters:
      'Irrevocable rights can survive disputes, non-payment, or termination unless the contract says otherwise.',
    realWorldConsequence:
      'Even if the relationship breaks down, the other party may still keep rights to use your work.',
    suggestedAction:
      'Ask for revocation rights in cases like non-payment, misuse, or material breach.',
    negotiationTip:
      'Tie continued license rights to compliance with payment and confidentiality obligations.',
  },
  {
    id: 'ip_worldwide_royalty_free',
    label: 'worldwide royalty-free',
    pattern: /\bworldwide royalty[-\s]?free\b/i,
    clauseType: 'IP Ownership',
    severity: 'High',
    riskScore: 72,
    categories: ['intellectualProperty'],
    plainLanguageExplanation:
      'This clause can give the other side broad global usage rights without additional payment.',
    whyItMatters:
      'Worldwide royalty-free language often means valuable rights are being granted without geographic or payment limits.',
    realWorldConsequence:
      'Your work could be used in many markets forever without any additional compensation.',
    suggestedAction:
      'Ask whether the territory and royalty structure can be narrowed to match the business need.',
    negotiationTip:
      'Propose a limited territory, a specific use case, or additional fees for expanded uses.',
  },
  {
    id: 'ip_derivative_works',
    label: 'derivative works',
    pattern: /\bderivative works?\b/i,
    clauseType: 'IP Ownership',
    severity: 'High',
    riskScore: 70,
    categories: ['intellectualProperty'],
    plainLanguageExplanation:
      'This clause may let the other side modify, adapt, or build on your original work.',
    whyItMatters:
      'Derivative rights can weaken your control over how work is reused or altered later.',
    realWorldConsequence:
      'The other party may create modified versions of your work and keep using them without further approval.',
    suggestedAction:
      'Ask for limits on modification rights and a clear definition of what derivative work is allowed.',
    negotiationTip:
      'Limit derivative rights to the minimum needed for the project and preserve attribution or approval rights where possible.',
  },
  {
    id: 'dispute_binding_arbitration',
    label: 'binding arbitration',
    pattern: /\bbinding arbitration\b/i,
    clauseType: 'Arbitration',
    severity: 'Critical',
    riskScore: 84,
    categories: ['disputeResolution'],
    plainLanguageExplanation:
      'This clause can require disputes to be handled in private arbitration instead of public court.',
    whyItMatters:
      'Binding arbitration can limit your legal options, reduce transparency, and increase practical costs.',
    realWorldConsequence:
      'You may be unable to sue in court even for serious disputes and may have to use a private process instead.',
    suggestedAction:
      'Ask for a neutral forum, a fair location, and carve-outs for urgent or statutory claims.',
    negotiationTip:
      'Request a mutually agreed arbitration provider and remove one-sided control over procedure or venue.',
  },
  {
    id: 'dispute_class_action_waiver',
    label: 'class action waiver',
    pattern: /\bclass action waiver\b|\bwaive .*class action\b/i,
    clauseType: 'Arbitration',
    severity: 'High',
    riskScore: 76,
    categories: ['disputeResolution'],
    plainLanguageExplanation:
      'This clause can stop you from joining group claims with other affected people.',
    whyItMatters:
      'Class action waivers can make small but widespread harms harder to challenge effectively.',
    realWorldConsequence:
      'You may have to pursue a claim alone even when many people were affected by the same conduct.',
    suggestedAction:
      'Ask whether the waiver can be removed or limited for certain types of claims.',
    negotiationTip:
      'If it cannot be removed, seek stronger individual claim procedures and cost protections.',
  },
  {
    id: 'dispute_sole_jurisdiction',
    label: 'sole jurisdiction',
    pattern: /\bsole jurisdiction\b|\bexclusive jurisdiction\b/i,
    clauseType: 'Arbitration',
    severity: 'High',
    riskScore: 72,
    categories: ['disputeResolution'],
    plainLanguageExplanation:
      'This clause can lock disputes into one court or location chosen in the contract.',
    whyItMatters:
      'A one-sided forum selection clause can increase travel, cost, and strategic disadvantage.',
    realWorldConsequence:
      'You may have to handle a dispute far from home or in a forum that favors the other side.',
    suggestedAction:
      'Ask for a neutral venue or at least a location tied to both parties fairly.',
    negotiationTip:
      'Propose the jurisdiction where the work is performed or where both parties have meaningful ties.',
  },
  {
    id: 'dispute_waive_trial',
    label: 'waive right to trial',
    pattern: /\bwaive(?:r)? .*right to trial\b|\bwaive(?:r)? .*jury trial\b/i,
    clauseType: 'Arbitration',
    severity: 'High',
    riskScore: 74,
    categories: ['disputeResolution'],
    plainLanguageExplanation:
      'This clause can waive your ability to have certain disputes heard by a judge or jury.',
    whyItMatters:
      'Waiving trial rights can materially change your leverage and legal options if a dispute arises.',
    realWorldConsequence:
      'You may be forced into a narrower dispute process even when you would prefer a court proceeding.',
    suggestedAction:
      'Ask whether the waiver can be removed or narrowed to a smaller set of disputes.',
    negotiationTip:
      'If the waiver stays, seek procedural protections and a neutral forum.',
  },
  {
    id: 'financial_non_refundable',
    label: 'non-refundable',
    pattern: /\bnon[-\s]?refundable\b/i,
    clauseType: 'Payment',
    severity: 'High',
    riskScore: 68,
    categories: ['financial'],
    plainLanguageExplanation:
      'This clause may prevent you from getting money back even if the relationship ends early or the service disappoints.',
    whyItMatters:
      'Non-refundable terms can shift nearly all financial risk onto you.',
    realWorldConsequence:
      'You may lose fees or deposits even when the other side underperforms or the deal ends quickly.',
    suggestedAction:
      'Ask for a pro-rated refund structure or a refund right when key obligations are not met.',
    negotiationTip:
      'Limit non-refundable treatment to clearly earned fees rather than all amounts paid.',
  },
  {
    id: 'financial_automatic_renewal',
    label: 'automatic renewal',
    pattern: /\bautomatic renewal\b|\bauto[-\s]?renew(?:al)?\b/i,
    clauseType: 'Renewal',
    severity: 'High',
    riskScore: 72,
    categories: ['financial', 'termination'],
    plainLanguageExplanation:
      'This clause can renew the agreement automatically unless you cancel in time.',
    whyItMatters:
      'Automatic renewal can quietly extend obligations, fees, or restrictions if the notice deadline is missed.',
    realWorldConsequence:
      'You may be locked into another term or another billing cycle without actively agreeing again.',
    suggestedAction:
      'Ask for manual renewal or a short notice period plus reminder notice before renewal.',
    negotiationTip:
      'Propose a reminder email and a 30-day notice window before any renewal takes effect.',
    hiddenObligation: {
      obligation: 'Automatic renewal obligation',
      impact:
        'The agreement may continue on its own unless you act before a stated deadline.',
      suggestedAction:
        'Ask for manual renewal or a mandatory reminder before the renewal deadline.',
    },
  },
  {
    id: 'financial_early_termination_fee',
    label: 'early termination fee',
    pattern: /\bearly termination fee\b/i,
    clauseType: 'Termination',
    severity: 'High',
    riskScore: 74,
    categories: ['financial', 'termination'],
    plainLanguageExplanation:
      'This clause can charge you for ending the agreement before the full term expires.',
    whyItMatters:
      'Early termination fees can trap you in a bad contract by making exit expensive.',
    realWorldConsequence:
      'You may feel forced to stay in the relationship because leaving creates a steep cost.',
    suggestedAction:
      'Ask for a lower fee, a cap, or a fee that only reflects actual unrecovered costs.',
    negotiationTip:
      'Request a declining fee schedule or a termination right without penalty for material problems.',
  },
  {
    id: 'financial_late_payment_penalty',
    label: 'late payment penalty',
    pattern: /\blate payment penalty\b|\blate fee\b|\binterest on overdue\b/i,
    clauseType: 'Payment',
    severity: 'Medium',
    riskScore: 52,
    categories: ['financial'],
    plainLanguageExplanation:
      'This clause can impose added charges when payment is late.',
    whyItMatters:
      'Penalty language can quickly increase the effective cost of the agreement.',
    realWorldConsequence:
      'A delayed payment could grow into a much larger balance because of fees or interest.',
    suggestedAction:
      'Ask for a reasonable cure period and a cap on any late charges.',
    negotiationTip:
      'Propose a short grace period and a lower, clearly defined interest rate.',
  },
  {
    id: 'financial_liquidated_damages',
    label: 'liquidated damages',
    pattern: /\bliquidated damages\b/i,
    clauseType: 'Payment',
    severity: 'High',
    riskScore: 76,
    categories: ['financial'],
    plainLanguageExplanation:
      'This clause sets a pre-agreed damage amount that may apply if a breach occurs.',
    whyItMatters:
      'Liquidated damages can become expensive if the amount is high or disconnected from real harm.',
    realWorldConsequence:
      'You might owe a fixed payment after a breach even if the actual harm was much smaller.',
    suggestedAction:
      'Ask how the amount was calculated and whether it can be tied more closely to real expected losses.',
    negotiationTip:
      'Limit liquidated damages to a reasonable, documented estimate rather than an open-ended penalty.',
  },
  {
    id: 'privacy_share_with_partners',
    label: 'share with partners',
    pattern: /\bshare with partners\b/i,
    clauseType: 'Privacy',
    severity: 'High',
    riskScore: 66,
    categories: ['privacy', 'compliance'],
    plainLanguageExplanation:
      'This clause may let your information be shared with outside business partners.',
    whyItMatters:
      'Partner-sharing language can broaden who receives data and how hard it is to track later use.',
    realWorldConsequence:
      'Your data may move to third parties you did not expect or directly approve.',
    suggestedAction:
      'Ask for a clearer list of recipients and a tighter explanation of why sharing is necessary.',
    negotiationTip:
      'Request opt-in consent or at least notice before information is shared with outside partners.',
  },
  {
    id: 'privacy_third_party_data_sharing',
    label: 'third-party data sharing',
    pattern: /\bthird[-\s]?party data sharing\b|\bshare .*third part(?:y|ies)\b/i,
    clauseType: 'Privacy',
    severity: 'High',
    riskScore: 68,
    categories: ['privacy', 'compliance'],
    plainLanguageExplanation:
      'This clause can permit personal data to be transferred to third parties.',
    whyItMatters:
      'Third-party sharing expands privacy risk because your data may be used under someone else’s rules.',
    realWorldConsequence:
      'Information could be shared onward in ways you cannot easily see or control.',
    suggestedAction:
      'Ask for data minimization, a defined list of third parties, and tighter purpose limits.',
    negotiationTip:
      'Limit sharing to vetted service providers with contract controls and no broader marketing use.',
  },
  {
    id: 'privacy_consent_by_continued_use',
    label: 'consent by continued use',
    pattern: /\bconsent by continued use\b|\bcontinued use constitutes consent\b/i,
    clauseType: 'Privacy',
    severity: 'Medium',
    riskScore: 48,
    categories: ['privacy', 'compliance'],
    plainLanguageExplanation:
      'This clause may treat ongoing use as automatic consent to future terms or data practices.',
    whyItMatters:
      'Continued-use consent can make major policy changes effective without active agreement.',
    realWorldConsequence:
      'You may become bound by revised privacy practices simply by continuing to use the service.',
    suggestedAction:
      'Ask for direct notice and meaningful acceptance before material privacy changes take effect.',
    negotiationTip:
      'Request a separate opt-in for major changes rather than automatic consent by continued use.',
    hiddenObligation: {
      obligation: 'Consent-by-use obligation',
      impact:
        'Future actions on your part may be treated as acceptance of changed policies without a fresh signature.',
      suggestedAction:
        'Ask for clear advance notice and affirmative acceptance for major policy changes.',
    },
  },
  {
    id: 'privacy_retain_indefinitely',
    label: 'retain indefinitely',
    pattern: /\bretain indefinitely\b|\bindefinite retention\b/i,
    clauseType: 'Privacy',
    severity: 'High',
    riskScore: 64,
    categories: ['privacy'],
    plainLanguageExplanation:
      'This clause may allow data to be stored with no meaningful end date.',
    whyItMatters:
      'Indefinite retention increases the chance of future misuse, breach exposure, or incompatible reuse.',
    realWorldConsequence:
      'Your personal or business data could remain in old systems long after the relationship ends.',
    suggestedAction:
      'Ask for a defined retention period and deletion or anonymization rules.',
    negotiationTip:
      'Request a specific retention schedule tied to legal or operational necessity.',
  },
  {
    id: 'privacy_collect_personal_data',
    label: 'collect personal data',
    pattern: /\bcollect personal data\b|\bcollect personal information\b/i,
    clauseType: 'Privacy',
    severity: 'Medium',
    riskScore: 44,
    categories: ['privacy'],
    plainLanguageExplanation:
      'This clause states that personal information may be gathered during the relationship.',
    whyItMatters:
      'Data collection language matters because it defines what information enters the company’s control.',
    realWorldConsequence:
      'More personal data may be collected than you expect unless the contract narrows what is necessary.',
    suggestedAction:
      'Ask exactly what data is collected, why it is needed, and how long it is kept.',
    negotiationTip:
      'Push for data minimization and purpose limits so only needed information is collected.',
  },
  {
    id: 'liability_limitation_of_liability',
    label: 'limitation of liability',
    pattern: /\blimitation of liability\b/i,
    clauseType: 'Liability',
    severity: 'High',
    riskScore: 70,
    categories: ['financial', 'disputeResolution'],
    plainLanguageExplanation:
      'This clause can cap what one side owes even if something goes seriously wrong.',
    whyItMatters:
      'Liability caps often reduce the other side’s financial exposure much more than yours.',
    realWorldConsequence:
      'You may not recover the full value of a loss even if the other side caused significant harm.',
    suggestedAction:
      'Ask whether the cap can be mutual and whether serious misconduct should be carved out.',
    negotiationTip:
      'Tie the cap to a meaningful amount and exclude fraud, confidentiality breaches, or gross negligence.',
  },
  {
    id: 'liability_indemnify',
    label: 'indemnify',
    pattern: /\bindemnif(?:y|ies|ication)\b/i,
    clauseType: 'Liability',
    severity: 'Critical',
    riskScore: 82,
    categories: ['financial', 'disputeResolution'],
    plainLanguageExplanation:
      'This clause can require you to cover claims, losses, or legal costs for the other side.',
    whyItMatters:
      'Indemnity language can create large financial exposure that goes beyond ordinary breach damages.',
    realWorldConsequence:
      'You may have to pay defense costs or settlements if a covered claim arises.',
    suggestedAction:
      'Ask for a narrow indemnity trigger, notice requirements, and a liability cap.',
    negotiationTip:
      'Limit indemnity to claims directly caused by your proven breach or misconduct.',
    hiddenObligation: {
      obligation: 'Indemnity obligation',
      impact:
        'You may be responsible for legal costs or third-party claims that arise under the contract.',
      suggestedAction:
        'Ask for narrow triggers, defense control rules, and a cap on total exposure.',
    },
  },
  {
    id: 'liability_hold_harmless',
    label: 'hold harmless',
    pattern: /\bhold harmless\b/i,
    clauseType: 'Liability',
    severity: 'High',
    riskScore: 74,
    categories: ['financial', 'disputeResolution'],
    plainLanguageExplanation:
      'This phrase often extends indemnity-style protection to the other side.',
    whyItMatters:
      'Hold harmless language can broaden your duty to absorb losses or protect the other party.',
    realWorldConsequence:
      'You may owe costs even in disputes that feel remote from the core business deal.',
    suggestedAction:
      'Ask how "hold harmless" differs from indemnity and whether both are really needed.',
    negotiationTip:
      'Delete duplicative hold-harmless wording or narrow it to very specific claim types.',
    hiddenObligation: {
      obligation: 'Hold harmless obligation',
      impact:
        'You may be expected to shield the other side from losses in a broad range of situations.',
      suggestedAction:
        'Narrow the wording and tie it only to claims you directly cause.',
    },
  },
  {
    id: 'liability_no_warranties',
    label: 'no warranties',
    pattern: /\bno warranties\b|\bas is\b/i,
    clauseType: 'Liability',
    severity: 'Medium',
    riskScore: 50,
    categories: ['financial', 'compliance'],
    plainLanguageExplanation:
      'This clause may say the service or product comes without meaningful promises about quality or performance.',
    whyItMatters:
      'Warranty disclaimers can make it harder to complain when a product fails or underperforms.',
    realWorldConsequence:
      'You may have limited remedies even if the product does not work the way you expected.',
    suggestedAction:
      'Ask for at least basic performance warranties and a clear remedy if core functionality fails.',
    negotiationTip:
      'Keep the disclaimer narrow and preserve express warranties that matter to the deal.',
  },
  {
    id: 'liability_at_your_own_risk',
    label: 'at your own risk',
    pattern: /\bat your own risk\b/i,
    clauseType: 'Liability',
    severity: 'Medium',
    riskScore: 54,
    categories: ['financial', 'compliance'],
    plainLanguageExplanation:
      'This phrase tries to shift responsibility for harm or failure onto you.',
    whyItMatters:
      'At-your-own-risk language can be used to argue that you accepted known dangers or uncertainty.',
    realWorldConsequence:
      'If something goes wrong, the other side may argue that you assumed the risk in advance.',
    suggestedAction:
      'Ask what risks are actually being shifted and whether they can be narrowed or balanced.',
    negotiationTip:
      'Limit the clause to risks you actually control or knowingly accept.',
  },
  {
    id: 'ambiguity_sole_discretion',
    label: 'sole discretion',
    pattern: /\bsole discretion\b/i,
    clauseType: 'Other',
    severity: 'High',
    riskScore: 60,
    categories: ['compliance', 'termination'],
    plainLanguageExplanation:
      'This phrase gives one side broad authority to decide important issues on its own.',
    whyItMatters:
      'Sole discretion language can make outcomes unpredictable and one-sided.',
    realWorldConsequence:
      'The other side may change terms, withhold approval, or enforce rules without an objective standard.',
    suggestedAction:
      'Ask for objective criteria, notice, or mutual approval before key decisions are made.',
    negotiationTip:
      'Replace sole discretion with reasonable, good-faith standards tied to measurable triggers.',
    ambiguity: {
      term: 'sole discretion',
      whyAmbiguous:
        'This phrase gives one side broad authority without a measurable limit or review mechanism.',
      questionToAsk:
        'Can this discretion be narrowed with objective triggers or mutual approval requirements?',
    },
  },
  {
    id: 'ambiguity_reasonable_efforts',
    label: 'reasonable efforts',
    pattern: /\breasonable efforts\b/i,
    clauseType: 'Other',
    severity: 'Medium',
    riskScore: 42,
    categories: ['compliance'],
    plainLanguageExplanation:
      'This phrase sounds practical but does not define exactly what level of effort is required.',
    whyItMatters:
      'Undefined effort standards can later be interpreted more aggressively than expected.',
    realWorldConsequence:
      'You may be accused of underperforming because the contract never set a concrete benchmark.',
    suggestedAction:
      'Ask for measurable deliverables, timelines, or service levels instead of vague effort language.',
    negotiationTip:
      'Replace vague effort standards with specific obligations and objective performance metrics.',
    ambiguity: {
      term: 'reasonable efforts',
      whyAmbiguous:
        '"Reasonable efforts" is subjective unless the contract defines what the standard actually requires.',
      questionToAsk:
        'What objective criteria or examples define what is considered "reasonable efforts" here?',
    },
  },
  {
    id: 'ambiguity_subject_to_change',
    label: 'subject to change',
    pattern: /\bsubject to change\b/i,
    clauseType: 'Other',
    severity: 'Medium',
    riskScore: 46,
    categories: ['compliance', 'financial'],
    plainLanguageExplanation:
      'This phrase suggests the other side may change an important term later.',
    whyItMatters:
      'Changeable terms can make the deal unstable and difficult to price or rely on.',
    realWorldConsequence:
      'Important obligations or fees may shift after you already committed to the agreement.',
    suggestedAction:
      'Ask which items are changeable, what notice is required, and whether consent is needed.',
    negotiationTip:
      'Limit changes to minor operational details and require notice before material updates.',
    ambiguity: {
      term: 'subject to change',
      whyAmbiguous:
        'This phrase allows future updates without clearly saying who may change what or when.',
      questionToAsk:
        'What exactly is subject to change, and what notice or approval will apply before a change takes effect?',
    },
    hiddenObligation: {
      obligation: 'Unilateral change obligation',
      impact:
        'The contract may let the other side revise important terms after you are already bound.',
      suggestedAction:
        'Require advance notice and consent for material changes.',
    },
  },
  {
    id: 'ambiguity_without_prior_notice',
    label: 'without prior notice',
    pattern: /\bwithout prior notice\b/i,
    clauseType: 'Other',
    severity: 'High',
    riskScore: 58,
    categories: ['compliance', 'termination'],
    plainLanguageExplanation:
      'This phrase can allow action to be taken before you are warned.',
    whyItMatters:
      'No-notice provisions reduce your ability to respond, object, or protect yourself in time.',
    realWorldConsequence:
      'Policies, access, or services may change before you even know a problem exists.',
    suggestedAction:
      'Ask for advance notice except in narrow emergency situations.',
    negotiationTip:
      'Keep no-notice rights only for urgent security or legal emergencies, not ordinary business decisions.',
    ambiguity: {
      term: 'without prior notice',
      whyAmbiguous:
        'This phrase can be used to justify sudden changes without stating when no-notice action is truly allowed.',
      questionToAsk:
        'Under what exact circumstances can action be taken without prior notice?',
    },
  },
  {
    id: 'ambiguity_including_but_not_limited_to',
    label: 'including but not limited to',
    pattern: /\bincluding but not limited to\b/i,
    clauseType: 'Other',
    severity: 'Medium',
    riskScore: 40,
    categories: ['compliance'],
    plainLanguageExplanation:
      'This phrase expands a list beyond the examples actually named in the contract.',
    whyItMatters:
      'Open-ended language can make the scope of your obligations larger than it first appears.',
    realWorldConsequence:
      'You may be bound by additional items or duties that were never spelled out explicitly.',
    suggestedAction:
      'Ask for an exhaustive list when the scope of the clause matters financially or legally.',
    negotiationTip:
      'Replace open-ended examples with a complete defined list when possible.',
    ambiguity: {
      term: 'including but not limited to',
      whyAmbiguous:
        'This phrase expands the clause beyond the listed examples and can make scope unpredictable.',
      questionToAsk:
        'Can we replace this open-ended phrase with a complete list of the actual items covered?',
    },
  },
  {
    id: 'ambiguity_as_determined_by_company',
    label: 'as determined by the company',
    pattern: /\bas determined by the company\b/i,
    clauseType: 'Other',
    severity: 'High',
    riskScore: 60,
    categories: ['employment', 'compliance'],
    plainLanguageExplanation:
      'This phrase gives the company power to define key outcomes on its own.',
    whyItMatters:
      'Company-controlled decision language can be used to enforce terms in a one-sided way.',
    realWorldConsequence:
      'The company may decide standards, breaches, or eligibility in ways that favor itself.',
    suggestedAction:
      'Ask for objective criteria or independent benchmarks instead of company-only judgment.',
    negotiationTip:
      'Use mutual definitions or measurable standards rather than company-only determination.',
    ambiguity: {
      term: 'as determined by the company',
      whyAmbiguous:
        'This phrase leaves a key decision to one side without a neutral standard for review.',
      questionToAsk:
        'What objective standard will the company use when making this determination?',
    },
  },
];

export function buildFallbackRiskReport(
  documentText: string,
  documentType: string,
  options: FallbackRiskEngineOptions
): RiskReport {
  const segments = extractDocumentSegments(documentText);
  const matches = collectRuleMatches(segments);
  const selectedMatches = selectClauseMatches(matches, options.maxClauses ?? DEFAULT_MAX_CLAUSES);
  const clauses = buildClausesFromMatches(selectedMatches);
  const ambiguousTerms = buildAmbiguousTermsFromMatches(matches);
  const hiddenObligations = buildHiddenObligationsFromMatches(matches);
  const riskCategories = buildRiskCategoriesFromMatches(selectedMatches, clauses);
  const overallRiskScore = calculateOverallRiskScore(clauses, ambiguousTerms, hiddenObligations);
  const overallRiskLevel = getRiskLevel(overallRiskScore);
  const topConcerns = buildTopConcerns(clauses, ambiguousTerms, hiddenObligations);
  const recommendedQuestions = buildRecommendedQuestions(clauses, ambiguousTerms, hiddenObligations);

  return {
    analysisMode: 'deterministic_fallback',
    analysisSource: 'fallback_risk_engine',
    fallbackReason: options.fallbackReason,
    documentType,
    overallRiskScore,
    overallRiskLevel,
    executiveSummary: buildExecutiveSummary(
      documentType,
      clauses,
      ambiguousTerms,
      hiddenObligations,
      overallRiskLevel,
      options.fallbackReason
    ),
    topConcerns,
    clauses,
    riskCategories,
    ambiguousTerms,
    hiddenObligations,
    recommendedQuestions,
    signingRecommendation: getSigningRecommendation(overallRiskScore),
    disclaimer: REPORT_DISCLAIMER,
  };
}

export const buildDeterministicRiskReport = buildFallbackRiskReport;

export function normalizeForComparison(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s"'%.-]/g, ' ')
    .toLowerCase()
    .trim();
}

export function extractDocumentSegments(documentText: string): string[] {
  const normalizedText = documentText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const rawBlocks = normalizedText.split(/\n{2,}/);
  const segments: string[] = [];

  for (const block of rawBlocks) {
    const cleanedBlock = block.trim();
    if (!cleanedBlock) {
      continue;
    }

    if (cleanedBlock.length <= 420) {
      segments.push(cleanedBlock);
      continue;
    }

    const parts = cleanedBlock
      .split(/(?<=[.;!?])\s+(?=[A-Z0-9(])/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      segments.push(cleanedBlock);
      continue;
    }

    let buffer = '';
    for (const part of parts) {
      const nextValue = `${buffer} ${part}`.trim();
      if (nextValue.length <= 420) {
        buffer = nextValue;
      } else {
        if (buffer) {
          segments.push(buffer);
        }
        buffer = part;
      }
    }

    if (buffer) {
      segments.push(buffer);
    }
  }

  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= MIN_SEGMENT_LENGTH)
    .slice(0, MAX_SEGMENTS);
}

export function matchEvidenceToDocument(documentText: string, candidate: string): string | null {
  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) {
    return null;
  }

  if (documentText.includes(trimmedCandidate)) {
    return trimmedCandidate;
  }

  const segments = extractDocumentSegments(documentText);
  const normalizedCandidate = normalizeForComparison(trimmedCandidate);
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const segment of segments) {
    const normalizedSegment = normalizeForComparison(segment);
    if (!normalizedSegment) {
      continue;
    }

    if (
      normalizedSegment === normalizedCandidate ||
      normalizedSegment.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedSegment)
    ) {
      return segment;
    }

    const score = calculateWordOverlapScore(normalizedCandidate, normalizedSegment);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = segment;
    }
  }

  return bestScore >= 0.72 ? bestMatch : null;
}

function collectRuleMatches(segments: string[]): RuleMatch[] {
  const matches: RuleMatch[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    for (const rule of RISK_PHRASE_RULES) {
      if (!rule.pattern.test(segment)) {
        continue;
      }

      const evidence = extractEvidenceSnippet(segment, rule.pattern);
      const matchKey = `${rule.id}:${normalizeForComparison(evidence)}`;
      if (seen.has(matchKey)) {
        continue;
      }

      seen.add(matchKey);
      matches.push({ rule, evidence });
    }
  }

  return matches;
}

function buildClausesFromMatches(matches: RuleMatch[]): AnalyzedClause[] {
  return matches.map((match, index) => ({
    id: `clause_${index + 1}`,
    clauseType: match.rule.clauseType,
    severity: match.rule.severity,
    riskScore: match.rule.riskScore,
    clauseText: match.evidence,
    plainLanguageExplanation: match.rule.plainLanguageExplanation,
    whyItMatters: match.rule.whyItMatters,
    realWorldConsequence: match.rule.realWorldConsequence,
    suggestedAction: match.rule.suggestedAction,
    negotiationTip: match.rule.negotiationTip,
    confidence: calculateConfidence(match.rule),
  }));
}

function buildAmbiguousTermsFromMatches(matches: RuleMatch[]): AmbiguousTerm[] {
  const seen = new Set<string>();
  const ambiguousTerms: AmbiguousTerm[] = [];

  for (const match of matches) {
    if (!match.rule.ambiguity) {
      continue;
    }

    const key = `${match.rule.ambiguity.term}:${normalizeForComparison(match.evidence)}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    ambiguousTerms.push({
      term: match.rule.ambiguity.term,
      evidence: match.evidence,
      whyAmbiguous: match.rule.ambiguity.whyAmbiguous,
      questionToAsk: match.rule.ambiguity.questionToAsk,
    });
  }

  return ambiguousTerms.slice(0, 10);
}

function buildHiddenObligationsFromMatches(matches: RuleMatch[]): HiddenObligation[] {
  const seen = new Set<string>();
  const hiddenObligations: HiddenObligation[] = [];

  for (const match of matches) {
    if (!match.rule.hiddenObligation) {
      continue;
    }

    const key = `${match.rule.hiddenObligation.obligation}:${normalizeForComparison(match.evidence)}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    hiddenObligations.push({
      obligation: match.rule.hiddenObligation.obligation,
      evidence: match.evidence,
      impact: match.rule.hiddenObligation.impact,
      suggestedAction: match.rule.hiddenObligation.suggestedAction,
    });
  }

  return hiddenObligations.slice(0, 8);
}

function buildRiskCategoriesFromMatches(matches: RuleMatch[], clauses: AnalyzedClause[]): RiskCategories {
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

  matches.forEach((match, index) => {
    const clause = clauses[index];
    if (!clause) {
      return;
    }

    for (const category of match.rule.categories) {
      groupedClauses[category].push(clause);
    }
  });

  for (const category of Object.keys(groupedClauses) as Array<keyof RiskCategories>) {
    const categoryClauses = groupedClauses[category];
    if (categoryClauses.length === 0) {
      continue;
    }

    const maxScore = Math.max(...categoryClauses.map((clause) => clause.riskScore));
    const averageScore =
      categoryClauses.reduce((sum, clause) => sum + clause.riskScore, 0) / categoryClauses.length;
    const score = clamp(Math.round(maxScore * 0.65 + averageScore * 0.35), 0, 100);

    categories[category] = {
      score,
      summary: summarizeCategory(category, categoryClauses),
      risks: categoryClauses.slice(0, 3).map((clause) => clause.whyItMatters),
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
      return clamp(18 + ambiguousTerms.length * 6, 18, 42);
    }

    return hiddenObligations.length > 0 ? 28 : 8;
  }

  const criticalCount = clauses.filter((clause) => clause.severity === 'Critical').length;
  const highOrCriticalCount = clauses.filter(
    (clause) => clause.severity === 'High' || clause.severity === 'Critical'
  ).length;
  const mediumOrHigherCount = clauses.filter(
    (clause) => clause.severity !== 'Low'
  ).length;

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

  return clamp(score, 0, 100);
}

function buildTopConcerns(
  clauses: AnalyzedClause[],
  ambiguousTerms: AmbiguousTerm[],
  hiddenObligations: HiddenObligation[]
): string[] {
  const concerns = clauses.slice(0, 4).map((clause) => `${clause.clauseType}: ${clause.whyItMatters}`);

  for (const hiddenObligation of hiddenObligations.slice(0, 2)) {
    concerns.push(`${hiddenObligation.obligation}: ${hiddenObligation.impact}`);
  }

  if (concerns.length < 3) {
    for (const ambiguousTerm of ambiguousTerms.slice(0, 2)) {
      concerns.push(`Ambiguous term "${ambiguousTerm.term}": ${ambiguousTerm.whyAmbiguous}`);
    }
  }

  return concerns.filter(uniqueValues).slice(0, 5);
}

function buildRecommendedQuestions(
  clauses: AnalyzedClause[],
  ambiguousTerms: AmbiguousTerm[],
  hiddenObligations: HiddenObligation[]
): string[] {
  const questions: string[] = [];

  for (const clause of clauses.slice(0, 5)) {
    questions.push(`Can we revisit the ${clause.clauseType.toLowerCase()} clause and narrow it to a fairer scope?`);
  }

  for (const ambiguousTerm of ambiguousTerms.slice(0, 3)) {
    questions.push(ambiguousTerm.questionToAsk);
  }

  for (const hiddenObligation of hiddenObligations.slice(0, 2)) {
    questions.push(
      `Can you clarify the ${hiddenObligation.obligation.toLowerCase()} and confirm how it works in practice?`
    );
  }

  return questions.filter(uniqueValues).slice(0, 8);
}

function buildExecutiveSummary(
  documentType: string,
  clauses: AnalyzedClause[],
  ambiguousTerms: AmbiguousTerm[],
  hiddenObligations: HiddenObligation[],
  overallRiskLevel: RiskLevel,
  fallbackReason: FallbackReason
): string {
  const reasonLine =
    fallbackReason === 'missing_api_key'
      ? "This report was generated using LEXGUARD's deterministic fallback risk engine because no AI API key is configured."
      : fallbackReason === 'forced_dev_mock_mode'
      ? "This report was generated using LEXGUARD's deterministic fallback risk engine because development mock mode forced fallback analysis."
      : fallbackReason === 'ai_failed'
      ? "This report was generated using LEXGUARD's deterministic fallback risk engine because the AI analysis step failed."
      : "This report was generated using LEXGUARD's deterministic fallback risk engine because the AI output could not be parsed or trusted.";

  const clauseSummary =
    clauses.length > 0
      ? `The ${documentType} contains ${clauses.length} evidence-backed risk signal${
          clauses.length === 1 ? '' : 's'
        }, with the strongest concerns concentrated in ${clauses
          .slice(0, 3)
          .map((clause) => clause.clauseType)
          .filter(uniqueValues)
          .join(', ')
          .toLowerCase()} language.`
      : 'No common high-risk contract phrases were detected, but the document should still be reviewed carefully for context-specific issues.';

  const supportingSummary = `Overall risk is assessed as ${overallRiskLevel.toLowerCase()}. The fallback engine also flagged ${ambiguousTerms.length} ambiguous term${
    ambiguousTerms.length === 1 ? '' : 's'
  } and ${hiddenObligations.length} hidden obligation${hiddenObligations.length === 1 ? '' : 's'} using exact evidence snippets from the uploaded document.`;

  return `${reasonLine}\n\n${clauseSummary}\n\n${supportingSummary}`;
}

function summarizeCategory(category: keyof RiskCategories, clauses: AnalyzedClause[]): string {
  const clauseNames = clauses.map((clause) => clause.clauseType).filter(uniqueValues);
  if (clauseNames.length === 0) {
    return GENERIC_CATEGORY_SUMMARY;
  }

  return `${capitalizeCategory(category)} risk is mainly driven by ${clauseNames
    .join(', ')
    .toLowerCase()} language detected in the document.`;
}

function selectClauseMatches(matches: RuleMatch[], maxClauses: number): RuleMatch[] {
  return [...matches]
    .sort((left, right) => {
      if (right.rule.riskScore !== left.rule.riskScore) {
        return right.rule.riskScore - left.rule.riskScore;
      }
      return left.rule.label.localeCompare(right.rule.label);
    })
    .slice(0, maxClauses);
}

function calculateConfidence(rule: RiskPhraseRule): number {
  switch (rule.severity) {
    case 'Critical':
      return 0.97;
    case 'High':
      return 0.93;
    case 'Medium':
      return 0.88;
    default:
      return 0.82;
  }
}

function extractEvidenceSnippet(segment: string, pattern: RegExp): string {
  const sentences = segment
    .split(/(?<=[.;!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    if (pattern.test(sentence)) {
      return sentence;
    }
  }

  return segment.trim();
}

function calculateWordOverlapScore(left: string, right: string): number {
  const leftWords = new Set(left.split(/\s+/).filter((word) => word.length > 2));
  const rightWords = new Set(right.split(/\s+/).filter((word) => word.length > 2));

  if (leftWords.size === 0 || rightWords.size === 0) {
    return 0;
  }

  let matches = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) {
      matches += 1;
    }
  }

  return matches / leftWords.size;
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

function uniqueValues<T>(value: T, index: number, array: T[]): boolean {
  return array.indexOf(value) === index;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
