import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { db } from '../db/index.js';
import { agentRuns, repositories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import {
    searchRepository,
    readFileLines,
    getDependents,
    getImports,
    getRoutes
} from './repository-tools.service.js';
import type { RepositoryIntent } from '../types/repository.js';

type Emitter = (event: object) => void;

interface AgentRunOptions {
    repositoryId: string;
    visitorId: string;
    conversationId?: string;
    request: string;
    emit: Emitter;
}

const IntentSchema = z.object({
    intent: z.enum(['explain', 'trace', 'debug', 'impact', 'change_request']),
    reasoning: z.string(),
    targetKeywords: z.array(z.string()),
});

const ChangePlanSchema = z.object({
    summary: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    affectedFiles: z.array(z.object({
        path: z.string(),
        reason: z.string(),
        action: z.enum(['modify', 'add', 'delete'])
    })),
    assumptions: z.array(z.string()),
    unresolvedQuestions: z.array(z.string())
});

export const runRepositoryAgent = async ({
    repositoryId,
    visitorId,
    conversationId,
    request,
    emit
}: AgentRunOptions) => {
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, repositoryId));
    if (!repo) throw new Error('Repository not found');

    emit({ type: 'stage', label: 'Classifying request intent...' });

    const classification = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: IntentSchema,
        prompt: `You are the CodeAtlas repository intelligence agent.
Classify the user's intent for the following request:
"${request}"

Available Intents:
- explain: How a feature/module works
- trace: How data/request flows across files
- debug: Why a bug/error is happening
- impact: What breaks if a file/function changes
- change_request: A request to write code, refactor, or fix a defect`
    });

    const intent = classification.object.intent;
    emit({ type: 'intent', intent, keywords: classification.object.targetKeywords });

    // Step 2: Tool Retrieval
    emit({ type: 'stage', label: 'Retrieving relevant repository evidence...' });

    const searchResults = await Promise.all(
        classification.object.targetKeywords.slice(0, 3).map(kw => searchRepository(repositoryId, kw))
    );

    const flatResults = searchResults.flat().slice(0, 5);
    const retrievedFilesContent: string[] = [];
    const evidenceList: Array<{ path: string; startLine: number; endLine: number; claim: string; confidence: string }> = [];

    for (const match of flatResults) {
        try {
            const fileData = await readFileLines(repositoryId, match.path, 1, 80);
            retrievedFilesContent.push(`### File: ${fileData.path}\n\`\`\`${fileData.language}\n${fileData.content}\n\`\`\``);

            // Fetch dependents for impact/debug
            const dependents = await getDependents(repositoryId, match.path);
            const depPaths = dependents.map(d => d.fromPath).join(', ');

            evidenceList.push({
                path: fileData.path,
                startLine: 1,
                endLine: Math.min(30, fileData.totalLines),
                claim: dependents.length ? `Imported by: ${depPaths}` : `Matched search query keyword`,
                confidence: 'graph-confirmed'
            });
        } catch {
            // ignore missing file errors gracefully
        }
    }

    const contextBlock = retrievedFilesContent.join('\n\n');

    // Create Agent Run record in database
    const [agentRun] = await db.insert(agentRuns).values({
        repositoryId,
        visitorId,
        conversationId: conversationId ?? null,
        request,
        intent,
        status: intent === 'change_request' ? 'planning' : 'running',
        evidenceJson: evidenceList,
    }).returning();

    if (!agentRun) throw new Error('Failed to create agent run record');

    if (intent === 'change_request') {
        emit({ type: 'stage', label: 'Generating approval-gated change plan...' });

        const planResult = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: ChangePlanSchema,
            prompt: `You are CodeAtlas Lead Architect. Create a safe structured change plan for:
Request: "${request}"

Repository Context:
${contextBlock}

List the exact files affected, reasons, risk level, assumptions, and unresolved questions.`
        });

        const planJson = planResult.object;

        await db.update(agentRuns).set({
            planJson: planJson as unknown as Record<string, unknown>,
            status: 'planning'
        }).where(eq(agentRuns.id, agentRun.id));

        emit({ type: 'plan', plan: planJson, runId: agentRun.id });
        emit({ type: 'stage', label: 'Awaiting plan approval before generating patch.' });

        return {
            runId: agentRun.id,
            intent,
            plan: planJson,
            evidence: evidenceList,
            status: 'planning'
        };
    }

    // For explain, trace, debug, impact: stream the answer
    emit({ type: 'stage', label: 'Synthesizing evidence-backed answer...' });

    const answerResponse = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: `You are CodeAtlas Repository Assistant. Provide a precise answer with file & line citations for:
Question: "${request}"

Retrieved Repository Code Snippets:
${contextBlock}

Rules:
1. Cite exact file paths and line ranges (e.g. \`src/app.ts:L1-L15\`).
2. Clearly distinguish confirmed facts from inference.
3. State explicitly if evidence is insufficient.`
    });

    const answerMd = answerResponse.text;

    await db.update(agentRuns).set({
        answerMd,
        status: 'completed'
    }).where(eq(agentRuns.id, agentRun.id));

    emit({ type: 'answer', answerMd, evidence: evidenceList, runId: agentRun.id });

    return {
        runId: agentRun.id,
        intent,
        answerMd,
        evidence: evidenceList,
        status: 'completed'
    };
};
