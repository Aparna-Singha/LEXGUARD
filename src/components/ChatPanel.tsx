'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  reportId: string;
}

export default function ChatPanel({ reportId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, question: userMessage.content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    'What are the biggest risks in this document?',
    'Is this document safe to sign?',
    'Explain the IP ownership clause',
    'What should I negotiate?',
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-xl shadow-brand-500/25 transition-all hover:scale-105 no-print"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm">Ask about this document</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[560px] flex flex-col glass rounded-2xl shadow-2xl shadow-black/40 animate-fade-in-up no-print">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">LexGuard Assistant</h3>
            <p className="text-[10px] text-slate-500">Ask questions about your document</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-surface-overlay transition-colors"
        >
          Minimize
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 text-center mb-4">
              Ask anything about the analyzed document
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-brand-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-surface-overlay text-slate-300 rounded-bl-sm'
              }`}
            >
              <div className="chat-markdown whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-accent-violet/20 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-accent-violet" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="bg-surface-overlay px-3 py-2 rounded-xl rounded-bl-sm">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document..."
            className="flex-1 bg-surface-overlay rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 border border-transparent focus:border-brand-500/40 focus:outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-1.5 text-center">
          AI-powered analysis — not legal advice
        </p>
      </div>
    </div>
  );
}
