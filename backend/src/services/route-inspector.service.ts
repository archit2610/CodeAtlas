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

export interface RouteTraceStep {
    stepIndex: number;
    layer: 'route' | 'controller' | 'service' | 'model';
    title: string;
    filePath: string;
    line: number;
    symbolName?: string | undefined;
    codeSnippet: string;
}

export interface RouteTraceResult {
    method: string;
    routePath: string;
    steps: RouteTraceStep[];
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

    const routes: RouteEndpoint[] = [];
    const filesWithRoutes = new Set<string>();

    // Step 1: Detect prefix mappings in app.ts or entry points (e.g. app.use('/api/v1/auth', authRouter))
    const prefixMap = new Map<string, string>(); // e.g. "auth" -> "/api/v1/auth"
    const entryFile = files.find(f => f.path.includes('app.ts') || f.path.includes('index.ts') || f.path.includes('server.ts'));
    if (entryFile) {
        const useRegex = /(?:app|r|router)\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_$]+)\s*\)/gi;
        let m: RegExpExecArray | null;
        while ((m = useRegex.exec(entryFile.content)) !== null) {
            const prefix = m[1];
            const routerVar = m[2];
            if (prefix && routerVar && prefix !== '/') {
                prefixMap.set(routerVar.toLowerCase().replace('router', '').replace('routes', ''), prefix.replace(/\/$/, ''));
            }
        }
    }

    // Step 2: Scan all actual route files (excluding app.ts mount lines)
    const routeFiles = files.filter(f =>
        (/\/(routes|routers|controllers)\//i.test(f.path) || /\.routes?\./i.test(f.path) || /\.routers?\./i.test(f.path)) &&
        !/\.(md|json|txt|css|html|svg)$/i.test(f.path)
    );

    const filesToScan = routeFiles.length > 0 ? routeFiles : files.filter(f => !/\.(md|json|txt|css|html|svg)$/i.test(f.path));

    for (const file of filesToScan) {
        const fileNameLower = file.path.split('/').pop()?.toLowerCase() || '';

        let pathPrefix = '';
        for (const [key, prefix] of prefixMap.entries()) {
            if (fileNameLower.includes(key)) {
                pathPrefix = prefix;
                break;
            }
        }

        const lines = file.content.split('\n');

        lines.forEach((lineText, idx) => {
            const lineNum = idx + 1;

            // Matches router.get('/path', ...), router.post('/path', ...), app.get('/path', ...)
            const routeRegex = /(?:router|app|r)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]([\s\S]*?)\)/gi;
            let match: RegExpExecArray | null;

            while ((match = routeRegex.exec(lineText)) !== null) {
                const methodStr = match[1];
                let rawPath = match[2];
                if (!methodStr || !rawPath) continue;

                const method = methodStr.toUpperCase() as RouteEndpoint['method'];
                const restArgs = match[3] ?? '';

                // Combine mount prefix with route path if applicable
                if (pathPrefix && !rawPath.startsWith(pathPrefix)) {
                    rawPath = pathPrefix + (rawPath.startsWith('/') ? rawPath : '/' + rawPath);
                }

                // Extract all word tokens in the remaining arguments
                const tokens = restArgs.match(/\b[A-Za-z_$][\w$]*\b/g) || [];
                // Filter out non-handler keywords
                const handlers = tokens.filter(t => !['async', 'req', 'res', 'next', 'function', 'return', 'express', 'Router', 'guestSessionMiddleware'].includes(t));
                const handlerSymbol = handlers.length > 0 ? handlers[handlers.length - 1] : undefined;

                routes.push({
                    method,
                    routePath: rawPath,
                    filePath: file.path,
                    line: lineNum,
                    ...(handlerSymbol ? { handlerSymbol } : {})
                });

                filesWithRoutes.add(file.path);
            }
        });
    }

    // Fallback if no specific endpoints matched (e.g. basic app.ts)
    if (routes.length === 0 && entryFile) {
        routes.push({
            method: 'GET',
            routePath: '/',
            filePath: entryFile.path,
            line: 1,
            handlerSymbol: 'getRoot'
        });
        filesWithRoutes.add(entryFile.path);
    }

    return {
        totalRoutes: routes.length,
        routeFilesCount: filesWithRoutes.size,
        routes
    };
};

export const traceRouteFlow = async (
    repositoryId: string,
    routePathTarget: string
): Promise<RouteTraceResult> => {
    const inspection = await inspectRepositoryRoutes(repositoryId);
    const targetRoute = inspection.routes.find(r => r.routePath === routePathTarget) || inspection.routes[0];

    const rawFiles = await db.select().from(repositoryFiles).where(eq(repositoryFiles.repositoryId, repositoryId));
    // Filter strictly to code files (exclude markdown, json, config)
    const codeFiles = rawFiles.filter(f => !/\.(md|json|txt|css|html|svg|config\.ts|config\.js)$/i.test(f.path));

    const steps: RouteTraceStep[] = [];

    if (!targetRoute) {
        return { method: 'GET', routePath: routePathTarget, steps: [] };
    }

    // Step 1: HTTP Route Entry Point
    const routeFile = codeFiles.find(f => f.path === targetRoute.filePath) || rawFiles.find(f => f.path === targetRoute.filePath);
    const routeLines = routeFile?.content.split('\n') || [];
    const routeSnippet = routeLines[targetRoute.line - 1]?.trim() || `router.${targetRoute.method.toLowerCase()}('${targetRoute.routePath}')`;

    steps.push({
        stepIndex: 1,
        layer: 'route',
        title: `HTTP Entry Point: ${targetRoute.method} ${targetRoute.routePath}`,
        filePath: targetRoute.filePath,
        line: targetRoute.line,
        symbolName: targetRoute.handlerSymbol ?? undefined,
        codeSnippet: routeSnippet
    });

    // Step 2: Controller Layer (Search exclusively in controller code files)
    let handler = targetRoute.handlerSymbol;

    // Find controller files
    const controllerFiles = codeFiles.filter(f => f.classification === 'controller' || f.path.includes('/controllers/') || f.path.includes('.controller.'));

    let controllerFile: typeof codeFiles[0] | undefined;
    if (handler) {
        controllerFile = controllerFiles.find(f => new RegExp(`\\b${handler}\\b`).test(f.content));
    }

    if (!controllerFile && controllerFiles.length > 0) {
        // Match controller based on route path keywords (e.g. "auth" -> auth.controllers.ts)
        const pathKeyword = targetRoute.routePath.split('/').filter(Boolean).pop() || '';
        controllerFile = controllerFiles.find(f => f.path.toLowerCase().includes(pathKeyword.toLowerCase())) || controllerFiles[0];
        if (controllerFile && !handler) {
            const funcMatch = controllerFile.content.match(/(?:export\s+const|export\s+async\s+function|export\s+function)\s+([A-Za-z0-9_$]+)/);
            handler = funcMatch?.[1] || 'controllerHandler';
        }
    }

    const cFile = controllerFile || (controllerFiles.length > 0 ? controllerFiles[0] : codeFiles[0]);
    if (cFile) {
        const cLines = cFile.content.split('\n');
        const cLineIdx = handler ? cLines.findIndex(l => new RegExp(`\\b${handler}\\b`).test(l)) : 0;
        const cLineNum = cLineIdx >= 0 ? cLineIdx + 1 : 1;
        const cSnippet = cLines[cLineNum - 1]?.trim() || `export const ${handler || 'handleRequest'} = async (req, res) => ...`;

        steps.push({
            stepIndex: 2,
            layer: 'controller',
            title: `Controller Handler: ${handler || 'handleRequest'}()`,
            filePath: cFile.path,
            line: cLineNum,
            symbolName: handler || 'handleRequest',
            codeSnippet: cSnippet
        });
    }

    // Step 3: Service Layer (Search for business logic function called inside the controller)
    const serviceFiles = codeFiles.filter(f => f.classification === 'service' || f.path.includes('/services/') || f.path.includes('.service.'));
    let matchedServiceFile: typeof codeFiles[0] | undefined;

    if (cFile) {
        matchedServiceFile = serviceFiles.find(sf =>
            cFile.content.split('\n').some(l => l.includes(sf.path.split('/').pop()?.replace(/\.(ts|js)$/, '') || ''))
        );

        if (!matchedServiceFile && serviceFiles.length > 0) {
            for (const sf of serviceFiles) {
                const sfFuncMatches = sf.content.matchAll(/(?:export\s+const|export\s+async\s+function|export\s+function)\s+([A-Za-z0-9_$]+)/g);
                for (const sfm of sfFuncMatches) {
                    const funcName = sfm[1];
                    if (funcName && new RegExp(`\\b${funcName}\\b`).test(cFile.content)) {
                        matchedServiceFile = sf;
                        break;
                    }
                }
                if (matchedServiceFile) break;
            }
        }
    }

    const sFile = matchedServiceFile || (serviceFiles.length > 0 ? serviceFiles[0] : codeFiles[0]);
    if (sFile) {
        const sLines = sFile.content.split('\n');
        const sFuncMatch = sFile.content.match(/(?:export\s+const|export\s+async\s+function|export\s+function)\s+([A-Za-z0-9_$]+)/);
        const sSymbol = sFuncMatch?.[1] || 'serviceLogic';
        const sLineIdx = sLines.findIndex(l => l.includes(sSymbol));
        const sLineNum = sLineIdx >= 0 ? sLineIdx + 1 : 1;

        steps.push({
            stepIndex: 3,
            layer: 'service',
            title: `Service Business Logic: ${sSymbol}()`,
            filePath: sFile.path,
            line: sLineNum,
            symbolName: sSymbol,
            codeSnippet: sLines[sLineNum - 1]?.trim() || `export const ${sSymbol} = async () => ...`
        });
    }

    // Step 4: Database Model / Schema Layer (Find table definitions in database schema files)
    const modelFiles = codeFiles.filter(f => f.classification === 'model' || f.path.includes('/db/') || f.path.includes('schema') || f.path.includes('model'));
    const modelFile = modelFiles.find(f => f.content.includes('pgTable')) || (modelFiles.length > 0 ? modelFiles[0] : codeFiles[0]);

    if (modelFile) {
        const mLines = modelFile.content.split('\n');
        const tableLineIdx = mLines.findIndex(l => l.includes('pgTable'));
        const mLineNum = tableLineIdx >= 0 ? tableLineIdx + 1 : 1;

        const mTableMatch = modelFile.content.match(/pgTable\s*\(\s*['"]([^'"]+)['"]/);
        const mTableName = mTableMatch?.[1] || 'database_table';

        steps.push({
            stepIndex: 4,
            layer: 'model',
            title: `Database Model: ${mTableName} table`,
            filePath: modelFile.path,
            line: mLineNum,
            symbolName: mTableName,
            codeSnippet: mLines[mLineNum - 1]?.trim() || `export const ${mTableName} = pgTable('${mTableName}', ...)`
        });
    }

    return {
        method: targetRoute.method,
        routePath: targetRoute.routePath,
        steps
    };
};
