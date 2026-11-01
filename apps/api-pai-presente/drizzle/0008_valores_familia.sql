CREATE TABLE "family_value_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" varchar(32) NOT NULL,
	"label" varchar(60) NOT NULL,
	"normalized_key" varchar(60) NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	CONSTRAINT "family_value_options_kind_key" UNIQUE("kind","normalized_key")
);
--> statement-breakpoint
CREATE TABLE "user_family_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"option_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_family_values_user_kind_key" UNIQUE("user_id","kind")
);
--> statement-breakpoint
ALTER TABLE "user_family_values" ADD CONSTRAINT "user_family_values_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_family_values" ADD CONSTRAINT "user_family_values_option_id_family_value_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."family_value_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_family_values_option_id_idx" ON "user_family_values" USING btree ("option_id");--> statement-breakpoint
-- Sementes: sugestoes do campo livre antes de qualquer pai responder.
INSERT INTO "family_value_options" ("kind", "label", "normalized_key", "seeded") VALUES
  ('religiao', 'Católica', 'catolica', true),
  ('religiao', 'Evangélica', 'evangelica', true),
  ('religiao', 'Espírita', 'espirita', true),
  ('religiao', 'Umbanda', 'umbanda', true),
  ('religiao', 'Candomblé', 'candomble', true),
  ('religiao', 'Judaica', 'judaica', true),
  ('religiao', 'Muçulmana', 'muculmana', true),
  ('religiao', 'Budista', 'budista', true),
  ('religiao', 'Sem religião', 'sem religiao', true),
  ('religiao', 'Agnóstico', 'agnostico', true),
  ('religiao', 'Ateu', 'ateu', true),
  ('politica', 'Esquerda', 'esquerda', true),
  ('politica', 'Centro-esquerda', 'centro esquerda', true),
  ('politica', 'Centro', 'centro', true),
  ('politica', 'Centro-direita', 'centro direita', true),
  ('politica', 'Direita', 'direita', true),
  ('orientacao', 'Heterossexual', 'heterossexual', true),
  ('orientacao', 'Gay', 'gay', true),
  ('orientacao', 'Bissexual', 'bissexual', true)
ON CONFLICT ("kind", "normalized_key") DO NOTHING;
