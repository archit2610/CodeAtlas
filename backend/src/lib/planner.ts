import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { RepositoryIntent } from '../types/repository.js';

export const ChangePlanSchema = z.object({
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

export type RepositoryChangePlan = z.infer<typeof ChangePlanSchema>;

export const classifyIntentDeterministically = (request: string): { intent: RepositoryIntent; keywords: string[] } => {
    const lower = request.toLowerCase();

    const keywords = lower
        .replace(/[^a-z0-9_\-\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['how', 'does', 'why', 'what', 'where', 'this', 'that', 'with', 'from', 'repo', 'repository', 'file', 'code', 'work', 'works', 'user', 'users'].includes(w));

    let intent: RepositoryIntent = 'explain';

    if (/\b(fix|change|add|implement|update|refactor|remove|delete|create|modify|patch)\b/i.test(lower)) {
        intent = 'change_request';
    } else if (/\b(trace|flow|path|sequence|steps|journey)\b/i.test(lower)) {
        intent = 'trace';
    } else if (/\b(why|bug|error|issue|fail|failing|broken|loses|losing|crash)\b/i.test(lower)) {
        intent = 'debug';
    } else if (/\b(impact|affect|breaks|break|blast|radius|consequence)\b/i.test(lower)) {
        intent = 'impact';
    }

    return { intent, keywords: keywords.slice(0, 4) };
};

export const planRepositoryChange = async (
    request: string,
    contextBlock: string
): Promise<RepositoryChangePlan> => {
    const response = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: ChangePlanSchema,
        prompt: `You are CodeAtlas Lead Architect. Create a safe structured change plan for:
Request: "${request}"

Repository Code Context:
${contextBlock || 'No code context provided.'}

List the exact files affected, reasons, risk level, assumptions, and unresolved questions.`,
    });

    return response.object;
};