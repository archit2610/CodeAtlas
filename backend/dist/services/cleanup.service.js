import { db } from '../db/index.js';
import { repositories } from '../db/schema.js';
import { lt, eq } from 'drizzle-orm';
export const cleanupExpiredRepositories = async () => {
    try {
        const now = new Date();
        const expired = await db.select()
            .from(repositories)
            .where(lt(repositories.expiresAt, now));
        for (const repo of expired) {
            await db.delete(repositories).where(eq(repositories.id, repo.id));
        }
        return expired.length;
    }
    catch (error) {
        console.error('Failed to cleanup expired repositories:', error);
        return 0;
    }
};
//# sourceMappingURL=cleanup.service.js.map