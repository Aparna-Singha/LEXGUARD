import { StoredReport, ChatMessage } from '@/lib/types';

/**
 * Simple in-memory store for hackathon version.
 * Can be replaced with a database or vector store later.
 */
class InMemoryStore {
  private reports: Map<string, StoredReport> = new Map();
  private chatHistories: Map<string, ChatMessage[]> = new Map();

  // ─── Reports ────────────────────────────────────────────
  setReport(id: string, report: StoredReport): void {
    this.reports.set(id, report);
  }

  getReport(id: string): StoredReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): StoredReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  deleteReport(id: string): boolean {
    this.chatHistories.delete(id);
    return this.reports.delete(id);
  }

  // ─── Chat History ───────────────────────────────────────
  getChatHistory(reportId: string): ChatMessage[] {
    return this.chatHistories.get(reportId) || [];
  }

  addChatMessage(reportId: string, message: ChatMessage): void {
    const history = this.chatHistories.get(reportId) || [];
    history.push(message);
    this.chatHistories.set(reportId, history);
  }
}

// Singleton instance — survives across API calls in dev
const globalForStore = globalThis as unknown as { store: InMemoryStore };

export const store = globalForStore.store ?? new InMemoryStore();

if (process.env.NODE_ENV !== 'production') {
  globalForStore.store = store;
}
