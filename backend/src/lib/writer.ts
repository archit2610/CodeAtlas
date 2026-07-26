import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import type { RepositoryIntent } from "../types/repository.js";
import { buildAnswerPrompt } from "./prompts.js";

type Emitter = (event: object) => void;

export interface WriterResult {
    reportMd: string;
    tokensUsed: number;
    costUsd: number;
}

export const writeRepositoryAnswer = async (
    request: string,
    contextBlock: string,
    intent: RepositoryIntent = 'explain',
    emit: Emitter
): Promise<WriterResult> => {
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