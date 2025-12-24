CREATE TABLE "user_traits" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"age_band" text,
	"height_cm" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "hooks" jsonb;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "place_profiles" ADD COLUMN "last_hooks" jsonb;--> statement-breakpoint
ALTER TABLE "user_traits" ADD CONSTRAINT "user_traits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;