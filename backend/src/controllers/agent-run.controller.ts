import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { runRepositoryAgent } from '../services/repository-agent.service.js';
import { approveChangePlan, generatePatchForRun, getPatchForRun } from '../services/patch.service.js';

export const createAgentRun = asyncHandler(async (req: Request, res: Response) => {
    const repositoryId = req.params.id as string;
    const visitorId = req.guestTempId!;
    const { request, conversationId } = req.body;

    if (!request || typeof request !== 'string') {
        throw new ApiError(400, 'A valid request text is required');
    }

    const isSse = req.headers.accept === 'text/event-stream';

    if (isSse) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const emit = (event: object) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
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
