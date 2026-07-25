import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { db } from '../db/index.js';
import { agentRuns, repositories } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { readFileLines } from './repository-tools.service.js';

const SelfReviewSchema = z.object({
    isSyntaxValid: z.boolean(),
    touchesUnrelatedFiles: z.boolean(),
    summary: z.string(),
    confidenceScore: z.number().min(0).max(100),
    knownLimitations: z.array(z.string())
});

export const approveChangePlan = async (runId: string, visitorId: string) => {
    const [run] = await db.select()
        .from(agentRuns)
        .where(and(eq(agentRuns.id, runId), eq(agentRuns.visitorId, visitorId)));

    if (!run) {
        throw new Error('Agent run not found or unauthorized');
    }

    if (run.status !== 'planning' && run.status !== 'approved') {
        throw new Error(`Cannot approve run with status '${run.status}'`);
    }

    const [updated] = await db.update(agentRuns)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(agentRuns.id, runId))
        .returning();

    return updated;
};

export const generatePatchForRun = async (runId: string, visitorId: string) => {
    const [run] = await db.select()
        .from(agentRuns)
        .where(and(eq(agentRuns.id, runId), eq(agentRuns.visitorId, visitorId)));

    if (!run) throw new Error('Agent run not found or unauthorized');
    if (!run.planJson) throw new Error('No change plan found for this run');

    const plan = run.planJson as { affectedFiles: Array<{ path: string; reason: string }> };

    // Read affected file contents for precise patch generation
    const fileContents: string[] = [];
    for (const f of plan.affectedFiles ?? []) {
        try {
            const data = await readFileLines(run.repositoryId, f.path, 1, 150);
            fileContents.push(`--- ${f.path}\n+++ ${f.path}\nContent:\n${data.content}`);
        } catch {
            // ignore missing file errors
        }
    }

    const patchPrompt = `You are CodeAtlas Unified Diff Generator.
Generate a valid Git Unified Diff patch for the following change plan:
Request: "${run.request}"

Affected Files & Context:
${fileContents.join('\n\n')}

Rules:
1. Return ONLY raw valid Git unified diff text (with '--- a/path' and '+++ b/path').
2. Do NOT add markdown code fences or conversational text.
3. Make minimal, precise, syntax-valid edits.`;

    const patchResponse = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: patchPrompt
    });

    const rawPatch = patchResponse.text.replace(/```diff/g, '').replace(/```/g, '').trim();

    // Perform static self-review
    const reviewResult = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: SelfReviewSchema,
        prompt: `Review this generated patch for accuracy and safety:
Patch:
${rawPatch}

Request: "${run.request}"`
    });

    const reviewMd = `### CodeAtlas Self-Review Report
- **Syntax Check Passed**: ${reviewResult.object.isSyntaxValid ? '✅ Yes' : '❌ No'}
- **Confidence Score**: ${reviewResult.object.confidenceScore}%
- **Touches Unrelated Files**: ${reviewResult.object.touchesUnrelatedFiles ? '⚠️ Yes' : '✅ No'}
- **Summary**: ${reviewResult.object.summary}

#### Known Limitations:
${reviewResult.object.knownLimitations.map(l => `- ${l}`).join('\n')}`;

    await db.update(agentRuns).set({
        patchText: rawPatch,
        reviewMd,
        status: 'completed',
        updatedAt: new Date()
    }).where(eq(agentRuns.id, runId));

    return {
        runId,
        patchText: rawPatch,
        reviewMd,
        status: 'completed'
    };
};

export const getPatchForRun = async (runId: string, visitorId: string) => {
    const [run] = await db.select()
        .from(agentRuns)
        .where(and(eq(agentRuns.id, runId), eq(agentRuns.visitorId, visitorId)));

    if (!run) throw new Error('Agent run not found or unauthorized');
    if (!run.patchText) throw new Error('No patch has been generated for this run');

    return {
        runId: run.id,
        patchText: run.patchText,
        reviewMd: run.reviewMd
    };
};
