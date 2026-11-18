CREATE TYPE "public"."invitation_status" AS ENUM('not_sent', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."rsvp_attendance" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."send_method" AS ENUM('whatsapp_web', 'whatsapp_business');--> statement-breakpoint
CREATE TYPE "public"."send_result" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(200),
	"group_name" varchar(160),
	"notes" text,
	"estimated_guests" integer,
	"max_guests" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "invitation_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"invitation_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"method" "send_method" DEFAULT 'whatsapp_web' NOT NULL,
	"status" "send_result" NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" "invitation_status" DEFAULT 'not_sent' NOT NULL,
	"sent_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "party_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"invitation_id" integer NOT NULL,
	"attendance_status" "rsvp_attendance" NOT NULL,
	"adults_count" integer DEFAULT 0 NOT NULL,
	"children_8_11_count" integer DEFAULT 0 NOT NULL,
	"children_0_7_count" integer DEFAULT 0 NOT NULL,
	"responsible_name" varchar(160) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(200),
	"notes" text,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_sends" ADD CONSTRAINT "invitation_sends_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_hash_unique" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_user_idx" ON "admin_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guests_name_idx" ON "guests" USING btree ("name");--> statement-breakpoint
CREATE INDEX "guests_phone_idx" ON "guests" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "invitation_sends_invitation_idx" ON "invitation_sends" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "invitation_sends_sent_at_idx" ON "invitation_sends" USING btree ("sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_guest_id_unique" ON "invitations" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_invitation_id_unique" ON "rsvps" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "rsvps_attendance_status_idx" ON "rsvps" USING btree ("attendance_status");