export interface StructuredLlmError {
    statusCode: number;
    errorType: 'RATE_LIMIT_EXCEEDED' | 'QUOTA_EXHAUSTED' | 'INVALID_API_KEY' | 'TIMEOUT' | 'UNKNOWN_LLM_ERROR';
    message: string;
    retryAfterSeconds: number;
    userFriendlyHint: string;
}
export declare const parseLlmError: (error: unknown) => StructuredLlmError;
//# sourceMappingURL=llm-error.d.ts.map