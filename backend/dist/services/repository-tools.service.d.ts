export interface FileLineSnippet {
    path: string;
    lineRange: string;
    content: string;
}
export declare const searchRepository: (repositoryId: string, query: string) => Promise<{
    path: string;
    language: string;
    classification: string;
    matchingLines: number[];
    snippets: string[];
}[]>;
export declare const readFileLines: (repositoryId: string, filePath: string, startLine?: number, endLine?: number) => Promise<{
    path: string;
    language: string;
    totalLines: number;
    startLine: number;
    endLine: number;
    content: string;
}>;
export declare const getImports: (repositoryId: string, filePath: string) => Promise<{
    id: string;
    repositoryId: string;
    fromPath: string;
    toPath: string;
    edgeType: string;
    sourceLine: number;
    createdAt: Date;
}[]>;
export declare const getDependents: (repositoryId: string, filePath: string) => Promise<{
    id: string;
    repositoryId: string;
    fromPath: string;
    toPath: string;
    edgeType: string;
    sourceLine: number;
    createdAt: Date;
}[]>;
export declare const getRoutes: (repositoryId: string) => Promise<{
    path: string;
    classification: string;
    lineCount: number;
    symbols: {
        name: string;
        kind: string;
        line: number;
    }[];
}[]>;
//# sourceMappingURL=repository-tools.service.d.ts.map