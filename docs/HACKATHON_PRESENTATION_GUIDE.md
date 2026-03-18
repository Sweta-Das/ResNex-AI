# ResNex-AI Hackathon Technical Deep Dive & Presentation Playbook

This guide is a presenter-focused deep dive for explaining **how ResNex-AI works end-to-end**, plus a ready-to-use demo script and Q&A bank.

Use this with:
- `/home/runner/work/ResNex-AI/ResNex-AI/docs/DOCUMENTATION.md` (full codebase docs)
- `/home/runner/work/ResNex-AI/ResNex-AI/docs/WORKSPACE_DOCUMENTATION.md` (workspace-specific flows)
- `/home/runner/work/ResNex-AI/ResNex-AI/docs/SPEC.md` (product/system intent)

---

## 1) One-slide system summary (say this first)

**ResNex-AI** is a collaborative research platform where student teams can co-author STEM content through:
1. section-wise writing ownership,
2. real-time group collaboration,
3. AI-assisted research/planning/review,
4. moderation and belonging safeguards,
5. final merged outputs (PDF + LaTeX).

### Core architecture

- **Frontend**: Next.js App Router pages and reusable UI components.
  - Main routes live under `/home/runner/work/ResNex-AI/ResNex-AI/app/project/[id]/`.
- **Backend**: Next.js API routes under `/home/runner/work/ResNex-AI/ResNex-AI/app/api/`.
- **Database**: Prisma + PostgreSQL schema in `/home/runner/work/ResNex-AI/ResNex-AI/prisma/schema.prisma`.
- **AI layer**: Pluggable agents and model wrappers in `/home/runner/work/ResNex-AI/ResNex-AI/lib/agents/` and `/home/runner/work/ResNex-AI/ResNex-AI/lib/llm.ts`.
- **Realtime**: Firebase chat integration + Socket server (`/home/runner/work/ResNex-AI/ResNex-AI/socket-server/`).
- **Auth**: Clerk + app-level user mapping in `/home/runner/work/ResNex-AI/ResNex-AI/lib/auth.ts`.

---

## 2) Technical deep dive (component by component)

## A. Frontend and user journey

The high-level user flow is:

1. **Login** (`/app/login/page.tsx`)  
2. **Dashboard** (`/app/dashboard/page.tsx`) for project list and stats  
3. **Project shell** (`/app/project/[id]/layout.tsx`)  
4. Feature tabs:
   - overview (`page.tsx`)
   - chat (`chat/page.tsx`)
   - discover (`discover/page.tsx`)
   - library (`library/page.tsx`)
   - agents (`agents/page.tsx`)
   - review (`review/page.tsx`)
   - output (`output/page.tsx`)
   - latex (`latex/page.tsx`)
   - contributors (`contributors/page.tsx`)
   - reflection (`reflect/page.tsx`)
   - admin (`admin/page.tsx`)

### UI strategy

- UI primitives are centralized in `/components/ui/index.tsx`.
- Page-level composition is done in `/components/layout/` and feature folders (`/components/chat/`, `/components/workspace/`, `/components/latex/`, etc.).
- Zustand stores under `/store/` support session/project-level state.

---

## B. API and backend architecture

All server routes are Next.js route handlers under `/app/api/`.

### Important route families

- `/api/projects` and `/api/projects/[id]/*`: project lifecycle, members, sections, comments, moderation, outputs, papers, latex sync, belonging features.
- `/api/ai/*`: reusable AI endpoints (research, merge, bias-audit, methodology, etc.).
- `/api/dashboard/*`: aggregate dashboard stats.
- `/api/integrations/*`: classroom-style integration endpoints.

### Common backend pattern

Most routes follow this structure:

1. resolve user with `getAuthUser()` (`/lib/auth.ts`)
2. verify membership/authorization
3. validate payload
4. execute Prisma operation(s)
5. optionally call AI/utility layer (`/lib/agents`, `/lib/quality`, `/lib/citations`, etc.)
6. return typed JSON response

This pattern keeps authorization and data consistency close to route-level business logic.

---

## C. Data model and persistence

The schema (`/prisma/schema.prisma`) models collaboration with relational links between:

- **User**
- **Project**
- **ProjectMember**
- **Section** + comments + versions
- **ChatMessage**
- **Paper** and related metadata
- **LatexDocument**
- **FinalOutput**
- **Contributorship / contribution events**
- **Belonging-related models** (growth/milestones/reflections/moderation alerts)

### What to emphasize to judges

- The model is not “just docs storage”; it captures **collaboration semantics** (ownership, reviews, versions, attributable contributions).
- The project uses structured entities for both **content quality** and **team wellbeing signals**, which is unusual for hackathon prototypes.

---

## D. AI subsystem

AI orchestration is split into layers:

1. **Model access abstraction** in `/lib/llm.ts`
   - Supports provider switching through env config.
2. **Task-specific agents** in `/lib/agents/`
   - examples: merge, bias, planner, writer, research-search, paper explainer, LaTeX transfer.
3. **Feature-level API routes**
   - expose agent capabilities to UI with auth + project context.

### Why this is technically strong

- Agent logic is modular and reusable.
- Provider abstraction avoids lock-in.
- AI actions are integrated into workflows (review, merge, citation checks, quality hints) instead of isolated chatbot demos.

---

## E. Realtime collaboration

There are two realtime mechanisms in the project:

- **Firebase-backed chat experience** (primary collaboration messaging)
- **Socket.io server** for low-latency events (notably in LaTeX/conflict-oriented interactions)

Socket server lives in:
- `/home/runner/work/ResNex-AI/ResNex-AI/socket-server/index.ts`
- `/home/runner/work/ResNex-AI/ResNex-AI/socket-server/package.json`

Client socket helper:
- `/home/runner/work/ResNex-AI/ResNex-AI/lib/socket.ts`

### Presentation angle

Call this a **hybrid realtime strategy**:
- Firestore gives easy shared state persistence.
- Socket events provide immediate collaborative feedback where needed.

---

## F. Security, trust, and responsible AI

### Authentication and authorization

- Clerk handles identity (`@clerk/nextjs`).
- `getAuthUser()` in `/lib/auth.ts` binds external identity to app-level user records.
- Project membership/role checks gate sensitive actions.

### Moderation and safety

- Moderation logic in `/lib/moderation.ts`.
- Routes under `/api/projects/[id]/chat` and moderation-alert endpoints gate harmful content and persist alerts.
- Bias and quality routes (`/api/ai/bias-audit`, quality-check routes) create an explicit trust layer around generated/merged output.

### Practical phrasing for judges

“We don’t treat AI output as automatically safe. We add moderation, role checks, and review gates before content reaches final outputs.”

---

## G. LaTeX and publication pipeline

The LaTeX workspace (`/app/project/[id]/latex/page.tsx`) supports:

- template selection,
- structured editing,
- compile-preview loops,
- conversion/transfer from authored content,
- document export paths.

Related routes are under `/api/projects/[id]/latex/*` and project-level output endpoints under `/api/projects/[id]/output*`.

### Why this matters in hackathon scoring

The project goes from ideation to export-ready artifacts, not just chat + notes. It closes the loop from collaboration to deliverable.

---

## 3) Demo flow (8–10 minutes)

Use this exact sequence for a stable live presentation:

1. **Login + dashboard** (30–45 sec)
   - Show user onboarding and project list.
2. **Project overview + section ownership** (45 sec)
   - Explain role-aware collaboration model.
3. **Workspace writing + AI hint/quality touchpoint** (1.5 min)
   - Show real writing assistance, not full auto-writing.
4. **Chat with moderation-aware collaboration** (1 min)
   - Show group discussion / coordination behavior.
5. **Discover + library + paper intelligence** (1.5 min)
   - Show retrieval, summaries, and organization.
6. **Agents hub** (1 min)
   - Show planner/writer/research support.
7. **Merge + bias audit + output** (1.5 min)
   - Demonstrate responsible synthesis and output checks.
8. **LaTeX + compile/export** (1 min)
   - End with publishable-format output.

### Demo fallback plan

If an external API is slow, pre-open:
- an existing project with seeded content,
- one cached paper in library,
- one already-generated output artifact.

That keeps the narrative intact even with network jitter.

---

## 4) Architecture narrative for judges (2-minute script)

“ResNex-AI is architected as a Next.js full-stack system where App Router pages provide role-based collaboration surfaces, API route handlers enforce auth and project-level permissions, and Prisma persists structured collaboration artifacts in PostgreSQL.

We added a modular AI layer: model-provider abstraction in `lib/llm.ts`, task-specialized agents in `lib/agents`, and guarded route-level integration so assistance is embedded in writing, review, and synthesis workflows.

For collaboration latency, we combine Firebase persistence with Socket.io eventing. For trust and inclusion, we enforce moderation checks, maintain audit-style collaboration records, and run quality/bias checks before final outputs. Finally, we bridge into publication workflows through a LaTeX workspace and export pipeline.”

---

## 5) Q&A prep bank (judge-style questions + sharp answers)

## Product + architecture

1. **Why not just use Google Docs + ChatGPT?**  
   Because this system is workflow-native for research teams: section ownership, review/version tracking, citation-aware features, paper discovery, merge+bias pipeline, and LaTeX export all in one project context.

2. **What is your system boundary?**  
   Client UI in Next.js, server logic in Next.js route handlers, data in PostgreSQL via Prisma, realtime via Firebase/Socket.io, and AI providers through `lib/llm.ts`.

3. **How modular is the AI layer?**  
   Agent logic is isolated under `lib/agents`, and provider calls are abstracted in `lib/llm.ts`, so we can swap/extend providers without rewriting feature routes.

4. **How do you avoid AI hallucination risks?**  
   We scope AI by workflow context (sections/papers/project role), expose outputs for review, and pair generated synthesis with quality and bias audit steps before finalization.

5. **What happens if AI fails or API limits are hit?**  
   Core collaboration still works (writing, reviewing, section/version flow). AI capabilities degrade gracefully as assistive modules, not hard dependencies for basic authorship.

## Data + collaboration

6. **How do you represent team collaboration in the DB?**  
   With explicit entities (Project, ProjectMember, Section, versions, comments, contributorship logs, events), not generic blob storage.

7. **How is accountability handled?**  
   Contributions are tied to user/project context and exposed in contributors/output flows for transparent attribution.

8. **How do you support peer review?**  
   Review routes and comments are attached to section-level artifacts, allowing iterative feedback before merge.

9. **How do you handle concurrent editing?**  
   Through realtime channels (Firebase/Socket) plus workflow partitioning by section ownership and synchronization/restore mechanisms.

10. **Can teams recover from mistakes?**  
    Yes, section versioning/restore and project output regeneration support rollback and iterative refinement.

## Safety + ethics

11. **How is harmful content controlled?**  
    Moderation guards are integrated in chat/content routes with alert pipelines for admin-level visibility.

12. **How do you address bias in generated text?**  
    Bias audit endpoints/agents explicitly assess merged outputs before export.

13. **Is private reflection data exposed to AI?**  
    Reflection functionality is handled via dedicated routes/models and separated from normal generation flows.

14. **Do you enforce role-based permissions?**  
    Sensitive actions (admin/moderation/output workflows) are guarded through membership and role checks in route handlers.

## Performance + deployment

15. **Where can this be deployed quickly?**  
    Frontend/API on Vercel, socket server on Render or equivalent, PostgreSQL on Neon.

16. **What are known scaling constraints?**  
    Realtime throughput and third-party AI API latency are the main constraints; architectural separation allows independent scaling paths.

17. **How do you monitor quality over time?**  
    Through contribution analytics, section quality checks, milestone/growth features, and output-level review gates.

18. **What is your strongest engineering decision?**  
    Treating AI as a composable service layer inside a structured collaboration product, instead of making chat the product.

19. **What would you build next with more time?**  
    Stronger test coverage, finer-grained permissions, observability/telemetry dashboards, and asynchronous job queues for heavy AI tasks.

20. **What is the measurable impact target?**  
    Faster research drafting cycles, improved review quality, and clearer team attribution with safer collaborative interactions.

---

## 6) Final presentation checklist (use before going on stage)

- [ ] `.env` is configured and app boots locally (`npm run dev`).
- [ ] Have one seeded demo project with non-empty sections/papers.
- [ ] Validate one path each for chat, discover, agents, output, latex.
- [ ] Keep one fallback tab ready in case an external API call is slow.
- [ ] Assign speaking roles: architecture, demo operator, Q&A owner.
- [ ] Keep this guide open for rapid Q&A reference.

---

If you want, you can now copy this guide into your slides almost 1:1:
- Slides 1–2: sections 1 and 2,
- Slides 3–4: section 3 and script,
- Slides 5–6: Q&A bank condensed into risk/scale/safety buckets.
