# Career Copilot

An ATS resume auditing and interview preparation tool that analyzes candidate resumes against job descriptions, identifies skill gaps, and generates tailored STAR interview guides.

Built with **Next.js (App Router)**, **TypeScript**, **OpenRouter (DeepSeek)**, **Prisma**, **Neon PostgreSQL**, and **Clerk**.

---

## Technical Highlights & Architecture

### 1. Type-Safe LLM Pipeline with Zod Fallbacks
* Instead of relying on raw markdown parsing, the AI service requests structured JSON contracts validated via Zod schemas (`PrepAnalysisSchema`, `TailoredResumeSchema`).
* Built client-side and server-side fallback normalization to handle edge cases (e.g., coerced stringified numerics) so unexpected model outputs never cause React render-phase crashes.

### 2. Isolated Persistence Layer
* Analysis persistence (`prisma.analysis.create`) is isolated in dedicated try/catch wrappers.
* If database writes experience latency or cold-start throttling on Neon, the synthesized analysis payload still streams directly to the frontend without hanging the user session.

### 3. In-Memory PDF Ingestion
* Resume files (`.pdf`) are parsed directly from memory buffers via `pdf-parse` without saving temporary files to disk or requiring object storage for transient analysis.

### 4. Direct Client-Side PDF Export
* Export functionality uses dedicated `@media print` styling rules, stripping navigation chrome and application controls to produce clean, ATS-compliant single-column reports without heavy server-side headless browser overhead.

---

## Core Features

* **ATS Compatibility Scoring:** Breaks down overall alignment into technical match, experience relevance, and parseability.
* **Jobscan-Style Keyword Matrix:** Highlights missing vs. matched keywords with suggested bullet-point phrasing.
* **3-Week Remediation Roadmap:** Generates phased sprints targeting identified concept gaps.
* **STAR Interview Simulator:** Produces role-specific behavioral and technical questions paired with high-scoring sample responses.
* **User History:** Scopes saved analyses to the authenticated Clerk user session.

---

## Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/PandeyChandan001/career-copilot.git
cd career-copilot
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
# OpenRouter / DeepSeek
OPENROUTER_API_KEY="your_openrouter_api_key"

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@your-host.neon.tech/neondb?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3. Sync Database
```bash
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
