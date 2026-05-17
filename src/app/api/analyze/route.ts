import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { parseDocument } from '@/lib/parsers';
import { analyzeDocument } from '@/lib/ai/analyzer';
import { store } from '@/lib/store';
import { StoredReport, DocumentType, AnalyzeResponse, ErrorResponse } from '@/lib/types';

export const maxDuration = 60; // Allow up to 60s for AI analysis

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as DocumentType | null;

    // ─── Validation ──────────────────────────────────────
    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { error: 'No file uploaded. Please select a document to analyze.' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Please select a document type.' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ErrorResponse>(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // ─── Parse document ──────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    let documentText: string;

    try {
      documentText = await parseDocument(buffer, file.name, file.type);
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : 'Failed to parse document.';
      return NextResponse.json<ErrorResponse>(
        { error: message, details: 'Try uploading a different file format (PDF, DOCX, or TXT).' },
        { status: 422 }
      );
    }

    // ─── Analyze with AI ─────────────────────────────────
    let report;
    try {
      report = await analyzeDocument(documentText, documentType);
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : 'AI analysis failed.';
      console.error('AI analysis error:', aiError);
      return NextResponse.json<ErrorResponse>(
        { error: message, details: 'The AI service may be temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    // ─── Store report ────────────────────────────────────
    const reportId = uuidv4();
    const storedReport: StoredReport = {
      id: reportId,
      report,
      documentText,
      documentType,
      fileName: file.name,
      createdAt: new Date().toISOString(),
    };

    store.setReport(reportId, storedReport);

    return NextResponse.json<AnalyzeResponse>({
      reportId,
      report,
    });
  } catch (error) {
    console.error('Unexpected error in analyze route:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
