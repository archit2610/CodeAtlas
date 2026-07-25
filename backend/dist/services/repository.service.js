import AdmZip from 'adm-zip';
import { and, eq, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import { repositories, repositoryFiles, repositoryEdges } from '../db/schema.js';
import { buildSnapshot, scanFile } from './repository-scanner.service.js';
const MAX = 25 * 1024 * 1024, ignored = /(^|\/)(\.git|node_modules|dist|build|coverage|vendor)(\/|$)|(^|\/)\.env/i;
export const parseGithubUrl = (raw) => { const u = new URL(raw); if (u.protocol !== 'https:' || u.hostname !== 'github.com')
    throw new Error('Only public GitHub URLs are supported'); const [owner, name] = u.pathname.split('/').filter(Boolean); if (!owner || !name)
    throw new Error('A GitHub owner and repository are required'); return { owner, name: name.replace(/\.git$/, ''), url: `https://github.com/${owner}/${name.replace(/\.git$/, '')}` }; };
export async function importPublicRepository(visitorId, sourceUrl) { const s = parseGithubUrl(sourceUrl); const [repo] = await db.insert(repositories).values({ visitorId, sourceType: 'github_public', sourceUrl: s.url, owner: s.owner, name: s.name, status: 'importing' }).returning(); try {
    const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.name}/zipball`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CodeAtlas' } });
    if (!res.ok)
        throw new Error(res.status === 404 ? 'Repository was not found or is private' : `GitHub import failed (${res.status})`);
    if (Number(res.headers.get('content-length') ?? 0) > MAX)
        throw new Error('Repository archive is too large');
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length > MAX)
        throw new Error('Repository archive is too large');
    const files = new AdmZip(data).getEntries().filter(e => !e.isDirectory).map(e => ({ e, p: e.entryName.split('/').slice(1).join('/') })).filter(x => x.p && !ignored.test(x.p) && !x.e.getData().includes(0) && x.e.getData().length <= 250 * 1024).slice(0, 1500).map(x => scanFile(x.p, x.e.getData().toString('utf8')));
    if (!files.length)
        throw new Error('No supported text files found');
    const snapshot = buildSnapshot(files);
    await db.insert(repositoryFiles).values(files.map(f => ({ repositoryId: repo.id, path: f.path, language: f.language, classification: f.classification, lineCount: f.lineCount, content: f.content, contentHash: f.contentHash, symbolsJson: f.symbols, importsJson: f.imports })));
    const edges = files.flatMap(f => f.imports.filter(i => i.target.startsWith('.')).map(i => ({ repositoryId: repo.id, fromPath: f.path, toPath: i.target, edgeType: 'import', sourceLine: i.line })));
    if (edges.length)
        await db.insert(repositoryEdges).values(edges);
    return (await db.update(repositories).set({ status: 'ready', languages: snapshot.languages, frameworks: snapshot.frameworks, snapshotJson: snapshot, updatedAt: new Date() }).where(eq(repositories.id, repo.id)).returning())[0];
}
catch (err) {
    await db.update(repositories).set({ status: 'error', errorMessage: err instanceof Error ? err.message : 'Import failed' }).where(eq(repositories.id, repo.id));
    throw err;
} }
export const getRepository = (id, v) => db.select().from(repositories).where(and(eq(repositories.id, id), eq(repositories.visitorId, v))).then(r => r[0] ?? null);
export const getTree = (id) => db.select({ path: repositoryFiles.path, language: repositoryFiles.language, classification: repositoryFiles.classification, lineCount: repositoryFiles.lineCount }).from(repositoryFiles).where(eq(repositoryFiles.repositoryId, id));
export const getFile = (id, p) => db.select().from(repositoryFiles).where(and(eq(repositoryFiles.repositoryId, id), eq(repositoryFiles.path, p))).then(r => r[0] ?? null);
export const searchFiles = (id, q) => db.select({ path: repositoryFiles.path, language: repositoryFiles.language, classification: repositoryFiles.classification, lineCount: repositoryFiles.lineCount }).from(repositoryFiles).where(and(eq(repositoryFiles.repositoryId, id), ilike(repositoryFiles.content, `%${q.slice(0, 100)}%`))).limit(20);
//# sourceMappingURL=repository.service.js.map