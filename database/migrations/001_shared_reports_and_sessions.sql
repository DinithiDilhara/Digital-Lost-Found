-- Additive, repeatable migration for the existing schema. Run after schema.sql.
-- No user rows, reports, claims or notifications are deleted.

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='registration'), 'SELECT 1', 'ALTER TABLE users ADD COLUMN registration VARCHAR(40) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='lost_items' AND column_name='color'), 'SELECT 1', 'ALTER TABLE lost_items ADD COLUMN color VARCHAR(40) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='lost_items' AND column_name='contact'), 'SELECT 1', 'ALTER TABLE lost_items ADD COLUMN contact VARCHAR(150) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='lost_items' AND column_name='image'), 'SELECT 1', 'ALTER TABLE lost_items ADD COLUMN image MEDIUMTEXT NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='lost_items' AND column_name='created_at'), 'SELECT 1', 'ALTER TABLE lost_items ADD COLUMN created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='lost_items' AND column_name='client_request_id'), 'SELECT 1', 'ALTER TABLE lost_items ADD COLUMN client_request_id VARCHAR(64) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='lost_items' AND column_name='request_hash'), 'SELECT 1', 'ALTER TABLE lost_items ADD COLUMN request_hash CHAR(64) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='lost_items' AND index_name='uq_lost_request'), 'SELECT 1', 'ALTER TABLE lost_items ADD UNIQUE KEY uq_lost_request (user_id, client_request_id)');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='found_items' AND column_name='color'), 'SELECT 1', 'ALTER TABLE found_items ADD COLUMN color VARCHAR(40) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='found_items' AND column_name='contact'), 'SELECT 1', 'ALTER TABLE found_items ADD COLUMN contact VARCHAR(150) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='found_items' AND column_name='image'), 'SELECT 1', 'ALTER TABLE found_items ADD COLUMN image MEDIUMTEXT NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='found_items' AND column_name='created_at'), 'SELECT 1', 'ALTER TABLE found_items ADD COLUMN created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='found_items' AND column_name='client_request_id'), 'SELECT 1', 'ALTER TABLE found_items ADD COLUMN client_request_id VARCHAR(64) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='found_items' AND column_name='request_hash'), 'SELECT 1', 'ALTER TABLE found_items ADD COLUMN request_hash CHAR(64) NULL');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='found_items' AND index_name='uq_found_request'), 'SELECT 1', 'ALTER TABLE found_items ADD UNIQUE KEY uq_found_request (user_id, client_request_id)');
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_expiry (expires_at),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
