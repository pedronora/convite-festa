CREATE TABLE "contract_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"label" varchar(80),
	"amount_cents" integer NOT NULL,
	"due_date" date NOT NULL,
	"paid_on" date,
	"method" varchar(30),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_name" varchar(160) NOT NULL,
	"category" varchar(40) DEFAULT 'outros' NOT NULL,
	"contact" varchar(160),
	"description" text NOT NULL,
	"total_cents" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contract_payments" ADD CONSTRAINT "contract_payments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contract_payments_contract_idx" ON "contract_payments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_payments_due_date_idx" ON "contract_payments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "contract_payments_paid_on_idx" ON "contract_payments" USING btree ("paid_on");--> statement-breakpoint
CREATE INDEX "contracts_supplier_name_idx" ON "contracts" USING btree ("supplier_name");--> statement-breakpoint
CREATE INDEX "contracts_category_idx" ON "contracts" USING btree ("category");