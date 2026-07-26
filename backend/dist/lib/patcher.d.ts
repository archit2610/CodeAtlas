import { z } from 'zod';
export declare const SelfReviewSchema: z.ZodObject<{
    isSyntaxValid: z.ZodBoolean;
    touchesUnrelatedFiles: z.ZodBoolean;
    summary: z.ZodString;
    confidenceScore: z.ZodNumber;
    knownLimitations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SelfReviewResult = z.infer<typeof SelfReviewSchema>;
/**
 * Generates a valid Git Unified Diff patch.
 */
export declare const generateDiffPatch: (request: string, fileContexts: string[]) => Promise<string>;
/**
 * Performs static self-review of a generated patch.
 */
export declare const reviewDiffPatch: (request: string, rawPatch: string) => Promise<{
    reviewMd: string;
    reviewData: SelfReviewResult;
}>;
//# sourceMappingURL=patcher.d.ts.map