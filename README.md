# ResearchCollab 🔬

**AI-Powered Collaborative Research Platform**  
STEM AI Hackathon 2026 · IIT Delhi × Microsoft Garage × Imperial College London

---

## What It Is

ResearchCollab is a collaborative research workspace where students and educators work together on structured research and writing projects. AI acts as coach, writing assistant, merger, ethical auditor, and LaTeX paper generator.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| State | Zustand |
| Rich Text | TipTap |
| Realtime | Socket.io (separate Node.js server on Render) |
| Database | Neon (serverless PostgreSQL) |
| ORM | Prisma |
| Auth | Clerk (magic link / email OTP) |
| File Storage | Uploadthing |
| AI | Claude API (`claude-sonnet-4-20250514`) |
| Images | Pollinations.ai (free, no API key) |
| Hosting | Vercel (frontend) + Render (socket server) |

---

## Folder Structure

```
researchcollab/
├── app/                        # Next.js pages
│   ├── login/                  # Page 1: magic link login
│   ├── dashboard/              # Page 2: sidebar + project tabs
│   └── project/[id]/
│       ├── page.tsx            # Page 3: project dashboard
│       ├── workspace/          # Page 4: writing + AI research
│       ├── review/             # Page 5: cross-review
│       ├── output/             # Page 6: merged output + exports
│       ├── latex/              # Page 7: LaTeX editor + preview
│       └── admin/              # Page 8: admin controls
│
├── api/                        # Next.js API routes
│   ├── projects/               # CRUD: projects, members, sections
│   └── ai/                     # AI endpoints: breakdown, research, merge, etc.
│
├── components/
│   ├── ui/                     # Button, Input, Badge, Modal, Avatar, Toast
│   ├── layout/                 # Sidebar, ProjectTab, PageHeader, StatusPill
│   ├── project/                # MemberCard, AICoachPanel, GroupChat, ContributorshipTimeline
│   ├── workspace/              # SectionEditor, AIChat, ImageGenerator, WordCountTracker
│   ├── review/                 # SectionViewer, CommentThread, ApproveButton
│   ├── output/                 # MergedDocViewer, BiasReport, VisualSummary, ExportButton
│   └── latex/                  # SectionNavigator, LaTeXEditor, LaTeXPreview
│
├── lib/
│   ├── agents/
│   │   ├── types.ts            # Agent interface (NEVER changes)
│   │   ├── index.ts            # Agent registry (only file that changes)
│   │   ├── researchAgent.ts    # Research assistant with web search
│   │   ├── mergeAgent.ts       # Document merger
│   │   ├── biasAgent.ts        # Bias auditor
│   │   ├── latexAgent.ts       # LaTeX 10-step pipeline
│   │   └── paperExplainer.ts   # Paper explainer (teammate plug-in)
│   ├── claude.ts               # Claude API wrapper
│   ├── moderation.ts           # Message moderation middleware
│   ├── pollinations.ts         # Image generation helper
│   ├── pdf.ts                  # PDF/TeX export logic
│   ├── prisma.ts               # Prisma client singleton
│   └── uploadthing.ts          # File upload helper
│
├── store/
│   ├── projectStore.ts         # Zustand: current project state
│   └── userStore.ts            # Zustand: auth + user info
│
├── types/
│   └── index.ts                # All TypeScript interfaces
│
├── prisma/
│   ├── schema.prisma           # Full DB schema
│   └── seed.ts                 # Dev seed script
│
├── socket-server/              # Separate repo (deploy to Render)
│   ├── index.ts                # Socket.io Node.js server
│   └── package.json
│
├── middleware.ts               # Clerk auth middleware
├── .env.example                # Environment variables template
└── package.json
```

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd researchcollab
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
# Fill in all values (see .env.example for descriptions)
```

### 3. Database Setup (Neon)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string into `DATABASE_URL`
3. Run migrations:

```bash
npm run db:generate
npm run db:push
npm run db:seed        # optional: seed demo data
```

### 4. Auth Setup (Clerk)

1. Create a free app at [clerk.com](https://clerk.com)
2. Enable **Email Magic Link** or **Email OTP** as the sign-in method
3. Copy `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### 5. File Storage (Uploadthing)

1. Create a free app at [uploadthing.com](https://uploadthing.com)
2. Copy `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

### 6. Socket Server (Render)

```bash
cd socket-server
npm install
# Deploy to Render as a Node.js web service
# Set PORT environment variable on Render
# Copy the Render URL to NEXT_PUBLIC_SOCKET_URL in .env.local
```

### 7. Run Development

```bash
# Terminal 1: Next.js app



# Terminal 2: Socket server (local)
cd socket-server && npm run dev
```

---

## Build Order (20 Modules)

Build strictly in this order — each module reviewed before the next begins:

| # | Module | Description |
|---|--------|-------------|
| 1 | DB Setup | Neon + Prisma schema, all tables, seed script |
| 2 | Auth | Clerk magic link, login page, middleware |
| 3 | Dashboard | Sidebar, project tabs, welcome screen |
| 4 | Project Dashboard | Member cards, status badges, word count bars |
| 5 | AI Coach | Topic breakdown, subtopic negotiation UI |
| 6 | Workspace | TipTap editor, auto-save, submit flow |
| 7 | AI Research Chat | Claude research assistant, context-aware |
| 8 | Image Generation | Pollinations.ai integration |
| 9 | File Upload | Uploadthing, reference PDFs |
| 10 | Moderation | /api/ai/moderate, wraps all chat + submit |
| 11 | Group Chat | Socket.io, realtime broadcast, moderation gate |
| 12 | Review Page | Read-only section viewer, comments, approvals |
| 13 | AI Merge | Merge sections, methodology, bias audit, visual |
| 14 | Output Page | Merged doc, bias report, credits, PDF export |
| 15 | LaTeX Agent | 10-step template + section fillers |
| 16 | LaTeX Editor UI | CodeMirror + section navigator + confirmed state |
| 17 | LaTeX Preview | latex.js live rendering |
| 18 | LaTeX Regeneration | Per-section regenerate + AI Fix button |
| 19 | Export | .tex export + LaTeX PDF export |
| 20 | Polish | Responsive design, loading states, error handling |

---

## Pluggable Agent Architecture

To add a new AI agent:

1. Create `/lib/agents/yourAgent.ts` implementing the `Agent` interface
2. Add **one line** to `/lib/agents/index.ts`:
   ```ts
   import { yourAgent } from './yourAgent'
   export const agents = {
     ...existingAgents,
     yourAgent, // ← only change needed
   }
   ```

Nothing else in the codebase changes. 

---

## Key Design Decisions

- **No Supabase** — banned in India; using Neon instead
- **No passwords** — Clerk magic link / email OTP only
- **No real-time co-editing** — each member edits only their own section
- **No mobile app** — web only
- **Moderation-first** — every user message passes through Claude moderation before being saved or displayed
- **All AI in one provider** — Claude for everything (research, merge, bias, moderation, LaTeX)
- **Images free** — Pollinations.ai requires no API key

---

## Ethical Features (BERA 2024 Compliant)

| Feature | Purpose |
|---------|---------|
| Contributorship Log | Tracks every edit, AI prompt, and review with timestamp |
| Methodology Disclosure | Auto-generates BERA-compliant AI usage paragraph |
| Bias Audit Report | Flags gendered language and unequal attribution |
| Message Moderation | Blocks discrimination, harassment, hate speech |
| Workload Balancer | AI distributes subtopics equitably by word count |
| Language Auto-detect | All AI responses in user's browser language |
| Named Authorship | LaTeX output includes contributor credits |
| AI Usage Disclosure | Final paper includes standardized AI disclosure |
