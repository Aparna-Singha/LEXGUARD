import { buildFallbackRiskReport } from './fallbackRiskEngine';

export const FALLBACK_RISK_ENGINE_EXAMPLE_TEXT = `
Employee agrees to work exclusively for the Company and may be terminated without notice for any conduct as determined by the Company in its sole discretion.

Employee hereby assigns all intellectual property created during employment and grants the Company a perpetual, irrevocable, worldwide royalty-free license to derivative works.

Any dispute will be resolved through binding arbitration, with a class action waiver and exclusive jurisdiction in the Company's chosen forum.

Subscription fees are non-refundable, renew automatically, and may include liquidated damages or an early termination fee.

The Company may share with partners, engage in third-party data sharing, and retain indefinitely any personal data collected. Continued use constitutes consent.

You agree to indemnify and hold harmless the Company. Services are provided with no warranties and at your own risk.
`.trim();

export function buildFallbackRiskEngineExample() {
  return buildFallbackRiskReport(FALLBACK_RISK_ENGINE_EXAMPLE_TEXT, 'Employment Contract', {
    fallbackReason: 'forced_dev_mock_mode',
  });
}
