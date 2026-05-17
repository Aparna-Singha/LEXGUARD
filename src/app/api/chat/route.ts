import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { respondToFollowUp } from '@/lib/chat/respondToFollowUp';
import { store } from '@/lib/store';
import { ChatMessage, ChatResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    let body: { reportId?: string; question?: string };

    try {
      body = (await request.json()) as { reportId?: string; question?: string };
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid JSON body. Please send reportId and question as JSON.' },
        { status: 400 }
      );
    }

    const { reportId, question } = body;

    if (!reportId) {
      return NextResponse.json<ErrorResponse>({ error: 'Report ID is required.' }, { status: 400 });
    }

    if (!question || question.trim().length === 0) {
      return NextResponse.json<ErrorResponse>({ error: 'Please enter a question.' }, { status: 400 });
    }

    if (question.trim().length > 2000) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Question is too long. Please keep it under 2000 characters.' },
        { status: 400 }
      );
    }

    const storedReport = store.getReport(reportId);
    if (!storedReport) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Report not found. It may have expired or been deleted.' },
        { status: 404 }
      );
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString(),
    };
    store.addChatMessage(reportId, userMessage);

    const response = await respondToFollowUp(storedReport, question.trim());

    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: response.answer,
      timestamp: new Date().toISOString(),
    };
    store.addChatMessage(reportId, assistantMessage);

    return NextResponse.json<ChatResponse>(response);
  } catch (error) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate response.';
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
