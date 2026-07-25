# CodeAtlas Game Plan

**Purpose:** Build CodeAtlas through small, testable sections. Each section ends with verification and an explicit approval checkpoint. We do not start the next section until the current one works and you have reviewed it.

**Starting point:** Scout is a working, already-deployed full-stack research agent with React/Vite, Express/TypeScript, Drizzle/PostgreSQL/pgvector, Gemini through Vercel AI SDK, SSE, Docker for local development, Neon for deployment, and a proven conversation pipeline. CodeAtlas is a deliberate repurpose of this working foundation, not a greenfield rebuild.

**CodeAtlas target:** A no-login public-repository intelligence app. A user chooses a prepared demo repository or pastes a public GitHub URL, receives fast factual repository observations, asks evidence-backed questions, requests a change plan, reviews a generated patch, and downloads it.

**Naming note:** “CodeAtlas” is a working codename, not a final branding decision. During implementation, use neutral internal names such as `repository`, `agentRun`, and `workspace`; postpone a wholesale visual/product rename until the final name is chosen.

---

## Working rules

1. **One section at a time.** No “while we are here” scope expansion.
2. **No destructive cleanup.** Files are removed only after we identify references, confirm the replacement works, and you approve removal.
3. **Every section is runnable.** We build, type-check, and manually verify the exact behavior introduced.
4. **No hidden LLM calls.** Import, file classification, language detection, counts, and graph extraction are deterministic. Gemini is used only for questions, plans, and patches.
5. **No login in the product flow.** The shipped CodeAtlas experience has one mode: demo repository or public GitHub URL. Authentication is removed in a dedicated early section after we map its dependencies and migrate conversation ownership to anonymous visitors.
6. **No GitHub write access.** No OAuth, private-repository access, push, PR, merge, or code execution in this hackathon build.
7. **Every agent claim has a confidence source.** UI and responses distinguish scanner-confirmed facts, graph-confirmed relationships, and LLM inference.
8. **Checkpoint before database/destructive changes.** Before migrations, dependency removals, route replacement, or deployment changes, we stop and review the exact impact.

---

## Before Section 1: baseline confirmation and product decisions

### Why this exists

Scout is already deployed and working. We only need a short local confirmation and a product-decision checkpoint before changing it. We do not rebuild Docker, Neon, or deployment infrastructure from scratch.

### What we will inspect

- Current frontend and backend install/build/run commands.
- Existing Docker local-development and Neon deployment configuration.
- `.env.example` or current environment-variable usage without exposing secret values.
- The current Scout flow: guest request -> conversation -> report -> SSE run -> persistent history.
- Current committed/uncommitted state, if Git safety configuration permits inspection.

### What we will not change

- No application behavior, database schema, dependencies, deployment configuration, or UI.

### Required from you

- Confirm the existing local Docker database command and deployed Neon connection are still the intended environments.
- Confirm whether the existing Gemini API key/project remains available with free-tier access.
- Decide the history model described below: same-browser history only, shareable history links, or both.
- Pick a prepared demo repository. Best option: a moderately sized TypeScript full-stack project with auth, routes, services, models, and one seeded issue.

### Verification

- Backend and frontend builds pass, or we record the existing blocker.
- Existing Docker/Neon workflow is documented, not recreated.
- We record the deployed Scout URL as a working baseline.

### Stop / approval checkpoint

You see the baseline results and choose the database path.

---

## Section 1: CodeAtlas identity, conversation persistence, and auth removal plan

### Outcome

The repository has a CodeAtlas-specific folder/module map, the final history/ownership approach is chosen, and we have a reviewed deletion/migration plan for Scout authentication. No working behavior is broken yet.

### Why before coding

Scout’s research names and authentication assumptions appear in routes, schemas, services, UI, and copy. Auth can be removed, but only after we identify every reference and decide how anonymous conversation ownership will work. This prevents broken routes and orphaned data.

### Existing areas we will map

| Existing Scout area | Initial CodeAtlas decision |
|---|---|
| `services/agent.service.ts` | Keep as the future orchestration home; replace its research stages later. |
| `lib/planner.ts` and `lib/writer.ts` | Keep patterns; adapt later for repository plans and cited answers. |
| `lib/searcher.ts`, `lib/reader.ts` | Keep untouched initially; later replace their use in the agent pipeline. |
| `embedding.service.ts` | Keep untouched and unused initially; semantic retrieval is not a first milestone. |
| `users`, auth controllers/routes, auth pages | Remove after anonymous ownership migration is reviewed and tested. |
| conversations/guest middleware/SSE handling | Keep and adapt; conversation history is a core CodeAtlas feature. |
| reports/research routes and UI | Keep until repository runs replace them; then retire in a later dedicated section. |
| build `dist/` files | Do not edit manually; regenerate only through the build. |

### Changes in this section

- Trace all auth references: routes, middleware, controllers, services, schema foreign keys, frontend context/pages, API refresh behavior, and navigation.
- Decide and document the single anonymous ownership model.
- Add a small architecture/decision note and a file-by-file deletion checklist.
- Add CodeAtlas route/module placeholders only if needed to keep the old Scout path untouched.
- Rename only isolated static copy if it does not create mixed Scout/CodeAtlas runtime behavior.

### Dependencies / requirements

- Your decision on history behavior.

### Verification

- Both applications still build.
- Existing deployed Scout remains untouched.
- There is a clear, reviewed file-by-file auth-removal and rename map.
- There is a concrete ownership model for persistent conversations and repositories.

### Stop / approval checkpoint

You approve the proposed auth-removal, history, and rename list before any deletion or schema migration.

---

## Section 2: use the existing Docker/Neon environment and apply the ownership migration

### Outcome

The existing Docker/Neon environment remains the foundation, and conversation ownership is migrated from optional `userId`/`anonymousVisitorId` ownership to one CodeAtlas visitor identity.

### Recommended choice

Keep the existing Docker Compose local database and Neon deployment database. The goal is to document and verify the already-working flow, then make only the ownership migration needed for a no-login product.

### Changes in this section

- Verify/document existing Docker, Neon, Drizzle, environment-variable, and health-check behavior.
- Replace the two-way conversation owner model with a single anonymous `visitor_id` model.
- Migrate guest-cookie naming from Scout-specific to neutral CodeAtlas naming.
- Remove `user_id` coupling from conversations/reports only after data migration and code paths are ready.
- Preserve existing conversations during migration where feasible; otherwise use a clean development database and explicitly document that decision.

### Dependencies / requirements

- Existing Docker Desktop/Neon setup.
- Existing Drizzle migrations and `drizzle.config.ts`.
- Approved Section 1 ownership model.

### Verification

- Existing database container/Neon database connects successfully.
- Ownership migration applies cleanly and guest history can be created, listed, reopened, and deleted without auth.
- Backend starts and connects to the database.
- Existing Docker/Neon setup remains reproducible from documentation.

### Stop / approval checkpoint

You confirm anonymous history survives a refresh and reopens correctly before any repository tables are created.

---

## Section 3: CodeAtlas database schema and migrations

### Outcome

The database can store repository import sessions, scanned files, dependency edges, and agent runs without disrupting current Scout tables.

### Changes in this section

- Add `repositories` table: source URL, source type (`demo`/`github_public`), revision, status, language/framework metadata, snapshot JSON, errors, timestamps, anonymous owner.
- Add `repository_files` table: path, language, line count, classification, symbols/import metadata, content hash, optional content/storage reference.
- Add `repository_edges` table: import/include/reference edges plus source line and edge type.
- Add `agent_runs` table: request, intent, status, evidence, plan, risk, answer, patch, cost/usage.
- Add narrow indexes for repository/session/path lookups.
- Keep existing Scout `users`, `conversations`, `reports`, `memory_chunks`, and `tool_calls` untouched.
- Generate one additive Drizzle migration; do not rewrite prior migrations.

### Dependencies / requirements

- Section 2 database environment working.
- Confirmed retention policy: repositories are temporary by default; demo repo data may persist.

### Verification

- Migration applies to a clean database and an existing local Scout database.
- Drizzle type-check succeeds.
- Insert/read smoke test for each new table.
- Existing Scout conversation/report read paths still work.

### Stop / approval checkpoint

You review the migration SQL and table shapes before it is applied to any shared/hosted database.

---

## Section 4: repository session API and prepared demo repository

### Outcome

CodeAtlas can create a repository session and load one local prepared demo repository. There is no GitHub network dependency yet.

### Changes in this section

- Add repository routes/controllers/services using the existing `ApiResponse`, `ApiError`, `asyncHandler`, and guest middleware conventions.
- Add `POST /repositories/demo` to create or reuse a demo repository session.
- Add `GET /repositories/:id`, `GET /repositories/:id/tree`, and line-numbered file retrieval endpoints.
- Add a carefully chosen demo repository under a dedicated fixture/demo directory or a versioned archive.
- Add explicit file exclusion rules: no `.env`, `.git`, dependencies, binary/media, generated build output, or massive files.

### Dependencies / requirements

- Section 3 schema.
- You select/provide the demo repository and confirm it can be stored in this project publicly.

### Verification

- Calling the demo endpoint produces a `ready` repository record.
- Tree endpoint matches the demo source tree.
- File endpoint refuses invalid paths and never reads outside the demo root.
- The demo works with no Gemini key and no GitHub access.

### Stop / approval checkpoint

You inspect the returned tree and a few source files before we add analysis.

---

## Section 5: deterministic repository scanner and instant insight cards

### Outcome

CodeAtlas creates factual repository observations without an LLM call.

### Changes in this section

- Add a language detector for common source, frontend, configuration, documentation, and build files.
- Add an extensible parser adapter around Tree-sitter. Start with the demo repository’s languages and frontend formats, then register common grammars: JS/TS/JSX/TSX, Python, C/C++, Java, Go, Rust, C#, PHP, Ruby, HTML, CSS/SCSS, JSON, YAML, SQL, Markdown.
- Extract file inventory, line counts, import/include edges, symbols, entry-point candidates, package/build metadata, and simple classifications such as route/controller/service/model/middleware/component.
- Produce and save `snapshot_json` and dependency edges.
- Add `POST /repositories/:id/scan` and SSE progress events for scanning.

### Dependencies / requirements

- Section 4 repository session and source access.
- Parser package decision after checking package compatibility and build behavior in Node.

### Verification

- Scanner produces a reproducible snapshot for the demo repo.
- At least five displayed counts can be traced to exact files.
- Scanner handles unsupported files by listing/skipping them without failing the job.
- Re-running scan is idempotent; it does not duplicate file/edge records.
- No Gemini API request occurs during scanning.

### Stop / approval checkpoint

You review the snapshot JSON and cards for correctness before frontend implementation relies on them.

---

## Section 6: public GitHub import

### Outcome

A guest can paste a valid public GitHub repository URL and receive a temporary repository session safely.

### Changes in this section

- Implement strict URL normalization for only `https://github.com/{owner}/{repo}`.
- Download a public source archive or shallow clone; choose one based on robust Node support after a short spike.
- Enforce archive, extracted-size, file-count, text-file, and per-file limits.
- Reject private, malformed, unavailable, oversized, and unsupported repositories with useful errors.
- Create random temporary session storage and cleanup on success/error/expiry.
- Reuse the scanner from Section 5; do not create a second analysis path.

### Dependencies / requirements

- Section 5 scanner.
- Network access during local development and a deployment platform that permits outbound GitHub downloads.

### Verification

- Test a small frontend repo, backend repo, and multi-language repo.
- Test malformed URL, non-GitHub URL, private URL, and oversized/invalid archive behavior.
- Confirm a path traversal payload cannot read/write outside the session directory.
- Confirm cleanup runs after a defined short TTL.

### Stop / approval checkpoint

You test import with your chosen public repositories before we add AI behavior.

---

## Section 7: CodeAtlas workspace UI - no AI yet

### Outcome

The frontend becomes a usable repository explorer driven by real APIs, not mock data.

### Changes in this section

- Replace the Scout landing/chat-first entry with CodeAtlas import options: **Try demo** and **Paste public GitHub URL**.
- Build the workspace shell: repository tree, snapshot cards, center source viewer with line numbers, and assistant panel placeholder.
- Add source navigation from cards/search/tree.
- Adapt or temporarily hide research history and login affordances. Preserve their code until CodeAtlas flows are stable.
- Keep the existing polished visual language where it supports readability; do not prioritize visual effects over source clarity.

### Dependencies / requirements

- Sections 4-6 APIs.
- Monaco decision: use a simple line-numbered read-only viewer first if Monaco integration would delay navigation; add Monaco only after the workspace works.

### Verification

- Demo repository loads through the real API.
- Tree selection shows the correct source file and lines.
- Snapshot card filters/navigates correctly.
- Desktop and narrow viewport layouts are usable.
- Frontend build passes with no broken Scout-route assumptions.

### Stop / approval checkpoint

You confirm the explorer is clear and visually usable before agent features are added.

---

## Section 8: repository retrieval tools and agent run skeleton

### Outcome

The backend can perform safe, auditable repository lookups for an agent run. It may return deterministic diagnostic output before an LLM is connected.

### Changes in this section

- Replace Scout’s default web-search/read path with repository tool services:
  - `searchRepository`
  - `readFile(path, line range)`
  - `getImports`
  - `getDependents`
  - `getDependencyPath`
  - `getRoutes`
- Add bounded tool input validation: repository ID, known path only, safe line range, limited result count and bytes.
- Add `agent_runs` lifecycle and `tool_calls` observability.
- Create an agent-run SSE endpoint with real tool event messages.
- Keep the old Scout research pipeline isolated until CodeAtlas questions work.

### Dependencies / requirements

- Sections 3, 5, and 6.

### Verification

- Direct service/API smoke tests return expected files and graph edges for the demo repo.
- Invalid paths, invalid repository IDs, and huge result requests fail safely.
- SSE activity log shows actual tool operations and timings.
- No model call is required to test this section.

### Stop / approval checkpoint

You inspect a tool trace and confirm it reflects real repository evidence.

---

## Section 9: Gemini-powered repository explanation and evidence UX

### Outcome

A user can ask an architecture/debug/impact question and receive a streamed answer rooted in repository evidence.

### Changes in this section

- Adapt Scout planner schema into a CodeAtlas request classifier: `explain`, `trace`, `debug`, `impact`, or `change_request`.
- Use the existing Vercel AI SDK and Gemini integration. Keep model/provider configuration in one environment-driven adapter.
- Give the model only the question, repository snapshot, and retrieved bounded source snippets. Never send the full repo by default.
- Require structured evidence output: path, start/end line, claim, confidence.
- Stream stage events and answer text using the existing SSE architecture.
- Add click-to-open source citations and highlighted line ranges in the workspace.
- Enforce explicit uncertainty when evidence is not sufficient.

### Cost controls

- Use Gemini free-tier access only.
- No embeddings, web grounding, or external web search in the MVP.
- Cap max tool calls, source bytes, response tokens, and retries.
- Keep the prepared demo repository as the main demo path.

### Dependencies / requirements

- Sections 7 and 8.
- A Gemini API key configured only on the backend.

### Verification

- Prepared “auth flow” prompt cites correct source files and opens them at correct lines.
- Prepared “what breaks if…” prompt distinguishes graph facts from inference.
- A request with insufficient evidence produces an honest answer instead of invented citations.
- Inspect server logs/tool calls to verify only relevant files were retrieved.

### Stop / approval checkpoint

You approve answer quality and source navigation before patch generation exists.

---

## Section 10: approval-gated change planning

### Outcome

For a change request, CodeAtlas produces a plan and risk assessment but does not generate code yet.

### Changes in this section

- Add strict structured plan output: affected files, reason, dependencies, assumptions, risk level, and unresolved questions.
- Persist the plan in `agent_runs`.
- Add plan display to the assistant panel and a clear **Generate patch** approval action.
- Add an approval endpoint that checks the run is a valid, completed change plan tied to the active repository.

### Dependencies / requirements

- Section 9 quality gate.
- A prepared change scenario in the demo repository, such as a targeted auth/session defect.

### Verification

- “Implement X” creates a plan but no patch.
- Plan names only existing files and explains each file’s role.
- Patch endpoint/action cannot be used before approval.
- Refreshing the page preserves the plan state.

### Stop / approval checkpoint

You review the visible plan/risk interaction before code generation is enabled.

---

## Section 11: patch generation, self-review, diff, and download

### Outcome

An approved plan produces a safe, reviewable unified diff that a user can download; it does not modify the upstream repository.

### Changes in this section

- Implement patch generation against a temporary copy or in-memory file map, never the imported original.
- Parse and validate patch file paths; reject paths outside the imported repository.
- Add a self-review stage that checks planned files, unintended changes, syntax/formatting clues, and known limitations.
- Persist patch text and changed-file metadata.
- Add a diff viewer. Integrate Monaco only if it materially improves review; a focused diff renderer is acceptable for the MVP.
- Add download as `codeatlas-change.patch`.

### Dependencies / requirements

- Section 10 approval contract.

### Verification

- Demo request produces a parseable unified diff touching expected file(s).
- User can switch changed files and understand additions/removals.
- Downloaded patch can be inspected/applied manually against the same demo revision.
- Path traversal and unapproved patch generation are rejected.

### Stop / approval checkpoint

You manually review the patch before we add any optional test/validation behavior.

---

## Section 12: curated end-to-end demo and reliability pass

### Outcome

The viability-gate flow works reliably on deployment: open link -> demo repo -> question -> cited source -> change plan -> approved patch -> download.

### Changes in this section

- Finalize a prepared demo repository and seeded defect.
- Add explicit error/empty/loading states at every network boundary.
- Apply timeouts, retry policy, repository TTL cleanup, and model rate-limit messaging.
- Add a minimal smoke-test checklist or automated request script.
- Remove or hide any Scout-specific surface that confuses the new product.

### Verification

- Complete the exact three-minute demo on a clean browser session multiple times.
- Test a public import and the prepared demo fallback.
- Build frontend and backend from clean installs.
- Confirm that no API key reaches the browser bundle.
- Confirm repository code is never executed.

### Stop / approval checkpoint

You approve the final user flow before deployment work.

---

## Section 13: deployment, submission assets, and proof of Codex usage

### Outcome

The deployed app, public repository, documentation, and demo evidence satisfy the hackathon viability gate.

### Changes in this section

- Deploy frontend and backend with production environment variables set only on the server.
- Configure CORS, health checks, temporary-storage behavior, and database connection for the chosen host.
- Create a public README: problem, architecture, features, setup, limitations, and demo instructions.
- Create the required project-description document from the final implementation.
- Record a concise 3-minute demo video that shows the real end-to-end flow and meaningful Codex usage.
- Create clean, meaningful commits throughout development; do not squash the history into one final commit.

### Dependencies / requirements

- All prior sections complete.
- Deployment accounts and environment variables.

### Verification

- Deployed URL works in an incognito window.
- Public repo matches the deployed version.
- Core demo works without login.
- Links in README/project document are accessible.

### Stop / approval checkpoint

Final pre-submission walkthrough.

---

## Deferred features (explicitly not allowed to delay the MVP)

- GitHub OAuth/private repository support.
- Branch, commit, push, pull-request, or merge functionality.
- Arbitrary repository test execution.
- Persistent editing of imported repositories.
- Whole-repository embeddings and semantic vector retrieval.
- Multi-agent specialization beyond the visible planner/retriever/reviewer stages.
- Equal framework-specific understanding across every language.

---

## How we will work in this chat

You can edit code, run commands, inspect output, and give feedback directly here. I can inspect files, make scoped changes, run the backend/frontend builds, read terminal output, and iterate with you without switching to another IDE. A local editor such as VS Code is optional only if you personally prefer its visual file navigation; it is not required for this workflow.

For each section, you can simply say:

```text
Start Section N.
```

I will first restate the narrow change set and tests, then make only those changes. At the end, I will report the results and stop for your review.

---

## Known baseline note

The current environment can read and edit the project, but `git status` reports a Git “dubious ownership” safety warning because the repository owner and the sandbox process identity differ. We will not change global Git configuration casually. When we reach commits, we will choose the least invasive fix with your approval.
