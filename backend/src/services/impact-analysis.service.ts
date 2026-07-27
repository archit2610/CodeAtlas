import { db } from '../db/index.js';
import { repositoryFiles, repositoryEdges } from '../db/schema.js';
import { and, eq, inArray } from 'drizzle-orm';

export interface BlastRadiusResult {
    filePath: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number; // 0 to 100
    directDependents: Array<{ fromPath: string; sourceLine: number; edgeType: string }>;
    transitiveDependents: string[];
    affectedRoutes: string[];
    summary: string;
}

export const calculateBlastRadius = async (
    repositoryId: string,
    filePath: string
): Promise<BlastRadiusResult> => {
    // 1. Verify target file
    const [targetFile] = await db.select()
        .from(repositoryFiles)
        .where(and(eq(repositoryFiles.repositoryId, repositoryId), eq(repositoryFiles.path, filePath)));

    if (!targetFile) {
        throw new Error(`File not found in repository: ${filePath}`);
    }

    // 2. Direct Dependents (files that import filePath directly)
    const directEdges = await db.select({
        fromPath: repositoryEdges.fromPath,
        sourceLine: repositoryEdges.sourceLine,
        edgeType: repositoryEdges.edgeType
    })
        .from(repositoryEdges)
        .where(and(eq(repositoryEdges.repositoryId, repositoryId), eq(repositoryEdges.toPath, filePath)));

    const directPaths = Array.from(new Set(directEdges.map(d => d.fromPath)));

    // 3. Transitive Dependents (2nd-level files importing direct paths)
    let transitivePaths: string[] = [];
    if (directPaths.length > 0) {
        const secondaryEdges = await db.select({ fromPath: repositoryEdges.fromPath })
            .from(repositoryEdges)
            .where(
                and(
                    eq(repositoryEdges.repositoryId, repositoryId),
                    inArray(repositoryEdges.toPath, directPaths)
                )
            );
        transitivePaths = Array.from(new Set(secondaryEdges.map(e => e.fromPath).filter(p => p !== filePath && !directPaths.includes(p))));
    }

    // 4. Affected Routes
    const allImpactedPaths = [...directPaths, ...transitivePaths];
    let affectedRoutes: string[] = [];

    if (allImpactedPaths.length > 0) {
        const routeFiles = await db.select({ path: repositoryFiles.path })
            .from(repositoryFiles)
            .where(
                and(
                    eq(repositoryFiles.repositoryId, repositoryId),
                    eq(repositoryFiles.classification, 'route'),
                    inArray(repositoryFiles.path, allImpactedPaths)
                )
            );
        affectedRoutes = routeFiles.map(r => r.path);
    }

    // If target file itself is a route
    if (targetFile.classification === 'route' && !affectedRoutes.includes(targetFile.path)) {
        affectedRoutes.push(targetFile.path);
    }

    // 5. Calculate Risk Score & Level
    const totalImpactedCount = directPaths.length + transitivePaths.length;
    const isCoreFile = /auth|session|database|db|config|middleware/i.test(filePath);

    let riskScore = totalImpactedCount * 15 + affectedRoutes.length * 20 + (isCoreFile ? 25 : 0);
    riskScore = Math.min(100, Math.max(10, riskScore));

    const riskLevel: 'low' | 'medium' | 'high' = riskScore > 65 ? 'high' : riskScore > 35 ? 'medium' : 'low';

    const summary = totalImpactedCount === 0
        ? `Changing '${filePath}' has LOW blast radius (${directPaths.length} direct dependents). Safe to edit.`
        : `Changing '${filePath}' impacts ${directPaths.length} direct file(s), ${transitivePaths.length} downstream file(s), and ${affectedRoutes.length} API route handler(s). Risk Level: ${riskLevel.toUpperCase()} (${riskScore}/100).`;

    return {
        filePath,
        riskLevel,
        riskScore,
        directDependents: directEdges,
        transitiveDependents: transitivePaths,
        affectedRoutes,
        summary
    };
};
