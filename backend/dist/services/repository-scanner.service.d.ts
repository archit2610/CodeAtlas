import type { RepositorySnapshot, ScannedFile } from '../types/repository.js';
export declare const detectLanguage: (p: string) => string;
export declare const scanFile: (filePath: string, content: string) => ScannedFile;
export declare const buildSnapshot: (files: ScannedFile[]) => RepositorySnapshot;
//# sourceMappingURL=repository-scanner.service.d.ts.map