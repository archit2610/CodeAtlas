import { Router } from 'express';
import { guestSessionMiddleware } from '../middlewares/guest.middleware.js';
import { getRepositoryById, getRepositoryFile, getRepositoryTree, importRepository, searchRepository } from '../controllers/repository.controller.js';
const router = Router();
router.post('/import', guestSessionMiddleware, importRepository);
router.get('/:id', guestSessionMiddleware, getRepositoryById);
router.get('/:id/tree', guestSessionMiddleware, getRepositoryTree);
router.get('/:id/search', guestSessionMiddleware, searchRepository);
router.get('/:id/files/*', guestSessionMiddleware, getRepositoryFile);
export default router;
//# sourceMappingURL=repository.router.js.map