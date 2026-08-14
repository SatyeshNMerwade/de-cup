ALTER TABLE "matches" ADD COLUMN "toss_winner_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "first_breaker_id" uuid;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "tracks_toss_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_toss_winner_id_players_id_fk" FOREIGN KEY ("toss_winner_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_first_breaker_id_players_id_fk" FOREIGN KEY ("first_breaker_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;