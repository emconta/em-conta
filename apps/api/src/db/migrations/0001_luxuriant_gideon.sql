CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"cnpj" char(14),
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;