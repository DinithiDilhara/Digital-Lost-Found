-- Additive, repeatable private-messaging schema. Run after migration 001.
-- Existing users, reports and authentication data are left untouched.

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    lost_item_id INT NULL,
    found_item_id INT NULL,
    reporter_id INT NOT NULL,
    requester_id INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (conversation_id),
    UNIQUE KEY uq_conversation_lost_requester (lost_item_id, requester_id),
    UNIQUE KEY uq_conversation_found_requester (found_item_id, requester_id),
    KEY idx_conversation_reporter_recent (reporter_id, updated_at),
    KEY idx_conversation_requester_recent (requester_id, updated_at),
    CONSTRAINT chk_conversation_one_item CHECK (
        (lost_item_id IS NOT NULL AND found_item_id IS NULL)
        OR (lost_item_id IS NULL AND found_item_id IS NOT NULL)
    ),
    CONSTRAINT chk_conversation_distinct_participants CHECK (reporter_id <> requester_id),
    CONSTRAINT fk_conversation_lost_item FOREIGN KEY (lost_item_id)
        REFERENCES lost_items(item_id),
    CONSTRAINT fk_conversation_found_item FOREIGN KEY (found_item_id)
        REFERENCES found_items(item_id),
    CONSTRAINT fk_conversation_reporter FOREIGN KEY (reporter_id)
        REFERENCES users(user_id),
    CONSTRAINT fk_conversation_requester FOREIGN KEY (requester_id)
        REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id INT NOT NULL,
    client_message_id CHAR(36) NOT NULL,
    body VARCHAR(1500) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    read_at TIMESTAMP(6) NULL,
    PRIMARY KEY (message_id),
    UNIQUE KEY uq_message_sender_client_id (sender_id, client_message_id),
    KEY idx_message_conversation_time (conversation_id, created_at, message_id),
    KEY idx_message_unread (conversation_id, sender_id, read_at),
    CONSTRAINT chk_message_body_not_empty CHECK (CHAR_LENGTH(TRIM(body)) > 0),
    CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id)
        REFERENCES users(user_id)
);
