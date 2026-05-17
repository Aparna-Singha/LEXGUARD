export {
  buildDeterministicRiskReport,
  buildFallbackRiskReport,
  extractDocumentSegments,
  matchEvidenceToDocument,
  normalizeForComparison,
} from '@/lib/risk/fallbackRiskEngine';

export type { FallbackReason, FallbackRiskEngineOptions } from '@/lib/risk/fallbackRiskEngine';
