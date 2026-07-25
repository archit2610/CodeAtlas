import { db } from '../db/index.js';
import { conversations, reports } from '../db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
export const GUEST_COOKIE_NAME = 'scout_temp_id';
export const createConversation = async (guestTempId, firstQuestion) => {
    const title = firstQuestion.length > 80 ? firstQuestion.slice(0, 77) + '...' : firstQuestion;
    try {
        const [convo] = await db.insert(conversations).values({
            userId: null,
            anonymousVisitorId: guestTempId,
            title,
        }).returning();
        return convo;
    }
    catch (error) {
        console.error("CREATE CONVERSATION ERROR:", error);
        if (error instanceof Error && "cause" in error) {
            console.error("CAUSE:", error.cause);
        }
        throw error;
    }
};
export const getConversationsByGuest = async (guestTempId) => {
    return db.select()
        .from(conversations)
        .where(eq(conversations.anonymousVisitorId, guestTempId))
        .orderBy(desc(conversations.updatedAt));
};
export const getConversationById = async (id, guestTempId) => {
    const [convo] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (convo?.anonymousVisitorId !== guestTempId)
        return null;
    return convo || null;
};
export const getConversationReports = async (conversationId) => {
    return db.select()
        .from(reports)
        .where(eq(reports.conversationId, conversationId))
        .orderBy(asc(reports.createdAt));
};
export const deleteConversation = async (conversationId, guestTempId) => {
    try {
        const conversation = await getConversationById(conversationId, guestTempId);
        if (!conversation)
            return null;
        const [deleted] = await db.delete(conversations).where(eq(conversations.id, conversationId)).returning();
        return deleted;
    }
    catch (error) {
        console.error("delete CONVERSATION ERROR:", error);
        if (error instanceof Error && "cause" in error) {
            console.error("CAUSE:", error.cause);
        }
        throw error;
    }
};
//# sourceMappingURL=conversation.service.js.map