CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"source_type" varchar NOT NULL,
	"source_id" integer,
	"entry_date" timestamp NOT NULL,
	"memo" varchar,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" varchar
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;