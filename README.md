# 🗺️ CodeAtlas

> **Found a great GitHub repo. Now comes the hard part — understanding it.**

CodeAtlas is an **AI-powered repository intelligence platform** built to help developers understand unfamiliar codebases, reason about changes, and plan modifications without spending hours manually tracing files and dependencies.

Paste a public GitHub repository URL, let CodeAtlas analyze the codebase, and start exploring.

Ask questions about the project and get answers backed by **actual files and line-level evidence**. Explore the architecture, understand the impact of a potential change, generate an implementation plan, review the proposed code as a diff, and export it as a patch.

---

## 💡 The Problem

We've all been there.

You discover an interesting open-source repository, join an existing project, or inherit a codebase and immediately start wondering:

- Where does the application start?
- How does authentication work?
- Which files implement this feature?
- Why does this service depend on that module?
- Where should I make this change?
- What else could break if I modify this file?

Before writing any code, you first have to **understand the codebase**.

For large repositories, that can mean hours of searching files, following imports, reading documentation, and reconstructing architecture in your head.

**CodeAtlas is built to shorten that process.**

---

## ✨ Features

### 🔍 Repository Analysis

Paste the URL of a public GitHub repository and let CodeAtlas analyze it.

CodeAtlas examines the repository structure and builds context around the project before you start asking questions.

The analysis pipeline identifies information such as:

- Project structure
- Languages and frameworks
- Important files
- Modules and components
- Imports and dependencies
- Functions and symbols
- Application architecture
- Relationships between different parts of the codebase

Analysis happens explicitly — CodeAtlas doesn't start consuming resources simply because you opened a repository.

---

### 🧭 Repository Explorer

Browse the repository directly inside CodeAtlas.

Navigate through directories and files without constantly switching between GitHub, an IDE, and an AI assistant.

The explorer acts as the foundation for the rest of the repository intelligence features.

---

### 🏗️ Architecture Explorer

Get a higher-level understanding of the project instead of reading every file individually.

CodeAtlas extracts architectural information from the repository and helps expose relationships between major parts of the system.

Use it to understand things like:

- Application structure
- Modules
- Routes
- Services
- Controllers
- Database layers
- External integrations
- Dependencies between components

---

### 🤖 Ask Your Codebase

Ask questions about the repository using natural language.

For example:

```text
How does authentication work?

Where is JWT validation handled?

Which files implement the payment flow?

How does a request reach the database?

Where should I add Google OAuth?

Explain how this module works.
```

Instead of returning a generic AI answer, CodeAtlas retrieves relevant repository context before responding.

---

### 📍 File & Line-Level Evidence

AI explanations shouldn't require blind trust.

CodeAtlas connects answers back to the source code that produced them.

Responses can reference:

```text
src/middleware/auth.ts
Lines 24–61

src/controllers/auth.ts
Lines 43–97

src/services/token.ts
Lines 12–38
```

Open a reference to jump directly to the relevant source code.

The goal is simple:

> **Don't just tell me how the code works. Show me where.**

---

### 💥 Change Impact Analysis

Before changing code, ask CodeAtlas what could be affected.

For example:

```text
What happens if I change the authentication middleware?
```

CodeAtlas analyzes the relevant parts of the repository and identifies potentially affected:

- Files
- Modules
- Dependencies
- Features
- Execution flows
- Risk areas

This gives developers context **before** they start modifying the codebase.

---

### 📋 AI Change Planning

CodeAtlas doesn't immediately start generating code when you request a feature.

It first creates an implementation plan.

For example:

```text
Implement Google OAuth
```

might produce:

```text
Implementation Plan

1. Add OAuth configuration
2. Create authentication callback route
3. Extend the authentication service
4. Update user handling
5. Modify the login interface

Files affected: 5
Risk: Medium
```

The developer reviews the plan before allowing CodeAtlas to continue.

This keeps the human in control of the agentic workflow.

---

### 🔀 Generated Diff Review

After a change plan is approved, CodeAtlas can generate the proposed implementation.

Changes are presented as a **diff** rather than silently modifying the repository.

```diff
- const login = async (email, password) => {
+ const login = async (email, password, provider) => {
```

Developers can inspect what the AI wants to change before using the generated code.

---

### 📦 Patch Export

CodeAtlas doesn't require write access to your GitHub repository.

After reviewing generated changes, export them as a patch that can be applied to the local repository.

This keeps repository credentials and write permissions out of the core CodeAtlas workflow.

---

### 🎮 Demo Repository

Want to explore CodeAtlas without finding a repository first?

Use **Try Demo** to load a prepared repository and explore the complete workflow immediately.

No account or credentials required.

---

## 🔄 How It Works

```text
Public GitHub Repository
          │
          ▼
   Analyze Repository
          │
          ▼
 Repository Intelligence
          │
    ┌─────┼─────────┐
    ▼     ▼         ▼
 Files  Architecture AI Assistant
                    │
                    ▼
             Ask a Question
                    │
                    ▼
          Retrieve Relevant Code
                    │
                    ▼
            Evidence-Based Answer
                    │
                    ▼
             Impact Analysis
                    │
                    ▼
               Change Plan
                    │
                    ▼
              User Approval
                    │
                    ▼
             Generate Changes
                    │
                    ▼
               Diff Review
                    │
                    ▼
             Download Patch
```

---

## 🧠 Agentic Workflow

CodeAtlas is designed around a multi-step coding-agent workflow rather than a simple:

```text
Prompt → LLM → Answer
```

A request can move through stages such as:

```text
User Request
     │
     ▼
   Planning
     │
     ▼
Repository Search
     │
     ▼
Relevant File Retrieval
     │
     ▼
Code Analysis
     │
     ▼
Impact Analysis
     │
     ▼
Implementation Planning
     │
     ▼
Code Generation
     │
     ▼
Self Review
     │
     ▼
Human Review
```

The AI gathers repository context, plans its work, executes individual steps, and reviews the result while keeping the developer involved in important decisions.

---

## 🎯 Example Workflow

Imagine discovering an unfamiliar backend repository.

Paste its public GitHub URL into CodeAtlas.

After analysis, ask:

```text
How does authentication work?
```

CodeAtlas explains the flow and points you to the relevant files and lines.

Then ask:

```text
What would be affected if authentication changed from JWT to sessions?
```

CodeAtlas performs change-impact analysis.

Finally:

```text
Plan the migration.
```

CodeAtlas identifies the required changes and produces an implementation plan.

Approve the plan and CodeAtlas generates the proposed changes.

Review the diff.

Export the patch.

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express
- TypeScript

### AI

- OpenAI
- Agentic planning and code analysis
- Semantic repository retrieval
- Embeddings

### Data

- PostgreSQL
- pgvector

### Infrastructure

- Vercel — Frontend
- Render — Backend
- PostgreSQL — Repository intelligence and analysis data

---

## 🏆 Hackathon

CodeAtlas was built for the **ChatGPT Codex India Hackathon 2026** under:

### Theme 1 — Agentic Coding

The project explores how coding agents can move beyond generating snippets and instead help developers:

**understand → investigate → reason → plan → review → modify**

existing software systems.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

```text
Node.js
npm
PostgreSQL
Git
```

### Clone the repository

```bash
git clone <repository-url>
cd CodeAtlas
```

### Install dependencies

Install dependencies for the frontend and backend:

```bash
npm install
```

Configure the required environment variables using the provided example environment file.

Then start the development server:

```bash
npm run dev
```

> Setup commands may differ depending on the frontend/backend directory structure.

---

## 🗺️ Core Workflow

**Paste Repo → Analyze → Explore → Ask → Assess Impact → Plan → Review Diff → Export Patch**

---

## 🔮 Future Ideas

CodeAtlas currently focuses on repository understanding and safe change planning.

Potential future additions include:

- Private repository support
- GitHub integration
- Pull request generation
- Multi-repository analysis
- CI integration
- Automated test execution
- Historical commit analysis
- Team knowledge bases
- Deeper static analysis
- IDE integrations

---

## 🤝 Contributing

CodeAtlas is currently under active development.

Issues, ideas, and contributions are welcome.

---

## 📄 License

Add your chosen open-source license here.

---

<p align="center">
  <b>CodeAtlas</b><br/>
  Understand the codebase before you change it.
</p>
