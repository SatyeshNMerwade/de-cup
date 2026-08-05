CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "award_category" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"group_id" uuid,
	"match_number" integer NOT NULL,
	"stage" "match_stage" NOT NULL,
	"player_one_id" uuid NOT NULL,
	"player_two_id" uuid NOT NULL,
	"winner_id" uuid,
	"loser_id" uuid,
	"win_margin" integer,
	"lose_margin" integer,
	"result_type" "match_result_type",
	"status" "match_status" DEFAULT 'SCHEDULED' NOT NULL,
	"remarks" text,
	"metadata" jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"short_name" text,
	"avatar_url" text,
	"status" "player_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"tournament_format" "tournament_format" NOT NULL,
	"playoff_format" "playoff_format" NOT NULL,
	"rules" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"group_id" uuid,
	"seed" integer,
	"registration_status" "registration_status" DEFAULT 'REGISTERED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_number" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tournament_format" "tournament_format" NOT NULL,
	"playoff_format" "playoff_format" NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"state" "tournament_state" DEFAULT 'DRAFT' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_awards_season" ON "awards" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_awards_player" ON "awards" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_groups_season" ON "groups" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_matches_season" ON "matches" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_matches_number" ON "matches" USING btree ("season_id","match_number");--> statement-breakpoint
CREATE INDEX "idx_matches_stage" ON "matches" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_players_display_name" ON "players" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_players_short_name" ON "players" USING btree ("short_name");--> statement-breakpoint
CREATE INDEX "idx_registration_season" ON "season_registrations" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_registration_player" ON "season_registrations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_registration_group" ON "season_registrations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_number" ON "seasons" USING btree ("season_number");--> statement-breakpoint
CREATE INDEX "idx_seasons_rule_set" ON "seasons" USING btree ("rule_set_id");