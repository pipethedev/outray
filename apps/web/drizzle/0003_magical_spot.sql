ALTER TABLE "tunnels" RENAME COLUMN "subdomain" TO "url";--> statement-breakpoint
ALTER TABLE "tunnels" DROP CONSTRAINT "tunnels_subdomain_unique";--> statement-breakpoint
ALTER TABLE "tunnels" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tunnels" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
CREATE INDEX "tunnels_lastSeenAt_idx" ON "tunnels" USING btree ("last_seen_at");--> statement-breakpoint
ALTER TABLE "tunnels" ADD CONSTRAINT "tunnels_url_unique" UNIQUE("url");