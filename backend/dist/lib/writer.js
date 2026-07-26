import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { buildAnswerPrompt } from "./prompts.js";
export const writeRepositoryAnswer = async (request, contextBlock, intent = 'explain', emit) => {
    const prompt = buildAnswerPrompt(intent, request, contextBlock);
    const result = await streamText({
        model: google('gemini-2.5-flash'),
        prompt
    });
    let fullText = '';
    for await (const chunk of result.textStream) {
        fullText += chunk;
        emit({ type: 'token', data: chunk });
    }
    const usage = await result.usage;
    const cost = (usage?.inputTokens ?? 0) * 0.000003 + (usage?.outputTokens ?? 0) * 0.000015;
    return {
        reportMd: fullText,
        tokensUsed: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
        costUsd: cost,
    };
};
//# sourceMappingURL=writer.js.map