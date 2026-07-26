import { z } from 'zod';
import type { RepositoryIntent } from '../types/repository.js';
export declare const ChangePlanSchema: z.ZodObject<{
    summary: z.ZodString;
    riskLevel: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    affectedFiles: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        reason: z.ZodString;
        action: z.ZodEnum<{
            delete: "delete";
            modify: "modify";
            add: "add";
        }>;
    }, z.core.$strip>>;
    assumptions: z.ZodArray<z.ZodString>;
    unresolvedQuestions: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type RepositoryChangePlan = z.infer<typeof ChangePlanSchema>;
export declare const classifyIntentDeterministically: (request: string) => {
    intent: RepositoryIntent;
    keywords: string[];
};
export declare const planRepositoryChange: (request: string, contextBlock: string) => Promise<RepositoryChangePlan>;
//# sourceMappingURL=planner.d.ts.map