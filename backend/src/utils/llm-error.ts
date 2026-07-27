export interface StructuredLlmError {
    statusCode: number;
    errorType: 'RATE_LIMIT_EXCEEDED' | 'QUOTA_EXHAUSTED' | 'INVALID_API_KEY' | 'TIMEOUT' | 'UNKNOWN_LLM_ERROR';
    message: string;
    retryAfterSeconds: number;
    userFriendlyHint: string;
}

export const parseLlmError = (error: unknown): StructuredLlmError => {
    const errString = String(error).toLowerCase();
    const message = error instanceof Error ? error.message : String(error);

    if (errString.includes('429') || errString.includes('resource_exhausted') || errString.includes('rate limit') || errString.includes('too many requests')) {
        return {
            statusCode: 429,
            errorType: 'RATE_LIMIT_EXCEEDED',
            message: 'Gemini API rate limit reached.',
            retryAfterSeconds: 15,
            userFriendlyHint: 'The free-tier Gemini API limit was briefly reached. Please wait 15 seconds before trying your next request.'
        };
    }

    if (errString.includes('quota') || errString.includes('exceeded your current quota')) {
        return {
            statusCode: 429,
            errorType: 'QUOTA_EXHAUSTED',
            message: 'API Quota temporarily exhausted.',
            retryAfterSeconds: 60,
            userFriendlyHint: 'Gemini API daily/minute quota exhausted. The system is waiting for quota reset.'
        };
    }

    if (errString.includes('api_key') || errString.includes('unauthorized') || errString.includes('401') || errString.includes('403')) {
        return {
            statusCode: 401,
            errorType: 'INVALID_API_KEY',
            message: 'Gemini API key authorization failed.',
            retryAfterSeconds: 0,
            userFriendlyHint: 'Please check your GEMINI_API_KEY environment variable configuration on the server.'
        };
    }

    if (errString.includes('timeout') || errString.includes('econnreset') || errString.includes('etimedout')) {
        return {
            statusCode: 504,
            errorType: 'TIMEOUT',
            message: 'LLM provider request timed out.',
            retryAfterSeconds: 5,
            userFriendlyHint: 'The AI request timed out due to network latency. Please retry in a few seconds.'
        };
    }

    return {
        statusCode: 500,
        errorType: 'UNKNOWN_LLM_ERROR',
        message: message || 'An unexpected error occurred during AI processing.',
        retryAfterSeconds: 5,
        userFriendlyHint: 'An unexpected processing error occurred. Try re-running your request.'
    };
};
