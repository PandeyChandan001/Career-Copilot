# Career Copilot

> AI-Powered ATS Resume Tailoring & Interview Prep Engine

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-green)
![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-teal)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-cyan)

## Architecture & Design Decisions

### Why Google Gemini 1.5 Flash?
We intentionally selected **Gemini 1.5 Flash** as our primary orchestration LLM. In an interactive gap-analysis tool, user wait times are critical. Gemini 1.5 Flash provides exceptional low latency while strictly adhering to `generateObject` Zod schemas, guaranteeing 100% deterministic JSON output that our React components can trust without brittle try/catch parsing loops.

### Deterministic ATS Formatting
Rather than rendering an HTML preview and using volatile Canvas/Puppeteer wrappers (which ATS bots often fail to parse correctly), we use `@react-pdf/renderer` to build a native, declarative, single-column PDF document stream. This guarantees flawless ATS parseability by keeping text layers perfectly intact and utilizing standard typography (Helvetica).

### Decoupled Service Architecture
To maintain a strict hiring-bar engineering standard, business logic is explicitly separated from HTTP boundaries:
- **`src/schemas/`**: Single source of truth. Zod validation schemas govern both environment variables and LLM output expectations.
- **`src/services/`**: Isolated logic. Handles raw text extraction (`pdf-parse`), AI orchestration, and database persistence. 
- **`src/app/api/`**: Thin route handlers. Responsible only for receiving requests, invoking services, and returning structured JSON responses or streaming PDFs.

## Core Features

- **In-Memory PDF Extraction**: Zero temporary file storage. `pdf-parse` extracts raw text from `Buffer` streams entirely in memory.
- **Strict Schema Validation**: The AI output maps strictly to our `PrepAnalysisSchema` and `TailoredResumeSchema`.
- **Actionable AI Feedback**: Transforms missing keywords into categorized gap cards, phased preparation roadmaps, and scenario-based interview questions.
- **Non-blocking Persistence**: `AnalysisRecord` tracking runs asynchronously on Prisma ORM without impacting the HTTP response latency for the user.

## Local Development & Environment Setup

### 1. Clone & Install
```bash
git clone https://github.com/PandeyChandan001/career-copilot.git
cd career-copilot
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NODE_ENV=development
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
DATABASE_URL="postgresql://user:password@your-neon-pool.neon.tech/neondb?sslmode=require"
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

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/parse` | `POST` | Accepts `FormData` with a PDF file. Returns extracted raw text. |
| `/api/analyze` | `POST` | Accepts `resumeText` and `jobDescription`. Returns structured Gap Analysis JSON. |
| `/api/generate-resume` | `POST` | Accepts `resumeText` and `jobDescription`. Returns a streaming ATS-optimized `application/pdf`. |
| `/api/history` | `GET` | Returns recent past analyses, powered by Prisma. |
| `/api/history/[id]` | `GET` | Returns the detailed payload for a specific past analysis by ID. |
