export declare const approveChangePlan: (runId: string, visitorId: string) => Promise<{
    id: string;
    repositoryId: string;
    visitorId: string;
    conversationId: string | null;
    request: string;
    intent: string;
    status: string;
    evidenceJson: {
        path: string;
        startLine: number;
        endLine: number;
        claim?: string;
        confidence?: string;
    }[];
    planJson: Record<string, unknown> | null;
    riskJson: Record<string, unknown> | null;
    answerMd: string | null;
    patchText: string | null;
    reviewMd: string | null;
    tokensUsed: number | null;
    costUsd: number | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
} | undefined>;
export declare const generatePatchForRun: (runId: string, visitorId: string) => Promise<{
    runId: string;
    patchText: string;
    reviewMd: string;
    status: string;
}>;
export declare const getPatchForRun: (runId: string, visitorId: string) => Promise<{
    runId: string;
    patchText: string;
    reviewMd: string | null;
}>;
//# sourceMappingURL=patch.service.d.ts.map