import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import {
    getConversationsByGuest,
    getConversationById,
    getConversationReports,
    deleteConversation
} from "../services/conversation.service.js";
;

export const getUserConversations = asyncHandler(async (req: Request, res: Response) => {
    const guestTempId = (req as Request & { guestTempId?: string }).guestTempId || req.cookies?.scout_temp_id;
    if (!guestTempId) throw new ApiError(400, "Guest session is required");

    const convos = await getConversationsByGuest(guestTempId);
    res.status(200).json(new ApiResponse(200, { conversations: convos }, "Conversations fetched successfully"));
});


export const getConversation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Conversation ID is required");

    const convo = await getConversationById(id as string, req.guestTempId!);
    if (!convo) throw new ApiError(404, "Conversation not found");

    res.status(200).json(new ApiResponse(200, { conversation: convo }, "Conversation fetched successfully"));
});


export const getConversationReportsThread = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Conversation ID is required");

    const convo = await getConversationById(id as string, req.guestTempId!);
    if (!convo) throw new ApiError(404, "Conversation not found");

    const reportsList = await getConversationReports(id as string);
    res.status(200).json(new ApiResponse(200, { reports: reportsList }, "Thread history fetched successfully"));
});


export const deleteConversationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Conversation ID is required");
    const deleted = await deleteConversation(id as string, req.guestTempId!);
    if (!deleted) throw new ApiError(404, "Conversation not found");
    res.status(200).json(new ApiResponse(200, { conversation: deleted }, "Conversation deleted successfully"));
});
