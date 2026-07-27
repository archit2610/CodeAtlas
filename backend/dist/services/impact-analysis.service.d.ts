export interface BlastRadiusResult {
    filePath: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    directDependents: Array<{
        fromPath: string;
        sourceLine: number;
        edgeType: string;
    }>;
    transitiveDependents: string[];
    affectedRoutes: string[];
    summary: string;
}
export declare const calculateBlastRadius: (repositoryId: string, filePath: string) => Promise<BlastRadiusResult>;
//# sourceMappingURL=impact-analysis.service.d.ts.map