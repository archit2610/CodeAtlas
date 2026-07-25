# CodeAtlas PRD

**Status:** Build-ready MVP specification  
**Product:** CodeAtlas - evidence-backed repository intelligence  
**Primary hackathon themes:** Agentic Coding; UX for Agentic Applications  
**Starting codebase:** Scout (React/Vite + Express + TypeScript + Drizzle/PostgreSQL + pgvector + Vercel AI SDK/Gemini)

---

## 1. Product summary

CodeAtlas helps a developer understand an unfamiliar public GitHub repository and make safe, reviewable changes. A user pastes a public repository URL or opens a prepared demo repository. CodeAtlas immediately shows a factual repository snapshot, then lets the user inspect architecture, ask engineering questions, trace change impact, and generate an approval-gated patch.

**Core promise:**

> Before changing unfamiliar code, see the relevant code path, the evidence behind the recommendation, the likely blast radius, and a reviewable patch.

CodeAtlas is not a browser IDE, a GitHub client, or a generic "chat with your code" product. Monaco is a source and diff review surface. The differentiated product behavior is **evidence-backed repository mapping and safe-change planning**. It has one guest-first product mode; it never asks a judge or user to sign in to GitHub.

---

## 2. Problem and target user

Developers entering an unfamiliar repository often spend hours identifying entry points, request paths, ownership boundaries, and the files affected by a proposed change. Existing AI answers can be useful but often hide their retrieval process and lack a visible approval boundary before code generation.

### Primary user

A developer, contributor, or student evaluating an unfamiliar TypeScript/Node repository who needs to:

- understand how a feature works;
- diagnose a known failure;
- estimate the impact of a change; or
- receive a safe first patch to review locally.

### Hackathon demo persona

A judge opens the prepared demo repository, asks about an authentication or checkout flow, investigates a seeded defect, approves a proposed plan, reviews the patch, and downloads it.

---

## 3. Goals and non-goals

### Goals

1. Accept a public GitHub URL with no login, plus provide a reliable prepared demo repository.
2. Persist repository conversations for anonymous visitors so they can reopen prior repository analyses in the same browser and optionally through an explicit share link.
3. Display a static repository snapshot within seconds: language, framework, file counts, route/controller/model counts, entry points, and dependency facts.
4. Answer architecture, debugging, and change-impact questions with exact file and line evidence.
5. Make the agent workflow visible: plan, retrieve, reason, assess risk, propose patch, self-review.
6. Require user approval before generating a patch.
7. Provide a readable diff and download a `.patch` file.
8. Preserve Scout's strongest assets: agent orchestration, streaming UX, guest sessions, conversation history, database conventions, error handling, and visual quality.

### Non-goals for the MVP

- GitHub OAuth, private repositories, Git push, pull requests, branches, or merging.
- Full cloud IDE behavior or durable server-side editing.
- Arbitrary code execution or test runs for untrusted repositories.
- Perfect semantic support for every language or framework.
- Perfect whole-program dependency analysis.
- A vector database as a prerequisite for the first end-to-end flow.

**Language policy:** CodeAtlas accepts repositories of any language. For every text source file it provides a file tree, detected language, source viewer, text/symbol search where possible, and line citations. It provides parser-backed deep analysis for common languages and web files: JavaScript, TypeScript, JSX/TSX, Python, C/C++, Java, Go, Rust, C#, PHP, Ruby, HTML, CSS/SCSS, SQL, JSON, YAML, and Markdown. Unknown languages remain browseable and can be read by the agent, but their relationships are labelled as inference rather than parser- or graph-confirmed.

This is broad language support, not a promise of equal framework-specific expertise in every ecosystem. Clearly label every insight as scanner-confirmed, graph-confirmed, or agent inference.

---

## 4. User experience

### 4.1 Landing and import

The landing page has two clear choices:

1. **Try the demo repository** - opens a prepared TypeScript SaaS/e-commerce repository with auth, checkout, API routes, a database layer, and one seeded defect.
2. **Analyze a public repository** - accepts only a GitHub repository URL and validates that it is public, GitHub-hosted, and under the defined size/file limits.

After import starts, show real analysis events rather than decorative progress:

```text
Validating repository URL
Downloading source archive
Ignoring generated and binary files
Detecting framework and package manager
Parsing imports, routes, and exported symbols
Building repository snapshot
Repository ready
```

### 4.2 Instant repository snapshot

Show this immediately after the deterministic scanner completes. Example cards:

- 43 TypeScript files
- 5 controllers
- 7 models/schemas
- 18 detected API routes
- 3 authentication-related modules
- Next.js + Express + PostgreSQL
- Main entry points: `src/app.ts`, `src/routes/index.ts`

Cards must link to the relevant file list or a filtered view. They are scanner facts, not model guesses.

### 4.3 Main workspace

Use a three-panel desktop layout:

```text
Repository tree | Source / Diff viewer | CodeAtlas assistant
```

- **Left:** file tree, search, analysis summary, suggested prompts.
- **Center:** source file viewer with line numbers, cited-line highlighting, and a Diff tab.
- **Right:** conversational assistant, visible activity log, evidence citations, risk assessment, and plan approval.

For mobile, use tabs/drawers rather than forcing three columns.

### 4.4 Questions and changes

Suggested demo prompts:

- "How does authentication work in this repository?"
- "Trace the checkout request from UI to database."
- "Why do users lose their session after checkout?"
- "What breaks if I modify the payment service?"
- "Implement Google OAuth safely."

An explanatory response must include:

- a concise answer;
- an evidence list of file paths and line ranges;
- an architecture or execution trace where relevant; and
- an explicit uncertainty statement when evidence is insufficient.

A change request must first produce a plan. The UI displays affected files, the reason each is affected, dependencies, estimated risk, and assumptions. The user presses **Generate patch** only after reviewing that plan.

### 4.5 Patch review

The generated patch is displayed by file, with additions and removals. The user can:

- switch among changed files;
- read the agent's self-review and limitations;
- copy the diff; or
- download `codeatlas-change.patch`.

The MVP does not alter the original GitHub repository.

---

## 5. System architecture

```text
React/Vite UI
  -> Express API
      -> Repository import/session manager
      -> Deterministic repository scanner
      -> Repository knowledge store
      -> CodeAtlas agent orchestrator
           -> repository tools: search, read, graph, cite, patch
      -> diff/patch service
  -> PostgreSQL + pgvector (persistence and optional semantic retrieval)
```

### 5.1 Repository import and safety

Input: a public URL matching `https://github.com/{owner}/{repo}`.

Implementation requirements:

- Use GitHub's public source archive endpoint or a shallow clone; prefer archive download for MVP simplicity.
- Validate host and path before any network request. Do not accept arbitrary archive URLs.
- Enforce a compressed download limit, extracted size limit, file count limit, and per-file text-size limit.
- Skip `node_modules`, `.git`, build output, lock-file duplicates, binaries, media, minified files, and secrets-like files such as `.env`.
- Store extracted source in a random session directory; remove it after expiry. Do not execute repository code.
- Return a clear error state for private, unavailable, oversized, or unsupported repositories.

### 5.2 Deterministic scanner

The scanner produces facts before any LLM call. It detects files by extension and shebang, then handles common languages, web assets, and package/build manifests. It must recognize frontend repositories as first-class inputs, including HTML, CSS/SCSS, JavaScript/TypeScript, JSX/TSX, React/Vue/Svelte-style components, static assets, and common frontend configuration.

Outputs:

- file inventory and directories;
- package manager, framework, and dependency detection from `package.json`;
- import/export graph;
- source symbols (functions, classes, interfaces, route handlers);
- Express-style route definitions and Next-style route files;
- controller, model/schema, service, middleware, and configuration classifications;
- file line maps; and
- simple entry-point candidates.

Use Tree-sitter grammars as the extensible shared parsing layer. Start with grammars for JavaScript/TypeScript/JSX/TSX, Python, C/C++, Java, Go, Rust, C#, PHP, Ruby, HTML, CSS/SCSS, JSON, YAML, SQL, and Markdown. This provides a common AST, symbols, imports/includes, declarations, and line-location model across source and frontend files. Add TypeScript's compiler API or `ts-morph` only as an optional TypeScript-specific enhancement for route/framework resolution. Regex may be used only for framework-specific fallbacks, never as the sole source for line citations.

### 5.3 Repository knowledge store

Persist scanner output as structured JSON linked to a repository session. Do not start with embeddings for every file.

For the MVP, combine deterministic keyword/symbol/import search with the agent's explicit tools. Add embeddings only for large repositories or semantic questions after the primary flow is stable.

### 5.4 Agent orchestration

The agent must not receive the full repository in a single prompt. It receives a compact repository profile and can request bounded tools:

```text
searchRepository(query)
readFile(path, startLine, endLine)
getFileSummary(path)
getImports(path)
getDependents(path)
getDependencyPath(from, to)
getRoutes()
createPatch(files, instructions)
```

The backend owns tool execution and validates every tool parameter against the imported repository manifest. The model never gains shell or network access to the imported code.

The orchestration stages are:

```text
Classify request
-> Retrieve relevant repository evidence
-> Trace paths/dependencies
-> Explain or create change plan
-> Wait for approval (change requests only)
-> Generate patch
-> Run static self-review
-> Return citations, risks, and diff
```

The current Vercel AI SDK + Gemini integration is reusable. Keep it as the initial provider to reduce refactor risk, but create a small `llm.provider.ts` adapter so a provider/model can be changed through environment configuration later. The agent workflow and tool contracts must remain provider-independent.

### 5.5 Streaming

Keep Scout's Server-Sent Events pattern. Replace research-specific events with repository events:

```text
stage: importing | scanning | retrieving | tracing | planning | patching | reviewing
snapshot: repository facts
evidence: file and line references
plan: affected files, risks, assumptions
token: streamed assistant text
patch: unified diff and changed files
complete | error
```

---

## 6. Existing Scout-to-CodeAtlas mapping

| Existing Scout asset | CodeAtlas use | Action |
|---|---|---|
| `backend/src/services/agent.service.ts` | Main agent orchestration | Replace research stages with repository tools and plan/patch stages. |
| `backend/src/lib/planner.ts` | Request classifier and change planner | Retain structured-object pattern; change schema to intent, relevant symbols, plan, risks, assumptions. |
| `backend/src/lib/searcher.ts` | External web search | Remove from default flow; replace with local `searchRepository`. |
| `backend/src/lib/reader.ts` | Webpage reader | Replace with line-bounded `readFile` and graph lookups. |
| `backend/src/lib/writer.ts` | Streaming answer writer | Retain streaming; require citations and structured evidence payloads. |
| `backend/src/services/embedding.service.ts` | Semantic memory | Retain as an optional second-phase repository retrieval service, not core dependency. |
| `conversations`, `reports`, `memory_chunks` tables | Repository conversations, agent runs, optional retrieval chunks | Evolve/migrate; do not delete working auth/user tables. |
| `tool_calls` table | Agent observability | Activate it. Store tool names, inputs, outputs, timing, and failures for the activity log. |
| Guest middleware and JWT auth | Guest-first mode and anonymous session identity | Keep guest behavior. Do not expose login, registration, or GitHub connection in CodeAtlas. Existing auth code may remain unused during the hackathon. |
| `ChatApp.tsx` | Assistant/activity-log interaction patterns | Rework into CodeAtlas workspace; preserve SSE, conversation, loading, and error behavior. |
| `ConversationSidebar.tsx` | Repository session / thread history | Rename and adapt after the primary workspace works. |
| Existing auth pages and middleware | Optional existing account system | Leave intact but remove it from the primary demo path. |

---

## 7. Data model changes

Remove the Scout account/authentication model after the anonymous ownership migration is tested. Use one long-lived, anonymous `visitor_id` cookie for repositories and conversations. Add an optional unguessable share token to a repository conversation only when the visitor explicitly chooses to share it. Add these tables rather than overloading research-report fields indefinitely.

### `repositories`

| Field | Purpose |
|---|---|
| `id` | UUID primary key |
| `visitor_id` | Anonymous browser ownership |
| `source_type` | `demo` or `github_public` |
| `source_url` | Canonical public GitHub URL |
| `default_branch`, `commit_sha` | Imported revision identity |
| `name`, `owner` | Display metadata |
| `status` | `pending`, `importing`, `scanning`, `ready`, `error`, `expired` |
| `frameworks`, `languages`, `snapshot_json` | Structured scanner output |
| `error_message`, timestamps | Recovery and expiry |

### `repository_files`

| Field | Purpose |
|---|---|
| `repository_id`, `path` | Repository-scoped file identity |
| `content` or transient storage reference | Source retrieval |
| `language`, `line_count`, `content_hash` | Viewer and integrity |
| `classification`, `symbols_json`, `imports_json` | Scanner facts |
| `is_indexed` | Retrieval state |

### `repository_edges`

| Field | Purpose |
|---|---|
| `repository_id` | Scope |
| `from_path`, `to_path` | Import/dependency graph |
| `edge_type`, `source_line` | Explanation and citations |

### `agent_runs`

| Field | Purpose |
|---|---|
| `repository_id`, `conversation_id`, `visitor_id` | Context and anonymous ownership |
| `request`, `intent`, `status` | Run lifecycle |
| `plan_json`, `evidence_json`, `risk_json` | Review artifacts |
| `answer_md`, `patch_text`, `tokens_used`, `cost_usd` | Result and observability |

Use the existing `tool_calls` table with `agent_run_id` (new nullable foreign key) or create a corresponding `repository_tool_calls` table if migrating it would be disruptive.

---

## 8. API contract

All endpoints return the existing `ApiResponse` shape.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/repositories/import` | Validate URL and create an import job/session. |
| `GET` | `/api/v1/repositories/:id/events` | SSE import and scanner progress. |
| `GET` | `/api/v1/repositories/:id` | Repository metadata and snapshot cards. |
| `GET` | `/api/v1/repositories/:id/tree` | File tree. |
| `GET` | `/api/v1/repositories/:id/files/*` | Line-numbered file content. |
| `GET` | `/api/v1/repositories/:id/search?q=` | Symbol/path/content search. |
| `POST` | `/api/v1/repositories/:id/agent-runs` | Start explanation, debug, impact, or change-plan run. |
| `GET` | `/api/v1/agent-runs/:id/events` | SSE agent progress and response. |
| `POST` | `/api/v1/agent-runs/:id/approve` | Explicitly approve an already-created change plan. |
| `GET` | `/api/v1/agent-runs/:id/patch` | Return/download unified patch. |

---

## 9. Acceptance criteria

### Import and scanner

- A valid demo repository reaches `ready` reliably on a clean deployment.
- A small public GitHub repository in a supported common language, including a frontend HTML/CSS/React-style project, produces a snapshot without login.
- Snapshot counts are derived from scanner data and link to real files.
- Bad URLs, private repos, archive failures, oversized repos, and unsupported inputs have readable errors.

### Evidence and navigation

- The answer to a prepared auth-flow question cites at least three correct files and opens each at the cited lines.
- An impact answer identifies direct dependents using the import graph and distinguishes confirmed edges from model inference.
- The agent never invents an inaccessible file or line citation; it states when it cannot establish an answer.

### Change planning and patch

- A change request first returns a plan; it does not create a patch until the user approves.
- Plan includes affected files, purpose, assumptions, risk level, and unresolved questions.
- The patch is valid unified diff text and downloadable.
- The seeded-bug demo produces a patch touching the expected file(s).

### UX and reliability

- All long operations use visible SSE stages and recoverable error states.
- The prepared demo flow works without auth, GitHub OAuth, or external database setup by a judge.
- Repository source is never executed.

---

## 10. Implementation sequence

### Phase 0 - Preserve and establish baseline

1. Commit the uploaded Scout project untouched.
2. Run and document the existing frontend/backend build commands.
3. Duplicate only the required feature branches/modules; avoid a destructive rewrite.
4. Change branding and copy after the core import flow is available.

### Phase 1 - Repository ingestion and snapshot

1. Add `repositories`, `repository_files`, and `repository_edges` migrations.
2. Build the prepared demo-repository import path first.
3. Implement safe GitHub archive import with limits and cleanup.
4. Implement the extensible Tree-sitter scanner, beginning with the grammars needed by the prepared demo and common frontend/backend repositories; add the remaining common-language grammars through the same adapter contract.
5. Build snapshot cards, tree, and basic source viewer.

**Milestone:** A judge can open the demo repo and inspect factual cards and files.

### Phase 2 - Repository agent

1. Replace Scout's web planner/searcher/reader with repository request classification and bounded tools.
2. Convert the planner to a strict structured schema.
3. Stream real tool activity through the existing SSE architecture.
4. Implement evidence payloads and source-line highlighting.
5. Support architecture explanation and change-impact requests.

**Milestone:** “How does authentication work?” returns a useful, cited explanation and clicks open the relevant lines.

### Phase 3 - Safe-change workflow

1. Add plan JSON, approval endpoint, patch generator, and self-review.
2. Build a diff viewer; add Monaco only when source/diff navigation works.
3. Implement patch download.
4. Create the seeded bug and test the full diagnosis-to-patch demo.

**Milestone:** The planned 3-minute demo works end to end.

### Phase 4 - Polish and optional improvements

1. Refine visual design, loading states, empty states, and mobile behavior.
2. Activate run/tool observability UI.
3. Add semantic retrieval for larger repos only if it improves measured answers.
4. Add a second public repo test case.

---

## 11. Demo script (3 minutes)

1. **0:00-0:20:** State the problem: developers cannot safely change code they do not yet understand.
2. **0:20-0:40:** Open CodeAtlas and choose the prepared demo repo. Show instant factual cards.
3. **0:40-1:15:** Ask, “How does authentication work?” Show the live retrieval/tracing stages, evidence list, and highlighted sources.
4. **1:15-1:55:** Ask, “Why do users lose their session after checkout?” Show the cross-module trace, confirmed impact, and root-cause explanation.
5. **1:55-2:30:** Approve the proposed fix plan. Show plan, risk, changed files, and patch generation/self-review.
6. **2:30-2:50:** Review the diff and download patch.
7. **2:50-3:00:** Show the activity log/tool trace and explain that Codex was used to plan, build, test, and iterate on the product.

---

## 12. Risks and decisions

| Risk | Mitigation |
|---|---|
| GitHub/network disruption during judging | Prepared demo repository is the default demo path. |
| LLM hallucinated architecture claims | Require retrieved-file citations; distinguish scanner facts, confirmed graph edges, and agent inference. |
| Over-scoping into a Cursor clone | Exclude Git write operations and full IDE features. Keep impact analysis and evidence at the center. |
| Huge/malicious repositories | Strict URL, file, size, type, and timeout limits; never execute source. |
| Patch quality variability | Use one curated repo and one seeded scenario; enforce structured plans and deterministic context. |
| Existing Scout domain concepts leak into UI | Replace research/report terminology systematically as each feature migrates. |

---

## 13. Success definition

CodeAtlas is ready to submit when a first-time user can open a deployed link, select the demo repository, understand a real architecture flow through cited source lines, obtain an impact-aware fix plan, approve it, review a patch, and download it—with no authentication, manual setup, or hidden operator intervention.
