'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage, ChatResponse, RelevantClauseReference, RiskLevel } from '@/lib/types';
import { AlertCircle, Bot, Loader2, MessageSquare, Send, Shield, User } from 'lucide-react';

interface ChatPanelProps {
  reportId: string;
  variant?: 'floating' | 'embedded';
}

interface ChatPanelMessage extends ChatMessage {
  relevantClauses?: RelevantClauseReference[];
  riskLevel?: RiskLevel;
  suggestedNextStep?: string;
  disclaimer?: string;
  isError?: boolean;
}

export default function ChatPanel({ reportId, variant = 'floating' }: ChatPanelProps) {
  const isEmbedded = variant === 'embedded';
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: ChatPanelMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, question: userMessage.content }),
      });

      const data = (await response.json()) as ChatResponse | { error?: string };

      if (!response.ok || !('answer' in data)) {
        throw new Error('error' in data && data.error ? data.error : 'Failed to get response');
      }

      const assistantMessage: ChatPanelMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
        relevantClauses: data.relevantClauses,
        riskLevel: data.riskLevel,
        suggestedNextStep: data.suggestedNextStep,
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unknown error. Please try again.';
      setError(message);

      const errorMessage: ChatPanelMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I ran into a problem while answering that question: ${message}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const suggestedQuestions = [
    'What is the most dangerous clause?',
    'Can I negotiate this?',
    'Does this affect my IP rights?',
    'Can they terminate me without notice?',
    'What should I ask before signing?',
  ];

  if (!isEmbedded && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-xl shadow-brand-500/25 transition-all hover:scale-105 no-print"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm">Ask about this report</span>
      </button>
    );
  }

  const containerClasses = isEmbedded
    ? 'glass rounded-2xl border border-white/6 flex flex-col min-h-[34rem]'
    : 'fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[560px] flex flex-col glass rounded-2xl shadow-2xl shadow-black/40 animate-fade-in-up no-print';

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">LexGuard Follow-Up Chat</h3>
            <p className="text-[10px] text-slate-500">
              Ask grounded questions about this contract intelligence report
            </p>
          </div>
        </div>
        {!isEmbedded && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-surface-overlay transition-colors"
          >
            Minimize
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask follow-up questions about specific clauses, the overall recommendation, your IP rights, termination
              exposure, or what to negotiate before signing.
            </p>
            <div className="grid gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => {
                    setInput(question);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-surface-overlay/60 hover:bg-surface-overlay text-sm text-slate-300 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {message.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-brand-400" />
              </div>
            )}

            <div className="max-w-[88%]">
              <div
                className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : message.isError
                    ? 'bg-red-500/10 text-red-200 rounded-bl-sm border border-red-500/20'
                    : 'bg-surface-overlay text-slate-300 rounded-bl-sm'
                }`}
              >
                <div className="chat-markdown whitespace-pre-wrap">{message.content}</div>
              </div>

              {message.role === 'assistant' && !message.isError && (
                <div className="mt-2 space-y-2">
                  {message.riskLevel && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay text-xs text-slate-300">
                      <Shield className="w-3.5 h-3.5 text-brand-400" />
                      <span>Relevant risk level: {message.riskLevel}</span>
                    </div>
                  )}

                  {message.relevantClauses && message.relevantClauses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relevant clauses</p>
                      {message.relevantClauses.map((clause) => (
                        <div
                          key={`${message.id}-${clause.clauseId}`}
                          className="rounded-xl bg-surface-overlay/70 border border-white/5 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-white">{clause.clauseType}</span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-overlay text-[11px] text-slate-300">
                              {clause.severity}
                            </span>
                          </div>
                          <blockquote className="text-xs text-slate-400 border-l-2 border-brand-500/35 pl-3">
                            &ldquo;{clause.evidence}&rdquo;
                          </blockquote>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.suggestedNextStep && (
                    <div className="rounded-xl bg-brand-600/10 border border-brand-500/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">
                        Suggested next step
                      </p>
                      <p className="text-sm text-slate-300">{message.suggestedNextStep}</p>
                    </div>
                  )}

                  {message.disclaimer && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{message.disclaimer}</p>
                  )}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-accent-violet/20 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-accent-violet" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-brand-400" />
            </div>
            <div className="bg-surface-overlay px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
              <span>Searching the report and document evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        {error && (
          <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            className="flex-1 bg-surface-overlay rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 border border-transparent focus:border-brand-500/40 focus:outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          Grounded document Q&A for legal awareness, not legal advice
        </p>
      </div>
    </div>
  );
}
