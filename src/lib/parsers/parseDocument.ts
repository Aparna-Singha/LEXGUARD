import { extname } from 'path';
import { parseDocx } from './docx-parser';
import { parsePdf } from './pdf-parser';
import { parseTxt } from './txt-parser';

export type SupportedDocumentFileType = 'txt' | 'pdf' | 'docx';

export interface ParsedDocumentMetadata {
  fileName: string;
  fileType: SupportedDocumentFileType;
  size: number;
  characterCount: number;
}

export interface ParsedDocument {
  text: string;
  metadata: ParsedDocumentMetadata;
}

export interface ParseDocumentOptions {
  buffer: Buffer;
  fileName: string;
  mimeType?: string | null;
  size?: number;
  minCharacters?: number;
  minWords?: number;
  maxCharacters?: number;
}

export interface FinalizeExtractedTextOptions {
  text: string;
  fileName: string;
  fileType?: SupportedDocumentFileType;
  mimeType?: string | null;
  size: number;
  minCharacters?: number;
  minWords?: number;
  maxCharacters?: number;
}

export class UnsupportedDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedDocumentError';
  }
}

export class DocumentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentParseError';
  }
}

export class DocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentValidationError';
  }
}

const DEFAULT_MIN_CHARACTERS = 50;
const DEFAULT_MIN_WORDS = 8;
const DEFAULT_MAX_CHARACTERS = 120_000;

const MIME_TO_FILE_TYPE: Record<string, SupportedDocumentFileType> = {
  'text/plain': 'txt',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const EXTENSION_TO_FILE_TYPE: Record<string, SupportedDocumentFileType> = {
  '.txt': 'txt',
  '.pdf': 'pdf',
  '.docx': 'docx',
};

const FILE_TYPE_LABELS: Record<SupportedDocumentFileType, string> = {
  txt: 'TXT',
  pdf: 'PDF',
  docx: 'DOCX',
};

const PARSERS: Record<SupportedDocumentFileType, (buffer: Buffer) => Promise<string>> = {
  txt: parseTxt,
  pdf: parsePdf,
  docx: parseDocx,
};

export async function parseDocument(options: ParseDocumentOptions): Promise<ParsedDocument> {
  const fileType = detectDocumentFileType(options.fileName, options.mimeType);
  const parser = PARSERS[fileType];

  try {
    const rawText = await parser(options.buffer);
    return finalizeExtractedText({
      text: rawText,
      fileName: options.fileName,
      fileType,
      size: options.size ?? options.buffer.byteLength,
      minCharacters: options.minCharacters,
      minWords: options.minWords,
      maxCharacters: options.maxCharacters,
    });
  } catch (error) {
    if (
      error instanceof UnsupportedDocumentError ||
      error instanceof DocumentValidationError ||
      error instanceof DocumentParseError
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : `Failed to parse ${FILE_TYPE_LABELS[fileType]} document.`;
    throw new DocumentParseError(message);
  }
}

export function finalizeExtractedText(options: FinalizeExtractedTextOptions): ParsedDocument {
  const fileType = options.fileType ?? detectDocumentFileType(options.fileName, options.mimeType);
  const cleanedText = cleanupExtractedText(options.text, options.maxCharacters ?? DEFAULT_MAX_CHARACTERS);

  validateExtractedText(cleanedText, {
    minCharacters: options.minCharacters ?? DEFAULT_MIN_CHARACTERS,
    minWords: options.minWords ?? DEFAULT_MIN_WORDS,
  });

  return {
    text: cleanedText,
    metadata: {
      fileName: options.fileName,
      fileType,
      size: options.size,
      characterCount: cleanedText.length,
    },
  };
}

export function detectDocumentFileType(
  fileName: string,
  mimeType?: string | null
): SupportedDocumentFileType {
  const normalizedMime = normalizeMimeType(mimeType);
  const normalizedExtension = extname(fileName).toLowerCase();

  const mimeMatch = normalizedMime ? MIME_TO_FILE_TYPE[normalizedMime] : undefined;
  const extensionMatch = EXTENSION_TO_FILE_TYPE[normalizedExtension];

  if (mimeMatch) {
    return mimeMatch;
  }

  if (extensionMatch) {
    return extensionMatch;
  }

  const descriptor = normalizedExtension || normalizedMime || 'unknown';
  throw new UnsupportedDocumentError(
    `Unsupported file type "${descriptor}". Supported formats: TXT (.txt), PDF (.pdf), and DOCX (.docx).`
  );
}

export function cleanupExtractedText(text: string, maxCharacters = DEFAULT_MAX_CHARACTERS): string {
  const normalizedNewlines = text.replace(/\u0000/g, ' ').replace(/\r\n?/g, '\n');
  const normalizedLines = normalizedNewlines
    .split('\n')
    .map((line) => line.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim());
  const collapsedEmptyLines = normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  if (collapsedEmptyLines.length <= maxCharacters) {
    return collapsedEmptyLines;
  }

  return collapsedEmptyLines.slice(0, maxCharacters).trimEnd();
}

export function validateExtractedText(
  text: string,
  options: { minCharacters?: number; minWords?: number } = {}
): void {
  const minCharacters = options.minCharacters ?? DEFAULT_MIN_CHARACTERS;
  const minWords = options.minWords ?? DEFAULT_MIN_WORDS;

  if (!text) {
    throw new DocumentValidationError(
      'Document appears to be empty after text extraction. Please upload a readable TXT, PDF, or DOCX file.'
    );
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (text.length < minCharacters || wordCount < minWords) {
    throw new DocumentValidationError(
      'Not enough readable contract text was extracted to analyze this document. If this is a scanned file, please OCR it first.'
    );
  }
}

function normalizeMimeType(mimeType?: string | null): string | null {
  if (!mimeType) {
    return null;
  }

  return mimeType.split(';')[0]?.trim().toLowerCase() || null;
}
