import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { and, eq, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import { repositories, repositoryFiles, repositoryEdges } from '../db/schema.js';
import { buildSnapshot, scanFile, resolveImportPath } from './repository-scanner.service.js';
const MAX_ARCHIVE_SIZE = 25 * 1024 * 1024; // 25MB
const IGNORED_PATHS = /(^|\/)(\.git|node_modules|dist|build|coverage|vendor)(\/|$)|(^|\/)\.env/i;
export const parseGithubUrl = (raw) => {
    let urlObj;
    try {
        urlObj = new URL(raw);
    }
    catch {
        throw new Error('Invalid URL format');
    }
    if (urlObj.protocol !== 'https:' || urlObj.hostname !== 'github.com') {
        throw new Error('Only public GitHub URLs are supported');
    }
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const [owner, rawName] = parts;
    if (!owner || !rawName) {
        throw new Error('A GitHub owner and repository name are required');
    }
    const name = rawName.replace(/\.git$/, '');
    return { owner, name, url: `https://github.com/${owner}/${name}` };
};
export async function importPublicRepository(visitorId, sourceUrl) {
    const s = parseGithubUrl(sourceUrl);
    const [repo] = await db.insert(repositories).values({
        visitorId,
        sourceType: 'github_public',
        sourceUrl: s.url,
        owner: s.owner,
        name: s.name,
        status: 'importing',
    }).returning();
    if (!repo) {
        throw new Error('Failed to initialize repository record');
    }
    try {
        const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.name}/zipball`, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CodeAtlas' }
        });
        if (!res.ok) {
            throw new Error(res.status === 404 ? 'Repository was not found or is private' : `GitHub import failed (${res.status})`);
        }
        const contentLength = Number(res.headers.get('content-length') ?? 0);
        if (contentLength > MAX_ARCHIVE_SIZE) {
            throw new Error('Repository archive exceeds 25MB limit');
        }
        const data = Buffer.from(await res.arrayBuffer());
        if (data.length > MAX_ARCHIVE_SIZE) {
            throw new Error('Repository archive exceeds 25MB limit');
        }
        const zip = new AdmZip(data);
        const entries = zip.getEntries();
        const scannedFiles = [];
        for (const entry of entries) {
            if (entry.isDirectory)
                continue;
            const entryPath = entry.entryName.split('/').slice(1).join('/');
            if (!entryPath || IGNORED_PATHS.test(entryPath))
                continue;
            const entryData = entry.getData();
            if (entryData.includes(0))
                continue; // skip binary
            if (entryData.length > 250 * 1024)
                continue; // skip files > 250KB
            scannedFiles.push(scanFile(entryPath, entryData.toString('utf8')));
            if (scannedFiles.length >= 1500)
                break; // limit to 1500 files max
        }
        if (!scannedFiles.length) {
            throw new Error('No supported text files found in repository');
        }
        return await saveScannedRepository(repo.id, scannedFiles);
    }
    catch (err) {
        await db.update(repositories).set({
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Import failed'
        }).where(eq(repositories.id, repo.id));
        throw err;
    }
}
export async function importDemoRepository(visitorId) {
    const demoDir = path.join(process.cwd(), 'src', 'fixtures', 'demo-repo');
    const [repo] = await db.insert(repositories).values({
        visitorId,
        sourceType: 'demo',
        sourceUrl: 'https://github.com/codeatlas/demo-saas-checkout',
        owner: 'codeatlas',
        name: 'demo-saas-checkout',
        status: 'importing',
    }).returning();
    if (!repo) {
        throw new Error('Failed to initialize demo repository record');
    }
    try {
        const scannedFiles = [];
        const readDirRecursive = (dir) => {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                const relPath = path.relative(demoDir, fullPath).replaceAll('\\', '/');
                if (IGNORED_PATHS.test(relPath))
                    continue;
                if (item.isDirectory()) {
                    readDirRecursive(fullPath);
                }
                else if (item.isFile()) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    scannedFiles.push(scanFile(relPath, content));
                }
            }
        };
        readDirRecursive(demoDir);
        if (!scannedFiles.length) {
            throw new Error('Demo repository fixture files not found');
        }
        return await saveScannedRepository(repo.id, scannedFiles);
    }
    catch (err) {
        await db.update(repositories).set({
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Demo import failed'
        }).where(eq(repositories.id, repo.id));
        throw err;
    }
}
async function saveScannedRepository(repoId, files) {
    const snapshot = buildSnapshot(files);
    const knownPaths = new Set(files.map(f => f.path));
    await db.insert(repositoryFiles).values(files.map(f => ({
        repositoryId: repoId,
        path: f.path,
        language: f.language,
        classification: f.classification,
        lineCount: f.lineCount,
        content: f.content,
        contentHash: f.contentHash,
        symbolsJson: f.symbols,
        importsJson: f.imports,
    })));
    const edges = files.flatMap(f => f.imports
        .filter(i => i.target.startsWith('.'))
        .map(i => ({
        repositoryId: repoId,
        fromPath: f.path,
        toPath: resolveImportPath(f.path, i.target, knownPaths),
        edgeType: 'import',
        sourceLine: i.line,
    })));
    if (edges.length) {
        await db.insert(repositoryEdges).values(edges);
    }
    const [updated] = await db.update(repositories).set({
        status: 'ready',
        languages: snapshot.languages,
        frameworks: snapshot.frameworks,
        snapshotJson: snapshot,
        updatedAt: new Date(),
    }).where(eq(repositories.id, repoId)).returning();
    return updated;
}
export const getRepository = (id, visitorId) => db.select().from(repositories).where(and(eq(repositories.id, id), eq(repositories.visitorId, visitorId))).then(r => r[0] ?? null);
export const getTree = (id) => db.select({
    path: repositoryFiles.path,
    language: repositoryFiles.language,
    classification: repositoryFiles.classification,
    lineCount: repositoryFiles.lineCount
}).from(repositoryFiles).where(eq(repositoryFiles.repositoryId, id));
export const getFile = (id, pathParam) => db.select().from(repositoryFiles).where(and(eq(repositoryFiles.repositoryId, id), eq(repositoryFiles.path, pathParam))).then(r => r[0] ?? null);
export const searchFiles = (id, query) => db.select({
    path: repositoryFiles.path,
    language: repositoryFiles.language,
    classification: repositoryFiles.classification,
    lineCount: repositoryFiles.lineCount
}).from(repositoryFiles).where(and(eq(repositoryFiles.repositoryId, id), ilike(repositoryFiles.content, `%${query.slice(0, 100)}%`))).limit(20);
//# sourceMappingURL=repository.service.js.map