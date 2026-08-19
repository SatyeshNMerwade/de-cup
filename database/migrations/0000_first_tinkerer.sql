CREATE TYPE "public"."award_category" AS ENUM('AUTOMATIC', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."award_source" AS ENUM('SYSTEM', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."match_result_type" AS ENUM('NORMAL', 'EIGHT_BALL_FOUL');--> statement-breakpoint
CREATE TYPE "public"."match_stage" AS ENUM('GROUP', 'LEAGUE', 'QUALIFIER_1', 'ELIMINATOR', 'QUALIFIER_2', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('SCHEDULED', 'COMPLETED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."playoff_format" AS ENUM('NONE', 'KNOCKOUT', 'IPL');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('REGISTERED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."tournament_format" AS ENUM('GROUP', 'LEAGUE');--> statement-breakpoint
CREATE TYPE "public"."tournament_state" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN');--> statement-breakpoint
CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "award_category" NOT NULL,
	"description" text,
	"source" "award_source" DEFAULT 'SYSTEM' NOT NULL,
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
	"created_by" uuid,
	"locked_at" timestamp with time zone,
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
	"season_number" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tournament_format" "tournament_format" NOT NULL,
	"playoff_format" "playoff_format" NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"state" "tournament_state" DEFAULT 'DRAFT' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"role" "user_role" DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_one_id_players_id_fk" FOREIGN KEY ("player_one_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_two_id_players_id_fk" FOREIGN KEY ("player_two_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_loser_id_players_id_fk" FOREIGN KEY ("loser_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "season_registrations" ADD CONSTRAINT "season_registrations_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "season_registrations" ADD CONSTRAINT "season_registrations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "season_registrations" ADD CONSTRAINT "season_registrations_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_rule_set_id_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."rule_sets"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_awards_season" ON "awards" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_awards_player" ON "awards" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_awards_season_player_name" ON "awards" USING btree ("season_id","player_id","name");--> statement-breakpoint
CREATE INDEX "idx_awards_category" ON "awards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_groups_season" ON "groups" USING btree ("season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_groups_season_name" ON "groups" USING btree ("season_id","name");--> statement-breakpoint
CREATE INDEX "idx_groups_display_order" ON "groups" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "idx_matches_season" ON "matches" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_matches_number" ON "matches" USING btree ("season_id","match_number");--> statement-breakpoint
CREATE INDEX "idx_matches_stage" ON "matches" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_matches_status" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_matches_player_one" ON "matches" USING btree ("player_one_id");--> statement-breakpoint
CREATE INDEX "idx_matches_player_two" ON "matches" USING btree ("player_two_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_matches_season_match_number" ON "matches" USING btree ("season_id","match_number");--> statement-breakpoint
CREATE INDEX "idx_players_display_name" ON "players" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_players_short_name" ON "players" USING btree ("short_name");--> statement-breakpoint
CREATE INDEX "idx_rule_sets_name" ON "rule_sets" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_rule_sets_version" ON "rule_sets" USING btree ("version");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rule_sets_name_version" ON "rule_sets" USING btree ("name","version");--> statement-breakpoint
CREATE INDEX "idx_registration_season" ON "season_registrations" USING btree ("season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_registration_season_player" ON "season_registrations" USING btree ("season_id","player_id");--> statement-breakpoint
CREATE INDEX "idx_registration_status" ON "season_registrations" USING btree ("registration_status");--> statement-breakpoint
CREATE INDEX "idx_registration_player" ON "season_registrations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_registration_group" ON "season_registrations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_number" ON "seasons" USING btree ("season_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seasons_number" ON "seasons" USING btree ("season_number");--> statement-breakpoint
CREATE INDEX "idx_seasons_rule_set" ON "seasons" USING btree ("rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_state" ON "seasons" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_username" ON "users" USING btree ("username");