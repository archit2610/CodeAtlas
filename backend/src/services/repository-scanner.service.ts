import crypto from 'crypto';
import path from 'path';
import type { RepositorySnapshot, ScannedFile, SourceImport, SourceSymbol } from '../types/repository.js';

const EXTENSIONS: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TSX',
    '.js': 'JavaScript',
    '.jsx': 'JSX',
    '.py': 'Python',
    '.cpp': 'C++',
    '.cc': 'C++',
    '.c': 'C',
    '.h': 'C/C++ Header',
    '.hpp': 'C++ Header',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cs': 'C#',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sql': 'SQL',
    '.json': 'JSON',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.md': 'Markdown'
};

export const detectLanguage = (p: string) => EXTENSIONS[path.extname(p).toLowerCase()] ?? 'Text';

const lineOf = (t: string, i: number) => t.slice(0, i).split('\n').length;

export const resolveImportPath = (fromPath: string, target: string, knownPaths: Set<string>): string => {
    if (!target.startsWith('.')) return target;
    const dir = path.dirname(fromPath);
    const resolvedRaw = path.normalize(path.join(dir, target)).replaceAll('\\', '/');

    const candidates = [
        resolvedRaw,
        `${resolvedRaw}.ts`,
        `${resolvedRaw}.tsx`,
        `${resolvedRaw}.js`,
        `${resolvedRaw}.jsx`,
        `${resolvedRaw}/index.ts`,
        `${resolvedRaw}/index.js`,
    ];
    for (const c of candidates) {
        if (knownPaths.has(c)) return c;
    }
    return resolvedRaw;
};

export const scanFile = (filePath: string, content: string): ScannedFile => {
    const normalizedPath = filePath.replaceAll('\\', '/');
    const language = detectLanguage(normalizedPath);
    const symbols: SourceSymbol[] = [];
    const imports: SourceImport[] = [];

    const addSymbol = (r: RegExp, kind: string) => {
        for (const m of content.matchAll(r)) {
            if (m[1]) {
                symbols.push({ name: m[1], kind, line: lineOf(content, m.index ?? 0) });
            }
        }
    };

    addSymbol(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, 'function');
    addSymbol(/(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g, 'class');
    addSymbol(/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g, 'function');
    addSymbol(/(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/g, 'interface');
    addSymbol(/(?:export\s+)?type\s+([A-Za-z_$][\w$]*)/g, 'type');
    addSymbol(/(?:def|class)\s+([A-Za-z_]\w*)/g, 'declaration');

    for (const m of content.matchAll(/(?:import[\s\S]*?from\s*|import\s*|require\s*\(|from\s+)(?:['"])([^'"]+)(?:['"])/g)) {
        if (m[1]) {
            imports.push({ target: m[1], raw: m[0], line: lineOf(content, m.index ?? 0) });
        }
    }
    for (const m of content.matchAll(/#include\s*[<"]([^>"]+)[>"]/g)) {
        if (m[1]) {
            imports.push({ target: m[1], raw: m[0], line: lineOf(content, m.index ?? 0) });
        }
    }

    const l = normalizedPath.toLowerCase();
    const classification = /controller/.test(l) ? 'controller'
        : /route|handler/.test(l) ? 'route'
        : /model|schema|entity/.test(l) ? 'model'
        : /service/.test(l) ? 'service'
        : /middleware/.test(l) ? 'middleware'
        : /component|\.tsx$|\.jsx$|\.vue$|\.svelte$/.test(l) ? 'component'
        : 'source';

    return {
        path: normalizedPath,
        language,
        classification,
        lineCount: content.split('\n').length,
        content,
        contentHash: crypto.createHash('sha256').update(content).digest('hex'),
        symbols,
        imports
    };
};

export const buildSnapshot = (files: ScannedFile[]): RepositorySnapshot => {
    const languages: Record<string, number> = {};
    const classifications: Record<string, number> = {};
    let symbolCount = 0;
    const dependencyEdges: Array<{ fromPath: string; toPath: string; line: number }> = [];

    const routeFiles: string[] = [];
    const modelFiles: string[] = [];
    const controllerFiles: string[] = [];
    const serviceFiles: string[] = [];
    const componentFiles: string[] = [];
    const entryPoints: string[] = [];

    const knownPaths = new Set(files.map(f => f.path));

    for (const f of files) {
        languages[f.language] = (languages[f.language] ?? 0) + 1;
        classifications[f.classification] = (classifications[f.classification] ?? 0) + 1;
        symbolCount += f.symbols.length;

        if (f.classification === 'route') routeFiles.push(f.path);
        if (f.classification === 'controller') controllerFiles.push(f.path);
        if (f.classification === 'service') serviceFiles.push(f.path);
        if (f.classification === 'model') modelFiles.push(f.path);
        if (f.classification === 'component') componentFiles.push(f.path);

        if (f.path.includes('index.') || f.path.includes('app.') || f.path.includes('server.')) {
            entryPoints.push(f.path);
        }

        for (const i of f.imports) {
            if (i.target.startsWith('.')) {
                const resolved = resolveImportPath(f.path, i.target, knownPaths);
                dependencyEdges.push({ fromPath: f.path, toPath: resolved, line: i.line });
            }
        }
    }

    const frameworks: string[] = [];
    if (files.some(f => f.path.endsWith('package.json'))) {
        const pkgContent = files.find(f => f.path.endsWith('package.json'))?.content ?? '';
        if (pkgContent.includes('express')) frameworks.push('EXPRESS');
        if (pkgContent.includes('react')) frameworks.push('REACT');
        if (pkgContent.includes('next')) frameworks.push('NEXT.JS');
        if (pkgContent.includes('vue')) frameworks.push('VUE');
        if (pkgContent.includes('drizzle')) frameworks.push('DRIZZLE ORM');
        if (pkgContent.includes('prisma')) frameworks.push('PRISMA');
    }

    return {
        totalFiles: files.length,
        textFiles: files.length,
        languages,
        classifications,
        symbolCount,
        dependencyEdgeCount: dependencyEdges.length,
        entryPoints,
        routeFiles,
        controllerFiles,
        serviceFiles,
        modelFiles,
        componentFiles,
        frameworks,
        suggestedPrompts: [
            "How does authentication work in this repository?",
            "Trace the main API request flow from entry point to database.",
            "Where are the database models and schemas defined?",
            "Why do users lose their session after checkout?"
        ]
    };
};
