export interface RouteEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'USE' | 'ALL';
    routePath: string;
    filePath: string;
    line: number;
    handlerSymbol?: string;
}
export interface RouteInspectionResult {
    totalRoutes: number;
    routeFilesCount: number;
    routes: RouteEndpoint[];
}
export declare const inspectRepositoryRoutes: (repositoryId: string) => Promise<RouteInspectionResult>;
//# sourceMappingURL=route-inspector.service.d.ts.map