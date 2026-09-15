# Career Copilot

> Production-grade, multi-tenant AI engine for ATS resume gap analysis, interactive tailoring, and STAR interview preparation.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6c47ff?style=flat-square&logo=clerk)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00e599?style=flat-square&logo=postgresql)
![Google Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-4285f4?style=flat-square&logo=google)

---

## Architecture & Engineering Decisions

### Multi-Tenant Isolation & Edge Security
User identity is delegated to **Clerk** via Edge Middleware (`src/middleware.ts`), which validates session tokens before requests reach core compute handlers. Multi-tenancy is enforced at the database level:
* Every user session is anchored to an internal `User` record mapped to Clerk's `userId`.
* All `AnalysisRecord` rows require a strict foreign key relation (`userId`).
* Queries are scoped via `where: { userId }`, preventing cross-tenant access.

### Deterministic LLM Orchestration (Gemini 1.5 Flash)
Rather than relying on unstructured text generation, the application uses **Gemini 1.5 Flash** through the AI SDK's `generateObject` flow backed by **Zod** schemas (`PrepAnalysisSchema`, `TailoredResumeSchema`). This guarantees type-safe JSON contracts between the model and client components without regex parsing loops.

### Decoupled Document Processing & ATS PDF Synthesis
Document compilation is split into two specialized stages:
1. **JSON Tailoring (`/api/tailor-data`)**: Generates structured, Google XYZ-style impact bullet points and categorized skill improvements.
2. **Binary PDF Generation (`/api/export-pdf`)**: Uses `@react-pdf/renderer` server-side to generate a single-column, standard-typography (Helvetica) PDF stream. This avoids brittle DOM-to-canvas rendering and maintains selectable text layers for ATS parsers.

### Service Layer Boundary
Business logic is decoupled from HTTP routing:
* `src/schemas/`: Centralized Zod validation for runtime payloads and environment variables.
* `src/services/`: Pure business modules for in-memory buffer parsing (`pdf-parse`), AI pipelines, and Prisma database persistence.
* `src/app/api/`: Thin route controllers handling auth extraction, input validation, service delegation, and HTTP status codes.

---

## Core Capabilities

* **In-Memory Buffer Extraction**: Fast extraction from uploaded `.pdf` documents using memory buffers—no temporary disk storage.
* **ATS Gap Analysis**: Computes keyword alignment, missing technical competencies, and an overall match score against target job descriptions.
* **Interactive Bullet Editor**: Enables candidates to review, edit, or swap AI-suggested XYZ bullets before compiling their final resume.
* **Phased STAR Roadmap**: Generates target interview prep milestones and situational interview prompts based on extracted role gaps.
* **Tenant-Scoped History**: Analysis records persist to Neon PostgreSQL asynchronously without blocking the main UI response.
* **Sliding-Window Rate Limiting**: Built-in protection on AI generation endpoints to mitigate compute exhaustion.

---

## Local Development & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/PandeyChandan001/career-copilot.git
cd career-copilot
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the project root:

```env
NODE_ENV="development"
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
DATABASE_URL="postgresql://user:password@your-neon-host.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3. Database Migration
Sync the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
```

### 4. Run the App
```bash
npm run dev
```

---

## API Reference

| Endpoint | Method | Protection | Description |
|---|---|---|---|
| `/api/parse` | `POST` | Public | Accepts `FormData` with a PDF file. Returns extracted raw text. |
| `/api/analyze` | `POST` | **Auth** | Accepts `resumeText` and `jobDescription`. Returns structured Gap Analysis JSON. |
| `/api/tailor-data` | `POST` | **Auth** | Accepts parsed text and JD, returns structured Google XYZ bullet points. |
| `/api/export-pdf` | `POST` | **Auth** | Accepts edited resume JSON, streams an ATS-compliant PDF document. |
| `/api/history` | `GET` | **Auth** | Returns recent past analyses scoped to the current user. |
| `/api/history/[id]` | `GET` | **Auth** | Returns the detailed payload for a specific past analysis by ID. |
