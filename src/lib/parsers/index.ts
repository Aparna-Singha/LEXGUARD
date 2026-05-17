import { parsePdf } from './pdf-parser';
import { parseTxt } from './txt-parser';
import { parseDocx } from './docx-parser';

const SUPPORTED_TYPES: Record<string, (buffer: Buffer) => Promise<string>> = {
  'application/pdf': parsePdf,
  'text/plain': parseTxt,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx,
};

const EXTENSION_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Parse a document buffer into plain text.
 * Resolves the parser from MIME type or file extension.
 */
export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  // Determine the mime type from extension if not provided
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const resolvedMime = mimeType || EXTENSION_MAP[ext];

  if (!resolvedMime) {
    throw new Error(
      `Unsupported file type: "${ext}". Supported formats: PDF, TXT, DOCX.`
    );
  }

  const parser = SUPPORTED_TYPES[resolvedMime];

  if (!parser) {
    throw new Error(
      `No parser available for type "${resolvedMime}". Supported formats: PDF, TXT, DOCX.`
    );
  }

  const text = await parser(buffer);

  if (!text || text.length < 20) {
    throw new Error(
      'Document appears to be empty or contains too little text to analyze. ' +
      'If this is a scanned document, please use OCR first.'
    );
  }

  return text;
}

export { parsePdf, parseTxt, parseDocx };
