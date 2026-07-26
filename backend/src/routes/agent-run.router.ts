import { Router } from 'express';
import { guestSessionMiddleware } from '../middlewares/guest.middleware.js';
import { createAgentRun, getAgentRunEvents, approveRun, getPatch } from '../controllers/agent-run.controller.js';

const router = Router();

// Create Agent Run (supports both /repositories/:id/agent-runs and top-level /agent-runs)
router.post('/repositories/:id/agent-runs', guestSessionMiddleware, createAgentRun);
router.post('/agent-runs', guestSessionMiddleware, createAgentRun);

// Agent Run Operations (by Run ID)
router.get('/agent-runs/:id/events', guestSessionMiddleware, getAgentRunEvents);
router.post('/agent-runs/:id/approve', guestSessionMiddleware, approveRun);
router.get('/agent-runs/:id/patch', guestSessionMiddleware, getPatch);

export default router;
