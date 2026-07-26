import { db } from '../db/index.js';
import { agentRuns, repositories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { searchRepository, readFileLines, getDependents } from './repository-tools.service.js';
import { classifyIntentDeterministically, planRepositoryChange } from '../lib/planner.js';
import { writeRepositoryAnswer } from '../lib/writer.js';
export const runRepositoryAgent = async ({ repositoryId, visitorId, conversationId, request, emit }) => {
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, repositoryId));
    if (!repo)
        throw new Error('Repository not found');
    emit({ type: 'stage', label: 'Analyzing request...' });
    // 0-LLM-Call Deterministic Classification (from lib/planner.ts)
    const { intent, keywords } = classifyIntentDeterministically(request);
    emit({ type: 'intent', intent, keywords });
    // 0-LLM-Call Deterministic Bounded Repository Retrieval
    emit({ type: 'stage', label: 'Retrieving relevant repository code...' });
    const searchQueries = keywords.length > 0 ? keywords : [request.slice(0, 30)];
    const searchResults = await Promise.all(searchQueries.slice(0, 3).map(kw => searchRepository(repositoryId, kw)));
    const flatResults = searchResults.flat().slice(0, 5);
    const retrievedFilesContent = [];
    const evidenceList = [];
    for (const match of flatResults) {
        try {
            const fileData = await readFileLines(repositoryId, match.path, 1, 80);
            retrievedFilesContent.push(`### File: ${fileData.path}\n\`\`\`${fileData.language}\n${fileData.content}\n\`\`\``);
            const dependents = await getDependents(repositoryId, match.path);
            const depPaths = dependents.map(d => d.fromPath).join(', ');
            evidenceList.push({
                path: fileData.path,
                startLine: 1,
                endLine: Math.min(30, fileData.totalLines),
                claim: dependents.length ? `Imported by: ${depPaths}` : `Matched search query`,
                confidence: 'graph-confirmed'
            });
        }
        catch {
            // ignore missing files gracefully
        }
    }
    const contextBlock = retrievedFilesContent.join('\n\n');
    const [agentRun] = await db.insert(agentRuns).values({
        repositoryId,
        visitorId,
        conversationId: conversationId ?? null,
        request,
        intent,
        status: intent === 'change_request' ? 'planning' : 'running',
        evidenceJson: evidenceList,
    }).returning();
    if (!agentRun)
        throw new Error('Failed to create agent run record');
    // Change Request -> Structured Planner (from lib/planner.ts)
    if (intent === 'change_request') {
        emit({ type: 'stage', label: 'Generating approval-gated change plan...' });
        const planJson = await planRepositoryChange(request, contextBlock);
        await db.update(agentRuns).set({
            planJson: planJson,
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
    // Question -> Streaming Writer (from lib/writer.ts with intent prompt)
    emit({ type: 'stage', label: 'Synthesizing evidence-backed answer...' });
    const writerResult = await writeRepositoryAnswer(request, contextBlock, intent, emit);
    await db.update(agentRuns).set({
        answerMd: writerResult.reportMd,
        tokensUsed: writerResult.tokensUsed,
        costUsd: writerResult.costUsd,
        status: 'completed'
    }).where(eq(agentRuns.id, agentRun.id));
    emit({ type: 'answer', answerMd: writerResult.reportMd, evidence: evidenceList, runId: agentRun.id });
    return {
        runId: agentRun.id,
        intent,
        answerMd: writerResult.reportMd,
        evidence: evidenceList,
        status: 'completed'
    };
};
//# sourceMappingURL=repository-agent.service.js.map