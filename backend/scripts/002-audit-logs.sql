USE validations;

CREATE TABLE IF NOT EXISTS audit_logs
(
    id         BINARY(16)   NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    created_at TIMESTAMP    NOT NULL             DEFAULT CURRENT_TIMESTAMP,
    action     VARCHAR(32) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id  VARCHAR(64)  NULL,
    actor_id   VARCHAR(36)  NULL,
    actor_type VARCHAR(16)  NOT NULL,
    source     VARCHAR(16)  NOT NULL,
    payload    JSON         NULL,
    metadata   JSON         NULL,
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_actor (actor_id),
    INDEX idx_audit_action (action)
);
