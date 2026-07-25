import { db } from "../db/index.js";
import { reports, type Report } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/api-error.js";

interface createReportOptions {
    question: string;
    conversationId: string;
}

export const createReport = async ({ question, conversationId }: createReportOptions): Promise<Report> => {
    const [report] = await db.insert(reports).values({ question, conversationId }).returning()

    if (!report)
        throw new ApiError(400, "Quesry not reigstered")
    return report;
}

export const getReportById = async (id: string): Promise<Report | null> => {
    const [report] = await db.select().from(reports).where(eq(reports.id, id))
    if (!report)
        throw new ApiError(400, "Query not found")
    return report;
}

export const updateReport = async (id: string, data: Partial<typeof reports.$inferInsert>): Promise<Report> => {
    const [report] = await db.update(reports).set(data).where(eq(reports.id, id)).returning()

    if (!report)
        throw new ApiError(400, "Error while updating")
    return report;
}

export const deletereport = async (id: string): Promise<Report> => {
    const [report] = await db.delete(reports).where(eq(reports.id, id)).returning()
    if (!report) throw new ApiError(400, "Error while deleting user not found")
    return report;
}
