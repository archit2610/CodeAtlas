type Emitter = (event: object) => void;
interface AgentRunOptions {
    repositoryId: string;
    visitorId: string;
    conversationId?: string;
    request: string;
    emit: Emitter;
}
export declare const runRepositoryAgent: ({ repositoryId, visitorId, conversationId, request, emit }: AgentRunOptions) => Promise<{
    runId: string;
    conversationId: string | undefined;
    intent: "change_request";
    plan: {
        summary: string;
        riskLevel: "low" | "medium" | "high";
        affectedFiles: {
            path: string;
            reason: string;
            action: "delete" | "modify" | "add";
        }[];
        assumptions: string[];
        unresolvedQuestions: string[];
    };
    evidence: {
        path: string;
        startLine: number;
        endLine: number;
        claim: string;
        confidence: string;
    }[];
    status: string;
    answerMd?: never;
} | {
    runId: string;
    conversationId: string | undefined;
    intent: "explain" | "trace" | "debug" | "impact";
    answerMd: string;
    evidence: {
        path: string;
        startLine: number;
        endLine: number;
        claim: string;
        confidence: string;
    }[];
    status: string;
    plan?: never;
}>;
export {};
//# sourceMappingURL=repository-agent.service.d.ts.map