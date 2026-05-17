import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const storedReport = store.getReport(id);

  if (!storedReport) {
    return NextResponse.json(
      { error: 'Report not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: storedReport.id,
    report: storedReport.report,
    documentType: storedReport.documentType,
    fileName: storedReport.fileName,
    createdAt: storedReport.createdAt,
  });
}
