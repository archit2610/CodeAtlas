import { db } from '../db/index.js';
import { conversations, agentRuns } from '../db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
export const GUEST_COOKIE_NAME = 'codeatlas_visitor_id';
export const createConversation = async (guestTempId, firstQuestion) => {
    const title = firstQuestion.length > 80 ? firstQuestion.slice(0, 77) + '...' : firstQuestion;
    try {
        const [convo] = await db.insert(conversations).values({
            anonymousVisitorId: guestTempId,
            title,
        }).returning();
        return convo;
    }
    catch (error) {
        console.error("CREATE CONVERSATION ERROR:", error);
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
export const getConversationAgentRuns = async (conversationId) => {
    return db.select()
        .from(agentRuns)
        .where(eq(agentRuns.conversationId, conversationId))
        .orderBy(asc(agentRuns.createdAt));
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
        console.error("DELETE CONVERSATION ERROR:", error);
        throw error;
    }
};
//# sourceMappingURL=conversation.service.js.map