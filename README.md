# 🛡️ LexGuard — AI Rights & Contract Intelligence System

> **Adversarial multi-agent AI system** that analyzes contracts, offer letters, quotations, ticket terms, online policies, and legal/quasi-legal documents to detect exploitative clauses, hidden liabilities, legal ambiguities, and real-world risks — **before you sign.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google)

---

## ⚠️ Disclaimer

> This tool provides **legal awareness and risk explanation**, not legally binding advice. AI-generated analysis may contain inaccuracies. **Consult a qualified legal professional** for final decisions before signing any document.

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd LEXGUARD

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Gemini API key

# 4. Run the development server
npm run dev

# 5. Open http://localhost:3000
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a free API key
3. Add it to `.env.local` as `GEMINI_API_KEY=your_key_here`

> **Note:** The app works without an API key using mock data (clearly labeled) for development/demo purposes.

---

## 📋 Features

### Core Capabilities
- 📄 **Multi-format document parsing** — PDF, DOCX, TXT
- 🤖 **Adversarial multi-agent AI analysis** — 6 specialized agents
- 📊 **Comprehensive risk scoring** — 0-100 per clause and overall
- 🔍 **Hidden clause detection** — buried obligations, auto-renewals, IP traps
- 💬 **Follow-up Q&A** — chat with AI about your specific document
- 📱 **Responsive UI** — works on desktop and mobile

### Risk Detection Categories
| Category | What It Detects |
|----------|----------------|
| Financial | Payment terms, penalties, hidden fees |
| Privacy & Data | Data collection, retention, sharing |
| Employment | Non-competes, termination, at-will clauses |
| Intellectual Property | IP assignment, work-for-hire, ownership |
| Termination | Exit clauses, notice periods, severance |
| Dispute Resolution | Arbitration, jurisdiction, class action waivers |
| Compliance | Regulatory obligations, policy changes |

### Supported Document Types
- Employment Contracts
- Offer Letters
- Freelance Agreements
- Rental Agreements
- Vendor Agreements
- Subscription Terms
- Privacy Policies
- Terms of Service
- Insurance Policies
- Quotation / Purchase Terms

---

## 🏗️ Architecture

### Adversarial Multi-Agent Design

```
Document Upload
       │
       ▼
┌─────────────────┐
│ Document Parser  │  ← Extracts text from PDF/DOCX/TXT
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│            Multi-Agent Analysis Pipeline          │
│                                                   │
│  ┌──────────────┐  ┌───────────────┐             │
│  │   Clause      │  │   Risk        │             │
│  │   Extractor   │  │   Critic      │             │
│  └──────┬───────┘  └───────┬───────┘             │
│         │                  │                      │
│  ┌──────┴───────┐  ┌──────┴────────┐             │
│  │  Ambiguity   │  │  User Impact  │             │
│  │  Detector    │  │  Explainer    │             │
│  └──────┬───────┘  └───────┬───────┘             │
│         │                  │                      │
│  ┌──────┴───────┐  ┌──────┴────────┐             │
│  │ Negotiation  │  │    Report     │             │
│  │  Advisor     │  │  Synthesizer  │             │
│  └──────────────┘  └──────────────┘              │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Risk Report   │  ← Structured JSON
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  Report Page   │  ← Interactive UI
              └───────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Google Gemini 2.0 Flash |
| Document Parsing | pdfjs-dist, mammoth |
| Storage | In-memory (hackathon version) |
| Icons | Lucide React |

### Folder Structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── analyze/page.tsx            # Upload & analyze page
│   ├── report/[id]/page.tsx        # Risk report page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Design system
│   └── api/
│       ├── analyze/route.ts        # Document analysis API
│       ├── chat/route.ts           # Follow-up Q&A API
│       └── report/[id]/route.ts    # Report retrieval API
├── components/
│   ├── Header.tsx                  # Navigation header
│   ├── Footer.tsx                  # Footer with disclaimer
│   ├── FileUpload.tsx              # Drag & drop upload
│   ├── DocumentTypeSelector.tsx    # Document type picker
│   ├── AnalysisProgress.tsx        # Multi-agent progress UI
│   ├── RiskScoreCard.tsx           # Animated risk score ring
│   ├── RiskCategoryCard.tsx        # Category risk cards
│   ├── ClauseCard.tsx              # Expandable clause detail
│   ├── ChatPanel.tsx               # Follow-up Q&A chat
│   ├── ExportButton.tsx            # Print/download buttons
│   └── Disclaimer.tsx              # Legal disclaimer
└── lib/
    ├── ai/
    │   ├── client.ts               # Modular AI client (Gemini)
    │   ├── analyzer.ts             # Analysis orchestrator
    │   └── agents/                 # Individual agent prompts
    │       ├── clause-extractor.ts
    │       ├── risk-critic.ts
    │       ├── ambiguity-detector.ts
    │       ├── user-impact-explainer.ts
    │       ├── negotiation-advisor.ts
    │       └── report-synthesizer.ts
    ├── parsers/
    │   ├── index.ts                # Unified parser router
    │   ├── pdf-parser.ts           # PDF extraction
    │   ├── txt-parser.ts           # Plain text
    │   └── docx-parser.ts          # DOCX extraction
    ├── risk/
    │   └── mock-report.ts          # Dev-mode mock data
    ├── store/
    │   └── index.ts                # In-memory store
    └── types/
        └── index.ts                # TypeScript type definitions
```

---

## 🎮 Demo Script

### For Hackathon Presentation

1. **Open the landing page** — Show the professional UI and feature overview
2. **Click "Analyze Document"** — Navigate to the upload page
3. **Upload a sample contract** — Use any PDF, DOCX, or TXT file
4. **Select document type** — e.g., "Employment Contract"
5. **Watch the multi-agent analysis** — Animated progress shows each AI agent working
6. **Review the risk report:**
   - Overall risk score (animated ring)
   - Executive summary
   - Risk category breakdown
   - Expandable clause cards with severity ratings
   - Ambiguous terms section
   - Hidden obligations
   - Recommended questions before signing
7. **Use the chat panel** — Ask follow-up questions about specific clauses
8. **Export the report** — Print or download as JSON

### Sample Questions to Ask in Chat
- "What are the biggest risks in this document?"
- "Explain the IP ownership clause in simple terms"
- "Is this document safe to sign?"
- "What should I negotiate before signing?"

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes* | Google Gemini API key |

\* Without an API key, the app runs with mock data for demo purposes.

---

## 📐 Design Decisions

1. **Single LLM call in v1** — The multi-agent pipeline uses a combined prompt in v1 for speed, but the code is structured with separate agent modules for easy decomposition in v2.

2. **In-memory storage** — Reports are stored in a global Map for the hackathon. The store interface is designed to be easily replaced with a database or vector store.

3. **Modular AI client** — The `client.ts` module wraps the Gemini API and can be swapped for OpenAI or any provider with minimal changes.

4. **Adversarial prompting** — The system prompt instructs the AI to assume worst-case interpretations, mimicking how an opposing attorney would read the contract.

---

## 🚧 Limitations

- **Not legal advice** — AI-generated analysis for informational purposes only
- **In-memory storage** — Reports are lost on server restart
- **Single LLM call** — Agents don't actually run independently yet (v1 simplification)
- **No OCR** — Scanned PDFs (image-based) are not supported
- **No authentication** — Anyone can access any report by ID
- **Token limits** — Very long documents may be truncated
- **English only** — Analysis is optimized for English-language documents

---

## 🔮 Future Improvements

- [ ] **Independent agent execution** — Run each agent as a separate LLM call for deeper analysis
- [ ] **Vector database / RAG** — Store document embeddings for semantic search
- [ ] **Persistent storage** — PostgreSQL or MongoDB for production
- [ ] **User authentication** — Secure report access with user accounts
- [ ] **Batch analysis** — Upload and compare multiple documents
- [ ] **Template library** — Pre-built analysis templates for common document types
- [ ] **OCR integration** — Support for scanned documents
- [ ] **Multi-language support** — Analyze documents in other languages
- [ ] **Clause comparison** — Compare clauses against industry standards
- [ ] **Version tracking** — Track changes across document revisions
- [ ] **PDF annotation** — Highlight risky clauses directly in the document
- [ ] **Export to PDF** — Generate professional risk report PDFs

---

## 📜 License

MIT

---

Built with ❤️ for making legal documents more transparent and accessible.
