import { db } from '../db/index.js';
import { repositoryFiles, repositoryEdges } from '../db/schema.js';
import { and, eq, ilike, or } from 'drizzle-orm';

export interface FileLineSnippet {
    path: string;
    lineRange: string;
    content: string;
}

export const searchRepository = async (repositoryId: string, query: string) => {
    const q = query.trim();
    if (!q) return [];

    const matches = await db.select({
        path: repositoryFiles.path,
        language: repositoryFiles.language,
        classification: repositoryFiles.classification,
        symbols: repositoryFiles.symbolsJson,
        content: repositoryFiles.content
    })
        .from(repositoryFiles)
        .where(
            and(
                eq(repositoryFiles.repositoryId, repositoryId),
                or(
                    ilike(repositoryFiles.path, `%${q}%`),
                    ilike(repositoryFiles.content, `%${q}%`)
                )
            )
        )
        .limit(10);

    return matches.map(file => {
        const lines = file.content.split('\n');
        const matchingLineNumbers: number[] = [];

        lines.forEach((lineText, idx) => {
            if (lineText.toLowerCase().includes(q.toLowerCase())) {
                matchingLineNumbers.push(idx + 1);
            }
        });

        const snippetLines = matchingLineNumbers.slice(0, 3).map(lineNum => {
            const start = Math.max(0, lineNum - 2);
            const end = Math.min(lines.length, lineNum + 2);
            const snippet = lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
            return snippet;
        });

        return {
            path: file.path,
            language: file.language,
            classification: file.classification,
            matchingLines: matchingLineNumbers.slice(0, 5),
            snippets: snippetLines
        };
    });
};

export const readFileLines = async (
    repositoryId: string,
    filePath: string,
    startLine: number = 1,
    endLine: number = 100
) => {
    const [file] = await db.select()
        .from(repositoryFiles)
        .where(and(eq(repositoryFiles.repositoryId, repositoryId), eq(repositoryFiles.path, filePath)));

    if (!file) {
        throw new Error(`File not found: ${filePath}`);
    }

    const lines = file.content.split('\n');
    const safeStart = Math.max(1, startLine);
    const safeEnd = Math.min(lines.length, Math.max(safeStart, endLine));

    const slice = lines.slice(safeStart - 1, safeEnd);
    const numbered = slice.map((l, idx) => `${safeStart + idx}: ${l}`).join('\n');

    return {
        path: file.path,
        language: file.language,
        totalLines: file.lineCount,
        startLine: safeStart,
        endLine: safeEnd,
        content: numbered
    };
};

export const getImports = async (repositoryId: string, filePath: string) => {
    return db.select()
        .from(repositoryEdges)
        .where(and(eq(repositoryEdges.repositoryId, repositoryId), eq(repositoryEdges.fromPath, filePath)));
};

export const getDependents = async (repositoryId: string, filePath: string) => {
    return db.select()
        .from(repositoryEdges)
        .where(and(eq(repositoryEdges.repositoryId, repositoryId), eq(repositoryEdges.toPath, filePath)));
};

export const getRoutes = async (repositoryId: string) => {
    return db.select({
        path: repositoryFiles.path,
        classification: repositoryFiles.classification,
        lineCount: repositoryFiles.lineCount,
        symbols: repositoryFiles.symbolsJson
    })
        .from(repositoryFiles)
        .where(and(eq(repositoryFiles.repositoryId, repositoryId), eq(repositoryFiles.classification, 'route')));
};
