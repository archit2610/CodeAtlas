export type RepositoryIntent = 'explain' | 'trace' | 'debug' | 'impact' | 'change_request';
export interface SourceSymbol {
    name: string;
    kind: string;
    line: number;
}
export interface SourceImport {
    target: string;
    line: number;
    raw: string;
}
export interface ScannedFile {
    path: string;
    language: string;
    classification: string;
    lineCount: number;
    content: string;
    contentHash: string;
    symbols: SourceSymbol[];
    imports: SourceImport[];
}
export interface RepositorySnapshot {
    totalFiles: number;
    textFiles: number;
    languages: Record<string, number>;
    classifications: Record<string, number>;
    frameworks: string[];
    entryPoints: string[];
    routeFiles: string[];
    modelFiles: string[];
    controllerFiles: string[];
    serviceFiles: string[];
    componentFiles: string[];
    symbolCount: number;
    dependencyEdgeCount: number;
}
//# sourceMappingURL=repository.d.ts.map