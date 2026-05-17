import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSampleDocumentById, SampleDocumentDefinition } from './index';

export class SampleDocumentNotFoundError extends Error {
  constructor(sampleId: string) {
    super(`Unknown sample document "${sampleId}".`);
    this.name = 'SampleDocumentNotFoundError';
  }
}

export async function readSampleDocument(
  sampleId: string
): Promise<{ sample: SampleDocumentDefinition; documentText: string }> {
  const sample = getSampleDocumentById(sampleId);
  if (!sample) {
    throw new SampleDocumentNotFoundError(sampleId);
  }

  const samplePath = join(process.cwd(), 'samples', sample.fileName);
  const documentText = await readFile(samplePath, 'utf8');

  return { sample, documentText };
}
