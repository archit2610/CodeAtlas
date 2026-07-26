import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { getFile, getRepository, getTree, importPublicRepository, importDemoRepository, searchFiles } from '../services/repository.service.js';
const getOwnedRepository = async (req) => {
    const visitorId = req.guestTempId;
    const repoId = req.params.id;
    const r = await getRepository(repoId, visitorId);
    if (!r)
        throw new ApiError(404, 'Repository not found');
    return r;
};
export const importRepository = asyncHandler(async (req, res) => {
    if (!req.body?.url)
        throw new ApiError(400, 'A public GitHub URL is required');
    const repository = await importPublicRepository(req.guestTempId, req.body.url);
    res.status(201).json(new ApiResponse(201, { repository }, 'Repository ready'));
});
export const importDemo = asyncHandler(async (req, res) => {
    const repository = await importDemoRepository(req.guestTempId);
    res.status(201).json(new ApiResponse(201, { repository }, 'Demo repository ready'));
});
export const getRepositoryById = asyncHandler(async (req, res) => {
    const repository = await getOwnedRepository(req);
    res.json(new ApiResponse(200, { repository }, 'Repository fetched'));
});
export const getRepositoryTree = asyncHandler(async (req, res) => {
    await getOwnedRepository(req);
    const files = await getTree(req.params.id);
    res.json(new ApiResponse(200, { files }, 'Tree fetched'));
});
export const getRepositoryFile = asyncHandler(async (req, res) => {
    await getOwnedRepository(req);
    const filePath = decodeURIComponent(req.params[0] ?? '');
    const file = await getFile(req.params.id, filePath);
    if (!file)
        throw new ApiError(404, 'File not found');
    res.json(new ApiResponse(200, { file }, 'File fetched'));
});
export const searchRepository = asyncHandler(async (req, res) => {
    await getOwnedRepository(req);
    const q = String(req.query.q ?? '').trim();
    if (!q)
        throw new ApiError(400, 'Search query is required');
    const files = await searchFiles(req.params.id, q);
    res.json(new ApiResponse(200, { files }, 'Search complete'));
});
//# sourceMappingURL=repository.controller.js.map