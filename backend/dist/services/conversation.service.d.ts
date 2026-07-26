export declare const GUEST_COOKIE_NAME = "codeatlas_visitor_id";
export declare const createConversation: (guestTempId: string, firstQuestion: string) => Promise<{
    id: string;
    anonymousVisitorId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
} | undefined>;
export declare const getConversationsByGuest: (guestTempId: string) => Promise<{
    id: string;
    anonymousVisitorId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare const getConversationById: (id: string, guestTempId: string) => Promise<{
    id: string;
    anonymousVisitorId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const getConversationAgentRuns: (conversationId: string) => Promise<{
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
}[]>;
export declare const deleteConversation: (conversationId: string, guestTempId: string) => Promise<{
    id: string;
    anonymousVisitorId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
} | null | undefined>;
//# sourceMappingURL=conversation.service.d.ts.map