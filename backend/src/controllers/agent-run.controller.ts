import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { runRepositoryAgent } from '../services/repository-agent.service.js';
import { approveChangePlan, generatePatchForRun, getPatchForRun } from '../services/patch.service.js';
import { db } from '../db/index.js';
import { agentRuns } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const createAgentRun = asyncHandler(async (req: Request, res: Response) => {
    const repositoryId = (req.params.id || req.body?.repositoryId) as string;
    const visitorId = req.guestTempId!;
    const { request, conversationId } = req.body;

    if (!repositoryId) {
        throw new ApiError(400, 'A valid repositoryId parameter or body property is required');
    }

    if (!request || typeof request !== 'string') {
        throw new ApiError(400, 'A valid request text is required');
    }

    // Default to SSE streaming unless explicitly disabled with ?stream=false
    const wantsJsonOnly = req.query.stream === 'false';

    if (!wantsJsonOnly) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const emit = (event: object) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            if (typeof (res as any).flush === 'function') {
                (res as any).flush();
            }
        };

        try {
            const result = await runRepositoryAgent({
                repositoryId,
                visitorId,
                conversationId,
                request,
                emit
            });
            emit({ type: 'complete', result });
            res.end();
        } catch (error) {
            emit({ type: 'error', message: error instanceof Error ? error.message : 'Agent run failed' });
            res.end();
        }
        return;
    }

    const result = await runRepositoryAgent({
        repositoryId,
        visitorId,
        conversationId,
        request,
        emit: () => { }
    });

    res.status(201).json(new ApiResponse(201, result, 'Agent run initiated'));
});

export const getAgentRunEvents = asyncHandler(async (req: Request, res: Response) => {
    const runId = req.params.id as string;
    const visitorId = req.guestTempId!;

    const [run] = await db.select()
        .from(agentRuns)
        .where(and(eq(agentRuns.id, runId), eq(agentRuns.visitorId, visitorId)));

    if (!run) throw new ApiError(404, 'Agent run not found');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const emit = (event: object) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (typeof (res as any).flush === 'function') {
            (res as any).flush();
        }
    };

    if (run.status === 'completed') {
        emit({ type: 'intent', intent: run.intent });
        emit({ type: 'stage', label: 'Run completed' });
        emit({ type: 'answer', answerMd: run.answerMd, evidence: run.evidenceJson, runId: run.id });
        if (run.patchText) emit({ type: 'patch', patchText: run.patchText, reviewMd: run.reviewMd });
        emit({ type: 'complete', result: run });
        res.end();
        return;
    }

    if (run.status === 'planning') {
        emit({ type: 'intent', intent: run.intent });
        emit({ type: 'stage', label: 'Plan generated, awaiting approval' });
        emit({ type: 'plan', plan: run.planJson, runId: run.id });
        res.end();
        return;
    }

    try {
        const result = await runRepositoryAgent({
            repositoryId: run.repositoryId,
            visitorId: run.visitorId,
            ...(run.conversationId ? { conversationId: run.conversationId } : {}),
            request: run.request,
            emit
        });
        emit({ type: 'complete', result });
        res.end();
    } catch (error) {
        emit({ type: 'error', message: error instanceof Error ? error.message : 'Agent run failed' });
        res.end();
    }
});

export const approveRun = asyncHandler(async (req: Request, res: Response) => {
    const runId = req.params.id as string;
    const visitorId = req.guestTempId!;

    await approveChangePlan(runId, visitorId);
    const patchResult = await generatePatchForRun(runId, visitorId);

    res.json(new ApiResponse(200, patchResult, 'Plan approved and patch generated'));
});

export const getPatch = asyncHandler(async (req: Request, res: Response) => {
    const runId = req.params.id as string;
    const visitorId = req.guestTempId!;

    const patchData = await getPatchForRun(runId, visitorId);

    if (req.query.download === 'true') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="codeatlas-change-${runId.slice(0, 8)}.patch"`);
        res.send(patchData.patchText);
        return;
    }

    res.json(new ApiResponse(200, patchData, 'Patch retrieved'));
});
