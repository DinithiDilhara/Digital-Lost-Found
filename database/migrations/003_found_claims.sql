-- Additive and repeatable; existing reports, users and messaging remain intact.
CREATE TABLE IF NOT EXISTS found_claims (
    claim_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    lost_item_id INT NOT NULL,
    finder_id INT NOT NULL,
    found_location VARCHAR(150) NOT NULL,
    message VARCHAR(1500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (claim_id),
    UNIQUE KEY uq_found_claim_item_finder (lost_item_id, finder_id),
    KEY idx_found_claim_finder_created (finder_id, created_at),
    KEY idx_found_claim_status_created (status, created_at),
    CONSTRAINT chk_found_claim_location CHECK (CHAR_LENGTH(TRIM(found_location)) > 0),
    CONSTRAINT chk_found_claim_message CHECK (CHAR_LENGTH(TRIM(message)) > 0),
    CONSTRAINT fk_found_claim_lost_item FOREIGN KEY (lost_item_id) REFERENCES lost_items(item_id),
    CONSTRAINT fk_found_claim_finder FOREIGN KEY (finder_id) REFERENCES users(user_id)
);
