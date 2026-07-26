import { db } from '../db/index.js';
import { agentRuns } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { readFileLines } from './repository-tools.service.js';
import { generateDiffPatch, reviewDiffPatch } from '../lib/patcher.js';
export const approveChangePlan = async (runId, visitorId) => {
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
export const generatePatchForRun = async (runId, visitorId) => {
    const [run] = await db.select()
        .from(agentRuns)
        .where(and(eq(agentRuns.id, runId), eq(agentRuns.visitorId, visitorId)));
    if (!run)
        throw new Error('Agent run not found or unauthorized');
    if (!run.planJson)
        throw new Error('No change plan found for this run');
    const plan = run.planJson;
    const fileContexts = [];
    for (const f of plan.affectedFiles ?? []) {
        try {
            const data = await readFileLines(run.repositoryId, f.path, 1, 150);
            fileContexts.push(`--- ${f.path}\n+++ ${f.path}\nContent:\n${data.content}`);
        }
        catch {
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
export const getPatchForRun = async (runId, visitorId) => {
    const [run] = await db.select()
        .from(agentRuns)
        .where(and(eq(agentRuns.id, runId), eq(agentRuns.visitorId, visitorId)));
    if (!run)
        throw new Error('Agent run not found or unauthorized');
    if (!run.patchText)
        throw new Error('No patch has been generated for this run');
    return {
        runId: run.id,
        patchText: run.patchText,
        reviewMd: run.reviewMd
    };
};
//# sourceMappingURL=patch.service.js.map