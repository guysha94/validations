ALTER TABLE `audit_logs` ADD `team_slug` varchar(255) NOT NULL,
    ADD FULLTEXT INDEX idx_audit_full_text_search (
                                                   `action`,
                                                   `entity_type`,
                                                   `entity_id`,
                                                   `actor_id`,
                                                   `actor_type`,
                                                   `source`);