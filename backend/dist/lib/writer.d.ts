import type { RepositoryIntent } from "../types/repository.js";
type Emitter = (event: object) => void;
export interface WriterResult {
    reportMd: string;
    tokensUsed: number;
    costUsd: number;
}
export declare const writeRepositoryAnswer: (request: string, contextBlock: string, intent: RepositoryIntent | undefined, emit: Emitter) => Promise<WriterResult>;
export {};
//# sourceMappingURL=writer.d.ts.map