import { Router } from "express";
import { getUserConversations, getConversation, getConversationRunsThread, deleteConversationById } from "../controllers/conversation.controller.js";
import { guestSessionMiddleware } from "../middlewares/guest.middleware.js";
const router = Router();
router.use(guestSessionMiddleware);
router.route('/').get(getUserConversations);
router.route('/:id').get(getConversation);
router.route('/:id/runs').get(getConversationRunsThread);
router.route('/:id').delete(deleteConversationById);
export default router;
//# sourceMappingURL=conversation.router.js.map