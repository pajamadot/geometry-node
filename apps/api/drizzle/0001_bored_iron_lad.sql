CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text DEFAULT 'New chat' NOT NULL,
	`message_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_message_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_chat_sessions_project` ON `chat_sessions` (`project_id`,`updated_at`);