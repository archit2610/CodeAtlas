import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { db } from '../db/index.js';
import { repositories, repositoryFiles, repositoryEdges } from '../db/schema.js';
import { and, eq, ilike } from 'drizzle-orm';
import { buildSnapshot, scanFile } from './repository-scanner.service.js';
import type { ScannedFile } from '../types/repository.js';

const IGNORED_PATHS = /(^|\/)(\.git|node_modules|dist|build|\.next|out|\.turbo|coverage|\.cache)(\/|$)/i;
const MAX_ARCHIVE_SIZE = 25 * 1024 * 1024; // 25MB

export function parseGithubUrl(githubUrl: string) {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!match) return null;
    const [, owner, repoName] = match;
    const cleanRepo = (repoName || '').replace(/\.git$/, '');
    return { owner, cleanRepo };
}

export async function importPublicRepository(visitorId: string, githubUrl: string) {
    const parsed = parseGithubUrl(githubUrl);
    if (!parsed || !parsed.owner || !parsed.cleanRepo) {
        throw new Error('Invalid GitHub repository URL');
    }

    const { owner, cleanRepo } = parsed;

    const [repo] = await db.insert(repositories).values({
        visitorId,
        sourceType: 'github_public',
        sourceUrl: `https://github.com/${owner}/${cleanRepo}`,
        owner,
        name: cleanRepo,
        status: 'importing',
    }).returning();

    if (!repo) {
        throw new Error('Failed to initialize repository record');
    }

    try {
        const zipUrl = `https://codeload.github.com/${owner}/${cleanRepo}/zip/refs/heads/main`;
        let res = await fetch(zipUrl, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CodeAtlas' }
        });

        if (!res.ok) {
            const masterZipUrl = `https://codeload.github.com/${owner}/${cleanRepo}/zip/refs/heads/master`;
            res = await fetch(masterZipUrl, {
                headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CodeAtlas' }
            });
        }

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

        const scannedFiles: ScannedFile[] = [];

        for (const entry of entries) {
            if (entry.isDirectory) continue;
            const entryPath = entry.entryName.split('/').slice(1).join('/');
            if (!entryPath || IGNORED_PATHS.test(entryPath)) continue;

            const entryData = entry.getData();
            if (entryData.includes(0)) continue; // skip binary
            if (entryData.length > 250 * 1024) continue; // skip files > 250KB

            scannedFiles.push(scanFile(entryPath, entryData.toString('utf8')));
            if (scannedFiles.length >= 1500) break; // limit to 1500 files max
        }

        if (!scannedFiles.length) {
            throw new Error('Repository contains no supported text source files');
        }

        return await saveScannedRepository(repo.id, scannedFiles);
    } catch (err) {
        await db.update(repositories).set({
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Import failed'
        }).where(eq(repositories.id, repo.id));
        throw err;
    }
}

export async function importDemoRepository(visitorId: string) {
    const candidateDirs = [
        path.join(process.cwd(), 'src', 'fixtures', 'demo-repo'),
        path.join(process.cwd(), 'dist', 'fixtures', 'demo-repo'),
        path.join(process.cwd(), 'fixtures', 'demo-repo'),
    ];

    const demoDir = candidateDirs.find(d => fs.existsSync(d));

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
        const scannedFiles: ScannedFile[] = [];

        if (demoDir) {
            const readDirRecursive = (dir: string) => {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    const relPath = path.relative(demoDir, fullPath).replaceAll('\\', '/');

                    if (IGNORED_PATHS.test(relPath)) continue;

                    if (item.isDirectory()) {
                        readDirRecursive(fullPath);
                    } else if (item.isFile()) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        scannedFiles.push(scanFile(relPath, content));
                    }
                }
            };
            readDirRecursive(demoDir);
        }

        // Fallback in-memory demo fixture files if disk directory is omitted in deployment
        if (!scannedFiles.length) {
            const fallbackFiles: Array<{ path: string; content: string }> = [
                {
                    path: 'package.json',
                    content: `{\n  "name": "demo-saas-checkout",\n  "version": "1.0.0",\n  "main": "src/app.ts"\n}`
                },
                {
                    path: 'src/app.ts',
                    content: `import express from 'express';\nimport authRouter from './routes/auth.routes.js';\nimport checkoutRouter from './routes/checkout.routes.js';\n\nconst app = express();\napp.use(express.json());\napp.use('/api/v1/auth', authRouter);\napp.use('/api/v1/checkout', checkoutRouter);\n\nexport default app;`
                },
                {
                    path: 'src/controllers/auth.controller.ts',
                    content: `import { loginUser } from '../services/auth.service.js';\n\nexport const login = async (req: any, res: any) => {\n  const user = await loginUser(req.body);\n  res.json({ success: true, user });\n};`
                },
                {
                    path: 'src/controllers/checkout.controller.ts',
                    content: `import { processPayment } from '../services/payment.service.js';\n\nexport const processCheckout = async (req: any, res: any) => {\n  const result = await processPayment(req.body);\n  res.json({ success: true, result });\n};`
                },
                {
                    path: 'src/routes/auth.routes.ts',
                    content: `import { Router } from 'express';\nimport { login } from '../controllers/auth.controller.js';\n\nconst router = Router();\nrouter.post('/login', login);\n\nexport default router;`
                },
                {
                    path: 'src/routes/checkout.routes.ts',
                    content: `import { Router } from 'express';\nimport { processCheckout } from '../controllers/checkout.controller.js';\n\nconst router = Router();\nrouter.post('/process', processCheckout);\n\nexport default router;`
                },
                {
                    path: 'src/services/auth.service.ts',
                    content: `export const loginUser = async (credentials: any) => {\n  return { id: 'usr_123', email: credentials.email };\n};`
                },
                {
                    path: 'src/services/payment.service.ts',
                    content: `export const processPayment = async (orderData: any) => {\n  return { status: 'paid', transactionId: 'tx_999' };\n};`
                },
                {
                    path: 'src/models/user.model.ts',
                    content: `export interface User {\n  id: string;\n  email: string;\n}`
                },
                {
                    path: 'src/models/order.model.ts',
                    content: `export interface Order {\n  id: string;\n  amount: number;\n}`
                }
            ];

            for (const f of fallbackFiles) {
                scannedFiles.push(scanFile(f.path, f.content));
            }
        }

        return await saveScannedRepository(repo.id, scannedFiles);
    } catch (err) {
        await db.update(repositories).set({
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Demo import failed'
        }).where(eq(repositories.id, repo.id));
        throw err;
    }
}

async function saveScannedRepository(repoId: string, files: ScannedFile[]) {
    const snapshot = buildSnapshot(files);
    const knownPaths = new Set(files.map(f => f.path));

    await db.insert(repositoryFiles).values(
        files.map(f => ({
            repositoryId: repoId,
            path: f.path,
            language: f.language,
            classification: f.classification,
            lineCount: f.lineCount,
            content: f.content,
            contentHash: f.contentHash,
            symbolsJson: f.symbols,
            importsJson: f.imports,
        }))
    );

    const edges = files.flatMap(f =>
        f.imports
            .filter((i: { target: string }) => i.target.startsWith('.'))
            .map((i: { target: string; line: number }) => ({
                repositoryId: repoId,
                fromPath: f.path,
                toPath: resolveImportPath(f.path, i.target, knownPaths),
                edgeType: 'import',
                sourceLine: i.line,
            }))
    );

    if (edges.length) {
        await db.insert(repositoryEdges).values(edges);
    }

    const [updated] = await db.update(repositories).set({
        status: 'ready',
        languages: snapshot.languages,
        frameworks: snapshot.frameworks,
        snapshotJson: snapshot as unknown as Record<string, unknown>,
        updatedAt: new Date(),
    }).where(eq(repositories.id, repoId)).returning();

    return updated;
}

export const getRepository = (id: string, visitorId: string) =>
    db.select().from(repositories).where(and(eq(repositories.id, id), eq(repositories.visitorId, visitorId))).then(r => r[0] ?? null);

export const getTree = (id: string) =>
    db.select({
        path: repositoryFiles.path,
        language: repositoryFiles.language,
        classification: repositoryFiles.classification,
        lineCount: repositoryFiles.lineCount
    }).from(repositoryFiles).where(eq(repositoryFiles.repositoryId, id));

export const getFile = (id: string, pathParam: string) =>
    db.select().from(repositoryFiles).where(and(eq(repositoryFiles.repositoryId, id), eq(repositoryFiles.path, pathParam))).then(r => r[0] ?? null);

export const searchFiles = (id: string, query: string) =>
    db.select({
        path: repositoryFiles.path,
        language: repositoryFiles.language,
        classification: repositoryFiles.classification,
        lineCount: repositoryFiles.lineCount
    }).from(repositoryFiles).where(and(eq(repositories.id, id), ilike(repositoryFiles.content, `%${query.slice(0, 100)}%`))).limit(20);

export const getGraphData = async (id: string) => {
    const nodes = await db.select({
        id: repositoryFiles.path,
        label: repositoryFiles.path,
        classification: repositoryFiles.classification,
        lineCount: repositoryFiles.lineCount,
    }).from(repositoryFiles).where(eq(repositoryFiles.repositoryId, id));

    const dbEdges = await db.select().from(repositoryEdges).where(eq(repositoryEdges.repositoryId, id));

    return {
        nodes,
        edges: dbEdges.map(e => ({
            source: e.fromPath,
            target: e.toPath,
            sourceLine: e.sourceLine,
            edgeType: e.edgeType
        }))
    };
};

function resolveImportPath(fromPath: string, relativeImport: string, knownPaths: Set<string>): string {
    const fromDir = path.dirname(fromPath);
    let resolved = path.normalize(path.join(fromDir, relativeImport)).replaceAll('\\', '/');

    if (knownPaths.has(resolved)) return resolved;

    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
    for (const ext of extensions) {
        if (knownPaths.has(resolved + ext)) return resolved + ext;
    }

    return resolved;
}
