PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_debts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`amount` integer NOT NULL,
	`remaining_amount` integer NOT NULL,
	`reason` text NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_debts`("id", "student_id", "amount", "remaining_amount", "reason", "due_date", "status", "created_at") SELECT "id", "student_id", "amount", "remaining_amount", "reason", "due_date", "status", "created_at" FROM `debts`;--> statement-breakpoint
DROP TABLE `debts`;--> statement-breakpoint
ALTER TABLE `__new_debts` RENAME TO `debts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text,
	`invoice_number` text NOT NULL,
	`student_id` text NOT NULL,
	`amount` integer NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issued_at` text,
	`due_date` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "payment_id", "invoice_number", "student_id", "amount", "tax", "total_amount", "status", "issued_at", "due_date", "created_at") SELECT "id", "payment_id", "invoice_number", "student_id", "amount", "tax", "total_amount", "status", "issued_at", "due_date", "created_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`enrollment_id` text,
	`debt_id` text,
	`amount` integer NOT NULL,
	`type` text DEFAULT 'tuition' NOT NULL,
	`method` text DEFAULT 'cash' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`transaction_id` text,
	`invoice_number` text,
	`description` text,
	`paid_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "student_id", "enrollment_id", "debt_id", "amount", "type", "method", "status", "transaction_id", "invoice_number", "description", "paid_at", "created_at") SELECT "id", "student_id", "enrollment_id", "debt_id", "amount", "type", "method", "status", "transaction_id", "invoice_number", "description", "paid_at", "created_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_transaction_id_unique` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `__new_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'short_term' NOT NULL,
	`duration_hours` integer NOT NULL,
	`total_credits` integer,
	`tuition_fee` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_programs`("id", "code", "name", "description", "type", "duration_hours", "total_credits", "tuition_fee", "status", "created_at", "updated_at") SELECT "id", "code", "name", "description", "type", "duration_hours", "total_credits", "tuition_fee", "status", "created_at", "updated_at" FROM `programs`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
ALTER TABLE `__new_programs` RENAME TO `programs`;--> statement-breakpoint
CREATE UNIQUE INDEX `programs_code_unique` ON `programs` (`code`);