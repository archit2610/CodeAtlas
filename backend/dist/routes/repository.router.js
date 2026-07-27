import { Router } from 'express';
import { guestSessionMiddleware } from '../middlewares/guest.middleware.js';
import { getRepositoryById, getRepositoryFile, getRepositoryTree, importRepository, importDemo, searchRepository, getBlastRadius, getRouteMap } from '../controllers/repository.controller.js';
const router = Router();
router.post('/import', guestSessionMiddleware, importRepository);
router.post('/demo', guestSessionMiddleware, importDemo);
router.get('/:id', guestSessionMiddleware, getRepositoryById);
router.get('/:id/tree', guestSessionMiddleware, getRepositoryTree);
router.get('/:id/search', guestSessionMiddleware, searchRepository);
router.get('/:id/impact', guestSessionMiddleware, getBlastRadius);
router.get('/:id/routes', guestSessionMiddleware, getRouteMap);
router.get('/:id/files/*', guestSessionMiddleware, getRepositoryFile);
export default router;
//# sourceMappingURL=repository.router.js.map