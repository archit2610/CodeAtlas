import { Router } from 'express';
import { guestSessionMiddleware } from '../middlewares/guest.middleware.js';
import { createAgentRun, approveRun, getPatch } from '../controllers/agent-run.controller.js';

const router = Router();

router.post('/repositories/:id/agent-runs', guestSessionMiddleware, createAgentRun);
router.post('/agent-runs/:id/approve', guestSessionMiddleware, approveRun);
router.get('/agent-runs/:id/patch', guestSessionMiddleware, getPatch);

export default router;
