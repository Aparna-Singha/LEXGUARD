# LEXGUARD — AI Rights & Contract Intelligence System

An adversarial multi-agent AI platform that analyzes legal and quasi-legal documents to detect exploitative clauses, hidden liabilities, ambiguities, and real-world risks before users agree to them.

## Problem

People accept contracts, offer letters, platform terms, subscription policies, ticket terms, and agreements without understanding risky legal implications.

## Solution

LEXGUARD extracts clauses, classifies risks, explains real-world consequences, and suggests negotiation questions with source-grounded evidence.

## Features

- Document upload
- PDF/TXT/DOCX support through the current parser layer
- Clause extraction
- Risk scoring
- Ambiguity detection
- Hidden obligation detection
- Plain-English explanations
- Negotiation recommendations
- Follow-up Q&A
- Source-grounded evidence
- Multi-agent workflow
- Sample demo documents

## Multi-Agent Architecture

LEXGUARD uses a hackathon-friendly two-layer analysis design: a deterministic fallback engine for reliability, and an AI workflow organized into explicit agent roles for richer reasoning.

### Clause Extractor Agent

Extracts exact clauses or evidence-backed snippets from the uploaded document and classifies them into contract-relevant categories such as non-compete, arbitration, termination, payment, privacy, or IP ownership.

### Risk Critic Agent

Reviews the extracted clauses adversarially and flags one-sided, harmful, exploitative, or unusually risky language. This agent is where LEXGUARD asks, "How could this clause be used against the signer?"

### Ambiguity Detector Agent

Finds vague phrases such as "sole discretion," "subject to change," or "reasonable efforts" and highlights where unclear wording creates risk or room for abuse.

### User Impact Explainer Agent

Turns contract language into plain English and explains what the clause could mean in real life, including practical consequences for money, employment, privacy, IP rights, or liability exposure.

### Negotiation Advisor Agent

Suggests questions to ask, issues to push back on, and safer alternatives to negotiate. It is designed to support legal awareness, not to replace legal counsel.

### Report Synthesizer Agent

Assembles the structured report used by the UI, including overall risk level, executive summary, top concerns, category scores, clause details, hidden obligations, ambiguous terms, and recommended questions.

### Deterministic Fallback Risk Engine

When AI is unavailable, rate-limited, disabled, or returns unusable output, LEXGUARD falls back to a deterministic phrase-based engine in [src/lib/risk/fallbackRiskEngine.ts](/C:/Users/aparn/OneDrive/Documents/LEXGUARD/src/lib/risk/fallbackRiskEngine.ts:1). This engine scans the extracted text for known risky patterns and still produces a useful report with evidence-backed findings.

### Current Implementation Note

The architecture is intentionally clean and modular for a hackathon build. The code is structured as multiple agents, but the current AI path still uses a combined structured LLM workflow internally for speed and reliability. The separation is real in code organization even if not every agent is yet an independent model call.

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- React 19
- Google Gemini via `@google/genai`
- `pdfjs-dist` for PDF parsing
- `mammoth` for DOCX parsing
- UTF-8 text parsing for TXT documents
- Local in-memory temporary store for reports and chat history

## Setup

### Requirements

- Node.js `>=20.9.0`
- npm

### Install and Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

If you are on Windows PowerShell and `cp` does not work in your shell, use:

```powershell
Copy-Item .env.example .env.local
```

### Add API Key

Edit `.env.local` and add your Gemini key:

```env
GEMINI_API_KEY=your_key_here
```

Without an API key, LEXGUARD still works in deterministic fallback mode.

## Deployment

### Deploy to Vercel

1. Push this repository to GitHub.
2. Sign in to Vercel and import the GitHub repository.
3. In the Vercel project settings, add the environment variables you want to use:
   - `GEMINI_API_KEY` if you want AI-enhanced analysis
   - `GEMINI_MODEL` if you want to override the default Gemini model
   - `LEXGUARD_FORCE_FALLBACK=true` if you want to demo deterministic mode even in production
   - `LEXGUARD_DEV_MOCK_MODE=false` unless you explicitly want fallback behavior
4. Deploy the project.
5. After deployment, verify:
   - `/api/health` returns a healthy JSON response
   - sample document analysis works from the analyze page
   - report generation and follow-up chat both work

### Important Deployment Warning

LEXGUARD currently uses an in-memory temporary store for reports and chat history. That works for local development and short demo sessions, but it is not persistent on serverless platforms like Vercel. Reports may disappear after a cold start, a redeploy, or a new function instance.

## Environment Variables

These are the exact app-level environment variables currently used in code:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables Gemini-powered AI analysis and AI-powered follow-up chat. If missing, LEXGUARD uses fallback logic. |
| `GEMINI_MODEL` | No | Optional override for the default Gemini model used by the app. |
| `LEXGUARD_FORCE_FALLBACK` | No | Forces the deterministic fallback risk engine even if an AI key is present. Useful for demos and offline testing. |
| `LEXGUARD_DEV_MOCK_MODE` | No | Alias flag for forcing fallback behavior in development. |

Runtime note:
`NODE_ENV` is also read by the local store logic, but it is provided by Next.js/runtime rather than being a project-specific variable you typically set by hand.

## Supported Document Parsing

- `.txt`: supported and expected to work reliably
- `.pdf`: supported with server-side parsing via `pdfjs-dist`
- `.docx`: supported with server-side parsing via `mammoth`

Parsing behavior today:

- MIME type and file extension are both checked
- whitespace is normalized during extraction
- repeated empty lines are collapsed
- very large extracted text is trimmed to a safe maximum length before analysis
- short or unreadable text returns a clear validation error

Important limitation:
scanned or image-only PDFs are not OCR'd yet, so they may fail with a helpful parse error.

## Demo Script

### 2-Minute Judge Demo

1. Open the landing page and introduce LEXGUARD as a contract intelligence tool, not just a chatbot.
2. Click into the analyze page.
3. Use the built-in sample `employment_offer_high_risk.txt` if you do not want to upload a file.
4. Start analysis and point out that the system can run in AI mode or deterministic fallback mode.
5. Open the generated report and show the critical or high overall risk score.
6. Scroll to the clause cards and open the non-compete, IP ownership, or arbitration findings.
7. Highlight the exact evidence text and the plain-English explanation beside it.
8. Show the signing recommendation and top concerns section.
9. Ask a follow-up question in chat such as `Can they terminate me without notice?`
10. Show the grounded clause references and the suggested negotiation next step.

### Suggested Questions During Demo

- `What is the most dangerous clause?`
- `Can I negotiate this?`
- `Does this affect my IP rights?`
- `Can they terminate me without notice?`
- `What should I ask before signing?`

## Sample Documents

LEXGUARD includes fictional demo documents in the `samples/` folder so the product can be shown without uploading real legal files.

Available sample scenarios include:

- high-risk employment offer
- freelancer agreement with IP risk
- subscription terms with hidden fees
- privacy policy with data-sharing risk
- vendor agreement with liability risk

Use sample documents if you do not want to upload a file.

## What the App Does Today

- Uploads or sample documents flow through a parser, analyzer, local store, report page, and follow-up chat.
- The report is grounded in extracted text and structured into clauses, category scores, hidden obligations, ambiguous terms, and recommended questions.
- Follow-up chat is limited to the stored document text and generated report and refuses unrelated questions.
- Reports can be printed with `window.print()`.

## Limitations

- This is not legal advice.
- It does not replace lawyers.
- AI may miss risks or misread context.
- Jurisdiction-specific legal rules are not guaranteed.
- OCR for scanned/image-only documents is not implemented yet.
- Reports and chat history are stored only in local memory in this version and are not persistent on serverless deployments like Vercel.
- The multi-agent workflow is architecturally separated, but the current AI path still uses a combined structured LLM workflow internally.

## Future Scope

- OCR for scanned documents
- jurisdiction-aware legal benchmarks
- vector database / RAG for long-document retrieval
- PDF export
- browser extension for online terms and policies
- team workspace
- lawyer review workflow

## Screenshots

Screenshot placeholders:

- `[Add landing page screenshot here]`
- `[Add analyze page screenshot here]`
- `[Add report page screenshot here]`
- `[Add chat panel screenshot here]`

## Deployed Link

- `[Add deployed app link here]`

## GitHub Repository

- `[Add GitHub repository link here]`

## Disclaimer

This tool provides legal awareness, not legal advice.
