CREATE TABLE IF NOT EXISTS `events` (
	`id` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
	`type` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`icon` varchar(255) NOT NULL,
	`event_schema` json NOT NULL DEFAULT ('{}'),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `label` UNIQUE(`label`),
	CONSTRAINT `type` UNIQUE(`type`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rules` (
	`id` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
	`event_id` binary(16) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`error_message` text NOT NULL,
	`query` text NOT NULL,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_name_per_event` UNIQUE(`event_id`,`name`)
);
--> statement-breakpoint
ALTER TABLE `rules` ADD CONSTRAINT `rules_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_rules_on_event_id` ON `rules` (`event_id`);