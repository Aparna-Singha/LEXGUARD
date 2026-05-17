import { DocumentType } from '@/lib/types';

export interface SampleDocumentDefinition {
  id: string;
  title: string;
  description: string;
  fileName: string;
  documentType: DocumentType;
  highlights: string[];
}

export const SAMPLE_DOCUMENTS: SampleDocumentDefinition[] = [
  {
    id: 'employment_offer_high_risk',
    title: 'High-Risk Employment Offer',
    description: 'A fictional offer letter with restrictive employment, IP, and dispute terms.',
    fileName: 'employment_offer_high_risk.txt',
    documentType: 'Offer Letter',
    highlights: [
      'Broad non-compete',
      'Company-owned employee IP',
      'Termination without notice',
    ],
  },
  {
    id: 'freelancer_agreement_ip_risk',
    title: 'Freelancer Agreement with IP Traps',
    description: 'A fictional freelance contract that shifts ownership and payment risk to the contractor.',
    fileName: 'freelancer_agreement_ip_risk.txt',
    documentType: 'Freelance Agreement',
    highlights: [
      'Client owns all IP',
      'Worldwide royalty-free license',
      'Delayed payment terms',
    ],
  },
  {
    id: 'subscription_terms_hidden_fee',
    title: 'Subscription Terms with Hidden Fees',
    description: 'A fictional consumer subscription agreement with renewal, fee, and price-change risk.',
    fileName: 'subscription_terms_hidden_fee.txt',
    documentType: 'Subscription Terms',
    highlights: [
      'Automatic renewal',
      'Non-refundable fees',
      'Early termination fee',
    ],
  },
  {
    id: 'privacy_policy_data_risk',
    title: 'Privacy Policy with Broad Data Use',
    description: 'A fictional privacy policy with expansive collection, sharing, and retention language.',
    fileName: 'privacy_policy_data_risk.txt',
    documentType: 'Privacy Policy',
    highlights: [
      'Broad data collection',
      'Sharing with partners',
      'Changes without notice',
    ],
  },
  {
    id: 'vendor_agreement_liability_risk',
    title: 'Vendor Agreement with Liability Risk',
    description: 'A fictional vendor contract with one-sided termination and weak service protections.',
    fileName: 'vendor_agreement_liability_risk.txt',
    documentType: 'Vendor Agreement',
    highlights: [
      'Limitation of liability',
      'Indemnification',
      'No warranties',
    ],
  },
    {
    id: 'ticket_terms_hidden_liability',
    title: 'Ticket Terms with Hidden Liability',
    description:
      'A fictional event ticket policy with no-refund rules, liability waiver, data sharing, and unilateral change terms.',
    fileName: 'ticket_terms_hidden_liability.txt',
    documentType: 'Ticket Terms',
    highlights: [
      'No refunds',
      'Assumes all risk',
      'Terms can change without notice',
    ],
  },
];

export function getSampleDocumentById(sampleId: string): SampleDocumentDefinition | null {
  return SAMPLE_DOCUMENTS.find((sample) => sample.id === sampleId) ?? null;
}
