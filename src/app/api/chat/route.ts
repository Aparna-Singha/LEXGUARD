import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { generateText } from '@/lib/ai/client';
import { store } from '@/lib/store';
import { ChatMessage, ChatResponse, ErrorResponse } from '@/lib/types';
import { getMockReport } from '@/lib/risk/mock-report';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, question } = body as { reportId?: string; question?: string };

    // ─── Validation ──────────────────────────────────────
    if (!reportId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Report ID is required.' },
        { status: 400 }
      );
    }

    if (!question || question.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Please enter a question.' },
        { status: 400 }
      );
    }

    if (question.trim().length > 2000) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Question is too long. Please keep it under 2000 characters.' },
        { status: 400 }
      );
    }

    // ─── Get stored report ───────────────────────────────
    const storedReport = store.getReport(reportId);

    if (!storedReport) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Report not found. It may have expired or been deleted.' },
        { status: 404 }
      );
    }

    // ─── Store user message ──────────────────────────────
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString(),
    };
    store.addChatMessage(reportId, userMessage);

    // ─── Generate answer ─────────────────────────────────
    let answer: string;

    if (!process.env.GEMINI_API_KEY) {
      // Mock response for development
      answer = getMockChatAnswer(question);
    } else {
      const chatHistory = store.getChatHistory(reportId);
      const historyContext = chatHistory
        .slice(-10) // Last 10 messages for context
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const systemInstruction = `You are LexGuard, an AI legal document analysis assistant. You are helping a user understand a ${storedReport.documentType} they uploaded.

IMPORTANT RULES:
1. ONLY answer questions related to the uploaded document and its analysis.
2. If the question is unrelated to the document, politely decline and redirect.
3. Always cite evidence from the document when possible by quoting relevant text.
4. Be clear that you provide legal awareness, NOT legal advice.
5. Use plain, accessible language — avoid unnecessary legal jargon.
6. If you're not sure about something, say so honestly.
7. Never make up information not present in the document.

DOCUMENT TYPE: ${storedReport.documentType}
DOCUMENT TEXT:
---
${storedReport.documentText.slice(0, 30000)}
---

ANALYSIS SUMMARY:
Risk Level: ${storedReport.report.overallRiskLevel} (${storedReport.report.overallRiskScore}/100)
Top Concerns: ${storedReport.report.topConcerns.join('; ')}
Signing Recommendation: ${storedReport.report.signingRecommendation}

PREVIOUS CONVERSATION:
${historyContext}`;

      answer = await generateText({
        prompt: `User question: ${question.trim()}

Please answer based on the document analysis. Cite specific text from the document where relevant. If this question is unrelated to the document, politely decline.`,
        systemInstruction,
        temperature: 0.3,
        maxTokens: 2048,
      });
    }

    // ─── Store assistant message ─────────────────────────
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString(),
    };
    store.addChatMessage(reportId, assistantMessage);

    return NextResponse.json<ChatResponse>({
      answer,
    });
  } catch (error) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate response.';
    return NextResponse.json<ErrorResponse>(
      { error: message },
      { status: 500 }
    );
  }
}

function getMockChatAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('ip') || q.includes('intellectual property')) {
    return '📋 **Regarding IP Ownership:**\n\nBased on the document analysis, the IP assignment clause (Clause 1) is rated as **Critical Risk (92/100)**.\n\nThe clause states:\n> "All intellectual property, inventions, discoveries, and creative works conceived, developed, or reduced to practice during the term of this agreement, whether or not during working hours or using company resources, shall be the sole and exclusive property of the Company."\n\nThis means anything you create — even personal projects made at home on weekends — would belong to the company. I\'d recommend negotiating to limit IP assignment to work directly related to company business.\n\n⚠️ *This is AI-generated analysis for informational purposes, not legal advice.*';
  }

  if (q.includes('non-compete') || q.includes('compete')) {
    return '📋 **Regarding the Non-Compete Clause:**\n\nThe non-compete (Clause 2) is rated **High Risk (78/100)**.\n\nIt restricts you from working for competitors within 100 miles for 24 months after leaving. This is considered unusually restrictive.\n\n**Key concerns:**\n- 24 months is longer than industry standard (typically 6-12 months)\n- 100-mile radius is very broad\n- Some states may not enforce this\n\n**Recommendation:** Negotiate to reduce the scope and duration.\n\n⚠️ *This is AI-generated analysis for informational purposes, not legal advice.*';
  }

  if (q.includes('sign') || q.includes('safe') || q.includes('recommend')) {
    return '📋 **Signing Recommendation: Negotiate Before Signing**\n\nBased on the overall risk score of **68/100 (High)**, I recommend negotiating key terms before signing. The main areas to address:\n\n1. 🔴 IP ownership clause — too broad\n2. 🟠 Non-compete — excessively restrictive\n3. 🟠 Arbitration — favors the company\n4. 🟡 Termination "cause" — needs clear definition\n\nConsider consulting a legal professional for the critical items.\n\n⚠️ *This is AI-generated analysis for informational purposes, not legal advice.*';
  }

  return `📋 **About your question:**\n\nBased on the document analysis, here are the key points to consider:\n\nThe document has an overall risk score of **68/100 (High Risk)** with the recommendation to **"Negotiate before signing."**\n\nThe most critical findings relate to:\n- **IP Ownership** (Critical — score 92/100)\n- **Non-compete restrictions** (High — score 78/100)\n- **Arbitration provisions** (High — score 72/100)\n\nCould you ask a more specific question about a particular clause or area of concern? I can provide more detailed analysis.\n\n⚠️ *This is a mock response for development. Set GEMINI_API_KEY for real AI-powered answers. This is not legal advice.*`;
}
