import {
    pgTable, uuid, text, timestamp,
    integer, real, jsonb, index
} from 'drizzle-orm/pg-core';

export const conversations = pgTable('conversations', {
    id: uuid('id').primaryKey().defaultRandom(),
    anonymousVisitorId: text('anonymous_visitor_id').notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('conv_guest_idx').on(table.anonymousVisitorId),
]);

export const repositories = pgTable('repositories', {
    id: uuid('id').primaryKey().defaultRandom(),
    visitorId: text('visitor_id').notNull(),
    sourceType: text('source_type').notNull(),
    sourceUrl: text('source_url').notNull(),
    owner: text('owner'),
    name: text('name').notNull(),
    defaultBranch: text('default_branch'),
    commitSha: text('commit_sha'),
    status: text('status').notNull().default('pending'),
    languages: jsonb('languages').$type<Record<string, number>>().notNull().default({}),
    frameworks: jsonb('frameworks').$type<string[]>().notNull().default([]),
    snapshotJson: jsonb('snapshot_json').$type<Record<string, unknown>>().notNull().default({}),
    errorMessage: text('error_message'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('repositories_visitor_idx').on(table.visitorId),
    index('repositories_status_idx').on(table.status)
]);

export const repositoryFiles = pgTable('repository_files', {
    id: uuid('id').primaryKey().defaultRandom(),
    repositoryId: uuid('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    language: text('language').notNull(),
    classification: text('classification').notNull().default('source'),
    lineCount: integer('line_count').notNull(),
    content: text('content').notNull(),
    contentHash: text('content_hash').notNull(),
    symbolsJson: jsonb('symbols_json').$type<Array<{ name: string; kind: string; line: number }>>().notNull().default([]),
    importsJson: jsonb('imports_json').$type<Array<{ target: string; line: number; raw: string }>>().notNull().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('repository_files_repository_idx').on(table.repositoryId),
    index('repository_files_path_idx').on(table.repositoryId, table.path)
]);

export const repositoryEdges = pgTable('repository_edges', {
    id: uuid('id').primaryKey().defaultRandom(),
    repositoryId: uuid('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
    fromPath: text('from_path').notNull(),
    toPath: text('to_path').notNull(),
    edgeType: text('edge_type').notNull(),
    sourceLine: integer('source_line').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('repository_edges_repository_idx').on(table.repositoryId),
    index('repository_edges_from_idx').on(table.repositoryId, table.fromPath),
    index('repository_edges_to_idx').on(table.repositoryId, table.toPath)
]);

export const agentRuns = pgTable('agent_runs', {
    id: uuid('id').primaryKey().defaultRandom(),
    repositoryId: uuid('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
    visitorId: text('visitor_id').notNull(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
    request: text('request').notNull(),
    intent: text('intent').notNull(),
    status: text('status').notNull().default('pending'),
    evidenceJson: jsonb('evidence_json').$type<Array<{ path: string; startLine: number; endLine: number; claim?: string; confidence?: string }>>().notNull().default([]),
    planJson: jsonb('plan_json').$type<Record<string, unknown>>(),
    riskJson: jsonb('risk_json').$type<Record<string, unknown>>(),
    answerMd: text('answer_md'),
    patchText: text('patch_text'),
    reviewMd: text('review_md'),
    tokensUsed: integer('tokens_used'),
    costUsd: real('cost_usd'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('agent_runs_repository_idx').on(table.repositoryId),
    index('agent_runs_visitor_idx').on(table.visitorId),
    index('agent_runs_conversation_idx').on(table.conversationId)
]);

export type Conversation = typeof conversations.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type RepositoryFile = typeof repositoryFiles.$inferSelect;
export type RepositoryEdge = typeof repositoryEdges.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
