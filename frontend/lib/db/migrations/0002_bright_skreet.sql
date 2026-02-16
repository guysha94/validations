CREATE TABLE `audit_logs`
(
    `id`          binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    `created_at`  timestamp   NOT NULL DEFAULT (now()),
    `action`      varchar(32) NOT NULL,
    `entity_type` varchar(32) NOT NULL,
    `entity_id`   varchar(64),
    `actor_id`    varchar(36),
    `actor_type`  varchar(16) NOT NULL,
    `source`      varchar(16) NOT NULL,
    `payload`     json,
    `metadata`    json
    Ï
        CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity_type`, `entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_actor` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`);