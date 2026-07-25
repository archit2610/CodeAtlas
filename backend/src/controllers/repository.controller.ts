import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import {
    getFile,
    getRepository,
    getTree,
    importPublicRepository,
    importDemoRepository,
    searchFiles
} from '../services/repository.service.js';

const getOwnedRepository = async (req: Request) => {
    const visitorId = req.guestTempId!;
    const repoId = req.params.id as string;
    const r = await getRepository(repoId, visitorId);
    if (!r) throw new ApiError(404, 'Repository not found');
    return r;
};

export const importRepository = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body?.url) throw new ApiError(400, 'A public GitHub URL is required');
    const repository = await importPublicRepository(req.guestTempId!, req.body.url);
    res.status(201).json(new ApiResponse(201, { repository }, 'Repository ready'));
});

export const importDemo = asyncHandler(async (req: Request, res: Response) => {
    const repository = await importDemoRepository(req.guestTempId!);
    res.status(201).json(new ApiResponse(201, { repository }, 'Demo repository ready'));
});

export const getRepositoryById = asyncHandler(async (req: Request, res: Response) => {
    const repository = await getOwnedRepository(req);
    res.json(new ApiResponse(200, { repository }, 'Repository fetched'));
});

export const getRepositoryTree = asyncHandler(async (req: Request, res: Response) => {
    await getOwnedRepository(req);
    const files = await getTree(req.params.id as string);
    res.json(new ApiResponse(200, { files }, 'Tree fetched'));
});

export const getRepositoryFile = asyncHandler(async (req: Request, res: Response) => {
    await getOwnedRepository(req);
    const filePath = decodeURIComponent(req.params[0] ?? '');
    const file = await getFile(req.params.id as string, filePath);
    if (!file) throw new ApiError(404, 'File not found');
    res.json(new ApiResponse(200, { file }, 'File fetched'));
});

export const searchRepository = asyncHandler(async (req: Request, res: Response) => {
    await getOwnedRepository(req);
    const q = String(req.query.q ?? '').trim();
    if (!q) throw new ApiError(400, 'Search query is required');
    const files = await searchFiles(req.params.id as string, q);
    res.json(new ApiResponse(200, { files }, 'Search complete'));
});
