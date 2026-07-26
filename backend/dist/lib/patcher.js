import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { SYSTEM_INSTRUCTIONS } from './prompts.js';
export const SelfReviewSchema = z.object({
    isSyntaxValid: z.boolean(),
    touchesUnrelatedFiles: z.boolean(),
    summary: z.string(),
    confidenceScore: z.number().min(0).max(100),
    knownLimitations: z.array(z.string())
});
/**
 * Generates a valid Git Unified Diff patch.
 */
export const generateDiffPatch = async (request, fileContexts) => {
    const patchPrompt = `${SYSTEM_INSTRUCTIONS.DIFF_PATCH}

Request: "${request}"

Affected Files & Context:
${fileContexts.join('\n\n')}`;
    const patchResponse = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: patchPrompt
    });
    return patchResponse.text.replace(/```diff/g, '').replace(/```/g, '').trim();
};
/**
 * Performs static self-review of a generated patch.
 */
export const reviewDiffPatch = async (request, rawPatch) => {
    const reviewResult = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: SelfReviewSchema,
        prompt: `${SYSTEM_INSTRUCTIONS.SELF_REVIEW}

Request: "${request}"

Generated Patch:
${rawPatch}`
    });
    const data = reviewResult.object;
    const reviewMd = `### CodeAtlas Self-Review Report
- **Syntax Check Passed**: ${data.isSyntaxValid ? '✅ Yes' : '❌ No'}
- **Confidence Score**: ${data.confidenceScore}%
- **Touches Unrelated Files**: ${data.touchesUnrelatedFiles ? '⚠️ Yes' : '✅ No'}
- **Summary**: ${data.summary}

#### Known Limitations:
${data.knownLimitations.map(l => `- ${l}`).join('\n')}`;
    return { reviewMd, reviewData: data };
};
//# sourceMappingURL=patcher.js.map