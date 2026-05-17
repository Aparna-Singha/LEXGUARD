import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyzeDocument } from '@/lib/ai/analyzer';
import {
  DocumentParseError,
  DocumentValidationError,
  finalizeExtractedText,
  parseDocument,
  UnsupportedDocumentError,
} from '@/lib/parsers';
import { readSampleDocument, SampleDocumentNotFoundError } from '@/lib/samples/readSampleDocument';
import { store } from '@/lib/store';
import { AnalyzeResponse, DocumentType, ErrorResponse, StoredReport } from '@/lib/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Invalid request format. Please upload the document using multipart form data.',
        details: 'Send either a file or a sampleId along with documentType in a multipart/form-data request.',
      },
      { status: 400 }
    );
  }

  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Unable to read the submitted form data.',
          details: 'Please try again with a valid upload or sample selection.',
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const requestedDocumentType = formData.get('documentType') as DocumentType | null;
    const sampleId = formData.get('sampleId') as string | null;

    if (!file && !sampleId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'No file or sample selected. Please upload a document or choose a sample to analyze.',
        },
        { status: 400 }
      );
    }

    const analysisInput = file
      ? await buildUploadedFileAnalysisInput(file, requestedDocumentType)
      : await buildSampleAnalysisInput(sampleId);

    if ('errorResponse' in analysisInput) {
      return NextResponse.json<ErrorResponse>(analysisInput.errorResponse.body, {
        status: analysisInput.errorResponse.status,
      });
    }

    let report;
    try {
      report = await analyzeDocument(analysisInput.documentText, analysisInput.documentType);
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : 'AI analysis failed.';
      console.error('AI analysis error:', aiError);
      return NextResponse.json<ErrorResponse>(
        {
          error: message,
          details: 'The AI service may be temporarily unavailable. Please try again.',
        },
        { status: 502 }
      );
    }

    const reportId = uuidv4();
    const createdAt = new Date().toISOString();
    const reportWithMetadata = {
      ...report,
      id: reportId,
      documentName: analysisInput.documentName,
      documentType: analysisInput.documentType,
      createdAt,
    };

    const storedReport: StoredReport = {
      id: reportId,
      report: reportWithMetadata,
      documentText: analysisInput.documentText,
      documentType: analysisInput.documentType,
      fileName: analysisInput.documentName,
      createdAt,
    };

    store.setReport(reportId, storedReport);

    return NextResponse.json<AnalyzeResponse>({
      success: true,
      reportId,
      report: reportWithMetadata,
    });
  } catch (error) {
    console.error('Unexpected error in analyze route:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

async function buildUploadedFileAnalysisInput(
  file: File,
  requestedDocumentType: DocumentType | null
): Promise<AnalysisInputResult> {
  if (!requestedDocumentType) {
    return errorResult(400, { error: 'Please select a document type.' });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return errorResult(400, { error: 'File too large. Maximum size is 10MB.' });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const parsedDocument = await parseDocument({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    return {
      documentText: parsedDocument.text,
      documentType: requestedDocumentType,
      documentName: file.name,
    };
  } catch (parseError) {
    return mapParseErrorToResult(parseError);
  }
}

async function buildSampleAnalysisInput(sampleId: string | null): Promise<AnalysisInputResult> {
  if (!sampleId) {
    return errorResult(400, { error: 'No sample selected. Please choose a sample document.' });
  }

  try {
    const sampleDocument = await readSampleDocument(sampleId);
    const parsedSample = finalizeExtractedText({
      text: sampleDocument.documentText,
      fileName: sampleDocument.sample.fileName,
      size: Buffer.byteLength(sampleDocument.documentText, 'utf8'),
    });

    return {
      documentText: parsedSample.text,
      documentType: sampleDocument.sample.documentType,
      documentName: sampleDocument.sample.fileName,
    };
  } catch (sampleError) {
    if (sampleError instanceof SampleDocumentNotFoundError) {
      return errorResult(400, {
        error: 'Unknown sample selected. Please choose a valid sample document.',
      });
    }

    if (
      sampleError instanceof UnsupportedDocumentError ||
      sampleError instanceof DocumentValidationError ||
      sampleError instanceof DocumentParseError
    ) {
      return mapParseErrorToResult(sampleError);
    }

    const message =
      sampleError instanceof Error ? sampleError.message : 'Failed to load the sample document.';
    return errorResult(500, {
      error: message,
      details: 'The sample document could not be loaded. Please try another sample.',
    });
  }
}

function mapParseErrorToResult(parseError: unknown): AnalysisInputError {
  if (parseError instanceof UnsupportedDocumentError) {
    return errorResult(400, {
      error: parseError.message,
      details: 'Please upload a TXT, PDF, or DOCX file.',
    });
  }

  if (parseError instanceof DocumentValidationError) {
    return errorResult(422, {
      error: parseError.message,
      details:
        'Please upload a document with readable contract text, or OCR scanned files before analysis.',
    });
  }

  if (parseError instanceof DocumentParseError) {
    return errorResult(422, {
      error: parseError.message,
      details: 'Try a different TXT, PDF, or DOCX file, or convert the document to plain text first.',
    });
  }

  const message = parseError instanceof Error ? parseError.message : 'Failed to parse document.';
  return errorResult(422, {
    error: message,
    details: 'Try uploading a different TXT, PDF, or DOCX file.',
  });
}

type AnalysisInputSuccess = {
  documentText: string;
  documentType: DocumentType;
  documentName: string;
};

type AnalysisInputError = {
  errorResponse: {
    body: ErrorResponse;
    status: number;
  };
};

type AnalysisInputResult = AnalysisInputSuccess | AnalysisInputError;

function errorResult(status: number, body: ErrorResponse): AnalysisInputError {
  return {
    errorResponse: {
      body,
      status,
    },
  };
}
