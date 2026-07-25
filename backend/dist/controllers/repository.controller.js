import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { getFile, getRepository, getTree, importPublicRepository, searchFiles } from '../services/repository.service.js';
const owned = async (req) => { const r = await getRepository(req.params.id, req.guestTempId); if (!r)
    throw new ApiError(404, 'Repository not found'); return r; };
export const importRepository = asyncHandler(async (req, res) => { if (!req.body?.url)
    throw new ApiError(400, 'A public GitHub URL is required'); const repository = await importPublicRepository(req.guestTempId, req.body.url); res.status(201).json(new ApiResponse(201, { repository }, 'Repository ready')); });
export const getRepositoryById = asyncHandler(async (req, res) => { res.json(new ApiResponse(200, { repository: await owned(req) }, 'Repository fetched')); });
export const getRepositoryTree = asyncHandler(async (req, res) => { await owned(req); res.json(new ApiResponse(200, { files: await getTree(req.params.id) }, 'Tree fetched')); });
export const getRepositoryFile = asyncHandler(async (req, res) => { await owned(req); const file = await getFile(req.params.id, decodeURIComponent(req.params[0] ?? '')); if (!file)
    throw new ApiError(404, 'File not found'); res.json(new ApiResponse(200, { file }, 'File fetched')); });
export const searchRepository = asyncHandler(async (req, res) => { await owned(req); const q = String(req.query.q ?? '').trim(); if (!q)
    throw new ApiError(400, 'Search query is required'); res.json(new ApiResponse(200, { files: await searchFiles(req.params.id, q) }, 'Search complete')); });
//# sourceMappingURL=repository.controller.js.map