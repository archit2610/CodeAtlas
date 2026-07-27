import { db } from '../db/index.js';
import { repositoryFiles } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

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

export const inspectRepositoryRoutes = async (
    repositoryId: string
): Promise<RouteInspectionResult> => {
    const files = await db.select()
        .from(repositoryFiles)
        .where(
            and(
                eq(repositoryFiles.repositoryId, repositoryId)
            )
        );

    const routeFiles = files.filter(f => f.classification === 'route' || /(?:router|app)\.(?:get|post|put|delete|patch|use)\(/i.test(f.content));

    const routes: RouteEndpoint[] = [];

    for (const file of routeFiles) {
        const lines = file.content.split('\n');

        lines.forEach((lineText, idx) => {
            const lineNum = idx + 1;
            // Express / Router patterns: router.post('/login', loginController)
            const match = lineText.match(/(?:router|app)\.(get|post|put|delete|patch|use)\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*([A-Za-z0-9_$]+))?/i);
            if (match && match[1] && match[2]) {
                routes.push({
                    method: match[1].toUpperCase() as RouteEndpoint['method'],
                    routePath: match[2],
                    filePath: file.path,
                    line: lineNum,
                    ...(match[3] ? { handlerSymbol: match[3] } : {})
                });
            }
        });
    }

    return {
        totalRoutes: routes.length,
        routeFilesCount: routeFiles.length,
        routes
    };
};
