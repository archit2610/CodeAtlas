import { db } from '../db/index.js';
import { agentRuns } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { readFileLines } from './repository-tools.service.js';
import { generateDiffPatch, reviewDiffPatch } from '../lib/patcher.js';

export const approveChangePlan = async (runId: string, visitorId: string) => {
    const [run] = await db.select()
        .from(agentRuns)
        .where(eq(agentRuns.id, runId));

    if (!run) {
        throw new Error(`Agent run '${runId}' was not found`);
    }

    if (run.visitorId !== visitorId && process.env.NODE_ENV === 'production') {
        throw new Error('Unauthorized: This agent run belongs to a different visitor session');
    }

    if (run.status !== 'planning' && run.status !== 'approved') {
        throw new Error(`Cannot approve run in '${run.status}' status. Approval is only valid for 'change_request' runs in 'planning' status.`);
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
        .where(eq(agentRuns.id, runId));

    if (!run) throw new Error(`Agent run '${runId}' was not found`);
    if (run.visitorId !== visitorId && process.env.NODE_ENV === 'production') {
        throw new Error('Unauthorized: This agent run belongs to a different visitor session');
    }
    if (!run.planJson) throw new Error('No change plan found for this run. Ensure the request was a change_request.');

    const plan = run.planJson as { affectedFiles: Array<{ path: string; reason: string }> };

    const fileContexts: string[] = [];
    for (const f of plan.affectedFiles ?? []) {
        try {
            const data = await readFileLines(run.repositoryId, f.path, 1, 150);
            fileContexts.push(`--- ${f.path}\n+++ ${f.path}\nContent:\n${data.content}`);
        } catch {
            // ignore missing file errors
        }
    }

    // Reusable Patcher & Reviewer (from lib/patcher.ts)
    const rawPatch = await generateDiffPatch(run.request, fileContexts);
    const { reviewMd } = await reviewDiffPatch(run.request, rawPatch);

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
        .where(eq(agentRuns.id, runId));

    if (!run) throw new Error(`Agent run '${runId}' was not found`);
    if (run.visitorId !== visitorId && process.env.NODE_ENV === 'production') {
        throw new Error('Unauthorized: This agent run belongs to a different visitor session');
    }
    if (!run.patchText) throw new Error('No patch has been generated for this run yet');

    return {
        runId: run.id,
        patchText: run.patchText,
        reviewMd: run.reviewMd
    };
};
