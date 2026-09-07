CREATE TABLE "child_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"object_key" varchar(200) NOT NULL,
	"content_type" varchar(32) NOT NULL,
	"byte_size" integer NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"caption" varchar(255),
	"taken_on" date,
	CONSTRAINT "child_files_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
ALTER TABLE "child_files" ADD CONSTRAINT "child_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_files" ADD CONSTRAINT "child_files_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "child_files_user_id_idx" ON "child_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "child_files_child_id_idx" ON "child_files" USING btree ("child_id");