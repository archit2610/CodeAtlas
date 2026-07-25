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
    const classification = /controller|handler|route/.test(l) ? 'route'
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

    for (const f of files) {
        languages[f.language] = (languages[f.language] ?? 0) + 1;
        classifications[f.classification] = (classifications[f.classification] ?? 0) + 1;
    }

    const by = (p: (f: ScannedFile) => boolean) => files.filter(p).map(f => f.path);
    const pkg = files.find(f => f.path === 'package.json')?.content.toLowerCase() ?? '';

    const detectedFrameworks = ['next', 'react', 'express', 'vite', 'django', 'flask', 'fastapi', 'nest']
        .filter(x => pkg.includes(x));

    const entryPoints = by(f => /(^|\/)(index|main|app|server)\.(ts|tsx|js|jsx|py|go|java|cpp|c)$/i.test(f.path)).slice(0, 10);
    const routeFiles = by(f => f.classification === 'route');
    const modelFiles = by(f => f.classification === 'model');
    const controllerFiles = by(f => /controller|handler/.test(f.path.toLowerCase()));
    const serviceFiles = by(f => f.classification === 'service');
    const componentFiles = by(f => f.classification === 'component');

    const suggestedPrompts: string[] = [
        "How does authentication work in this repository?",
        "Trace the main API request flow from entry point to database.",
        "Where are the database models and schemas defined?",
    ];

    const hasCheckout = files.some(f => /checkout|payment|cart|session/i.test(f.path) || /checkout|payment|cart|session/i.test(f.content));
    if (hasCheckout) {
        suggestedPrompts.push("Why do users lose their session after checkout?");
    }

    return {
        totalFiles: files.length,
        textFiles: files.length,
        languages,
        classifications,
        frameworks: detectedFrameworks,
        entryPoints,
        routeFiles,
        modelFiles,
        controllerFiles,
        serviceFiles,
        componentFiles,
        symbolCount: files.reduce((n, f) => n + f.symbols.length, 0),
        dependencyEdgeCount: files.reduce((n, f) => n + f.imports.length, 0),
        suggestedPrompts
    };
};
