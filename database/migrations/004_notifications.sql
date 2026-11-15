-- Additive and repeatable notification storage.
-- Claim notifications are linked to found_claims when migration 003 is present.
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    recipient_id INT NOT NULL,
    claim_id BIGINT UNSIGNED NULL,
    lost_item_id INT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (notification_id),
    UNIQUE KEY uq_notification_claim_type (recipient_id, claim_id, type),
    KEY idx_notification_recipient_created (recipient_id, created_at, notification_id),
    KEY idx_notification_unread (recipient_id, is_read, created_at),
    KEY idx_notification_claim (claim_id),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id)
        REFERENCES users(user_id),
    CONSTRAINT fk_notification_lost_item FOREIGN KEY (lost_item_id)
        REFERENCES lost_items(item_id)
);

SET @dlf_fk = IF(
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'found_claims'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'notifications'
          AND constraint_name = 'fk_notification_claim'
    ),
    'ALTER TABLE notifications ADD CONSTRAINT fk_notification_claim FOREIGN KEY (claim_id) REFERENCES found_claims(claim_id)',
    'SELECT 1'
);
PREPARE dlf_stmt FROM @dlf_fk;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;
