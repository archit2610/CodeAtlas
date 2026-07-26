import type { RepositoryIntent } from '../types/repository.js';
export declare const SYSTEM_INSTRUCTIONS: {
    EXPLAIN: string;
    TRACE: string;
    DEBUG: string;
    IMPACT: string;
    CHANGE_PLAN: string;
    DIFF_PATCH: string;
    SELF_REVIEW: string;
};
export declare const buildAnswerPrompt: (intent: RepositoryIntent, request: string, contextBlock: string) => string;
//# sourceMappingURL=prompts.d.ts.map