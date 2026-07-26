CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"conversation_id" uuid,
	"request" text NOT NULL,
	"intent" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"evidence_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"plan_json" jsonb,
	"risk_json" jsonb,
	"answer_md" text,
	"patch_text" text,
	"review_md" text,
	"tokens_used" integer,
	"cost_usd" real,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text NOT NULL,
	"owner" text,
	"name" text NOT NULL,
	"default_branch" text,
	"commit_sha" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"languages" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"frameworks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"snapshot_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"edge_type" text NOT NULL,
	"source_line" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"path" text NOT NULL,
	"language" text NOT NULL,
	"classification" text DEFAULT 'source' NOT NULL,
	"line_count" integer NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"symbols_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"imports_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memory_chunks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reports" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tool_calls" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "memory_chunks" CASCADE;--> statement-breakpoint
DROP TABLE "reports" CASCADE;--> statement-breakpoint
DROP TABLE "tool_calls" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "conv_user_idx";--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "anonymous_visitor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_edges" ADD CONSTRAINT "repository_edges_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_files" ADD CONSTRAINT "repository_files_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_runs_repository_idx" ON "agent_runs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "agent_runs_visitor_idx" ON "agent_runs" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "agent_runs_conversation_idx" ON "agent_runs" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "repositories_visitor_idx" ON "repositories" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "repositories_status_idx" ON "repositories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "repository_edges_repository_idx" ON "repository_edges" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "repository_edges_from_idx" ON "repository_edges" USING btree ("repository_id","from_path");--> statement-breakpoint
CREATE INDEX "repository_edges_to_idx" ON "repository_edges" USING btree ("repository_id","to_path");--> statement-breakpoint
CREATE INDEX "repository_files_repository_idx" ON "repository_files" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "repository_files_path_idx" ON "repository_files" USING btree ("repository_id","path");--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "user_id";