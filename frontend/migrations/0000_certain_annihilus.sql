CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp,
	`refresh_token_expires_at` timestamp,
	`scope` text,
	`password` text,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`updated_at` timestamp NOT NULL DEFAULT (now()
                                                                       ) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`action` varchar(32) NOT NULL,
	`entity_type` varchar(32) NOT NULL,
	`entity_id` varchar(64),
	`actor_id` varchar(36),
	`actor_type` varchar(16) NOT NULL,
	`source` varchar(16) NOT NULL,
	`payload` json,
	`metadata` json,
	`team_slug` varchar(255) NOT NULL,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_rules` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`error_message` text NOT NULL,
	`query` text DEFAULT (''),
	`enabled` tinyint(1) NOT NULL DEFAULT true,
	`edit_access` varchar(32) NOT NULL DEFAULT 'restricted',
	`created_at` timestamp NOT NULL DEFAULT now(),
	`updated_at` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_name_per_event` UNIQUE(`event_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`team_id` varchar(36) NOT NULL,
	`created_by_id` varchar(36),
	`edit_access` varchar(32) NOT NULL DEFAULT 'public',
	`type` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`icon` varchar(255) NOT NULL,
	`event_schema` json NOT NULL DEFAULT ('{}'),
	`updated_at` timestamp NOT NULL DEFAULT (now()
                    ) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_type_per_team` UNIQUE(`team_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(255),
	`team_id` varchar(36),
	`status` varchar(255) NOT NULL DEFAULT 'pending',
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`inviter_id` varchar(36),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` varchar(255) NOT NULL DEFAULT 'member',
	`created_at` timestamp NOT NULL DEFAULT now(),
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logo` text,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`metadata` json DEFAULT ('{}'),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `organizations_slug_uidx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reward_rules` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`error_message` text NOT NULL,
	`enabled` tinyint(1) NOT NULL DEFAULT true,
	`edit_access` varchar(32) NOT NULL DEFAULT 'restricted',
	`queries` json DEFAULT ('[]'),
	`tab` varchar(255) DEFAULT '',
	`column` varchar(255) DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT now(),
	`updated_at` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_name_per_event` UNIQUE(`event_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`updated_at` timestamp NOT NULL DEFAULT (now()
                                                                       ) ON UPDATE CURRENT_TIMESTAMP,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`active_organization_id` varchar(36),
	`active_team_id` varchar(36),
	`impersonated_by` text,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` varchar(36) NOT NULL,
	`team_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` varchar(64) NOT NULL DEFAULT 'member',
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) GENERATED ALWAYS AS (trim(both _utf8mb4'-' from replace(replace(lower(`name`),_utf8mb4' ',_utf8mb4'-'),_utf8mb4'--',_utf8mb4'-'))) VIRTUAL NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`updated_at` timestamp NOT NULL DEFAULT (now()
                                                                       ) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_name_unique` UNIQUE(`name`),
	CONSTRAINT `teams_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` tinyint(1) NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`updated_at` timestamp NOT NULL DEFAULT (now()
                                                                       ) ON UPDATE CURRENT_TIMESTAMP,
	`role` text,
	`banned` tinyint(1) DEFAULT false,
	`ban_reason` text,
	`ban_expires` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()
                                                                       ),
	`updated_at` timestamp NOT NULL DEFAULT (now()
                                                                       ) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_rules` ADD CONSTRAINT `event_rules_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_inviter_id_users_id_fk` FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reward_rules` ADD CONSTRAINT `reward_rules_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_active_organization_id_organizations_id_fk` FOREIGN KEY (`active_organization_id`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_active_team_id_teams_id_fk` FOREIGN KEY (`active_team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_actor` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_team_slug` ON `audit_logs` (`team_slug`);--> statement-breakpoint
CREATE INDEX `idx_audit_full_text_search` ON `audit_logs` (`action`,`entity_type`,`entity_id`,`actor_id`,`actor_type`,`source`);--> statement-breakpoint
CREATE INDEX `idx_rules_on_event_id` ON `event_rules` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_team_id` ON `events` (`team_id`);--> statement-breakpoint
CREATE INDEX `invitations_organizationId_idx` ON `invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE INDEX `members_organizationId_idx` ON `members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `members_userId_idx` ON `members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rules_on_event_id` ON `reward_rules` (`event_id`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `teamMembers_teamId_idx` ON `team_members` (`team_id`);--> statement-breakpoint
CREATE INDEX `teamMembers_userId_idx` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `teams_organizationId_idx` ON `teams` (`organization_id`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);