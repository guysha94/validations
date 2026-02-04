CREATE DATABASE IF NOT EXISTS validations;

USE validations;

CREATE TABLE IF NOT EXISTS events
(
    id           BINARY(16)   NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    type         VARCHAR(255) NOT NULL UNIQUE,
    label        VARCHAR(255) NOT NULL UNIQUE,
    icon         VARCHAR(255) NOT NULL,
    event_schema JSON         NOT NULL             DEFAULT (JSON_OBJECT()),
    updated_at   TIMESTAMP    NOT NULL             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rules
(
    id            BINARY(16)   NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    event_id      BINARY(16)   NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT                              DEFAULT NULL,
    error_message TEXT         NOT NULL,
    query         TEXT         NOT NULL,
    enabled       BOOLEAN      NOT NULL             DEFAULT TRUE,
    updated_at    TIMESTAMP    NOT NULL             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    INDEX idx_rules_on_event_id (event_id),
    CONSTRAINT unique_name_per_event UNIQUE (event_id, name)
);
