import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { getConversationsByGuest, getConversationById, getConversationAgentRuns, deleteConversation } from "../services/conversation.service.js";
export const getUserConversations = asyncHandler(async (req, res) => {
    const guestTempId = req.guestTempId;
    const convos = await getConversationsByGuest(guestTempId);
    res.status(200).json(new ApiResponse(200, { conversations: convos }, "Conversations fetched successfully"));
});
export const getConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new ApiError(400, "Conversation ID is required");
    const convo = await getConversationById(id, req.guestTempId);
    if (!convo)
        throw new ApiError(404, "Conversation not found");
    res.status(200).json(new ApiResponse(200, { conversation: convo }, "Conversation fetched successfully"));
});
export const getConversationRunsThread = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new ApiError(400, "Conversation ID is required");
    const convo = await getConversationById(id, req.guestTempId);
    if (!convo)
        throw new ApiError(404, "Conversation not found");
    const runsList = await getConversationAgentRuns(id);
    res.status(200).json(new ApiResponse(200, { runs: runsList }, "Conversation thread history fetched successfully"));
});
export const deleteConversationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new ApiError(400, "Conversation ID is required");
    const deleted = await deleteConversation(id, req.guestTempId);
    if (!deleted)
        throw new ApiError(404, "Conversation not found");
    res.status(200).json(new ApiResponse(200, { conversation: deleted }, "Conversation deleted successfully"));
});
//# sourceMappingURL=conversation.controller.js.map