/**
 * Backward-compatible AI entrypoint.
 *
 * The route handlers still import `analyzer.ts`, but the real multi-agent
 * implementation now lives in `analyzeContract.ts`.
 */

export { analyzeContract, analyzeDocument } from './analyzeContract';
