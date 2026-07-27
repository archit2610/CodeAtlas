import { db } from '../db/index.js';
import { agentRuns, repositories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { searchRepository, readFileLines, getDependents } from './repository-tools.service.js';
import { classifyIntentDeterministically, planRepositoryChange } from '../lib/planner.js';
import { writeRepositoryAnswer } from '../lib/writer.js';
import { createConversation } from './conversation.service.js';
export const runRepositoryAgent = async ({ repositoryId, visitorId, conversationId, request, emit }) => {
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, repositoryId));
    if (!repo)
        throw new Error('Repository not found');
    // Auto-create or resolve persistent conversation thread
    let activeConvoId = conversationId;
    if (!activeConvoId) {
        const convo = await createConversation(visitorId, request);
        if (convo) {
            activeConvoId = convo.id;
        }
    }
    // Stage 1: Intent Analysis
    emit({ type: 'stage', label: 'Classifying request intent...' });
    const { intent, keywords } = classifyIntentDeterministically(request);
    emit({ type: 'intent', intent, keywords });
    // Stage 2: Code Retrieval & Dependency Tracing
    const searchQueries = keywords.length > 0 ? keywords : [request.slice(0, 30)];
    emit({ type: 'stage', label: `Searching repository for: "${searchQueries.join(', ')}"...` });
    const searchResults = await Promise.all(searchQueries.slice(0, 3).map(kw => searchRepository(repositoryId, kw)));
    const flatResults = searchResults.flat().slice(0, 5);
    const retrievedFilesContent = [];
    const evidenceList = [];
    for (const match of flatResults) {
        try {
            emit({ type: 'stage', label: `Reading code lines & tracing dependencies for ${match.path}...` });
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
        conversationId: activeConvoId ?? null,
        request,
        intent,
        status: intent === 'change_request' ? 'planning' : 'running',
        evidenceJson: evidenceList,
    }).returning();
    if (!agentRun)
        throw new Error('Failed to create agent run record');
    // Stage 3A: Change Request -> Structured Plan
    if (intent === 'change_request') {
        emit({ type: 'stage', label: 'Generating approval-gated change plan...' });
        const planJson = await planRepositoryChange(request, contextBlock);
        await db.update(agentRuns).set({
            planJson: planJson,
            status: 'planning'
        }).where(eq(agentRuns.id, agentRun.id));
        emit({ type: 'plan', plan: planJson, runId: agentRun.id, conversationId: activeConvoId });
        emit({ type: 'stage', label: 'Awaiting plan approval before generating patch.' });
        return {
            runId: agentRun.id,
            conversationId: activeConvoId,
            intent,
            plan: planJson,
            evidence: evidenceList,
            status: 'planning'
        };
    }
    // Stage 3B: Question -> Real-Time Streaming Writer
    emit({ type: 'stage', label: 'Synthesizing evidence-backed answer...' });
    const writerResult = await writeRepositoryAnswer(request, contextBlock, intent, emit);
    await db.update(agentRuns).set({
        answerMd: writerResult.reportMd,
        tokensUsed: writerResult.tokensUsed,
        costUsd: writerResult.costUsd,
        status: 'completed'
    }).where(eq(agentRuns.id, agentRun.id));
    emit({ type: 'answer', answerMd: writerResult.reportMd, evidence: evidenceList, runId: agentRun.id, conversationId: activeConvoId });
    return {
        runId: agentRun.id,
        conversationId: activeConvoId,
        intent,
        answerMd: writerResult.reportMd,
        evidence: evidenceList,
        status: 'completed'
    };
};
//# sourceMappingURL=repository-agent.service.js.map