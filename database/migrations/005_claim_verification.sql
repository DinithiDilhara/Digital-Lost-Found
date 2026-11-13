-- Additive, repeatable decision and confirmed-handover timestamps.
SET @dlf_ddl = IF(
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'found_claims' AND column_name = 'decided_at'
    ),
    'SELECT 1',
    'ALTER TABLE found_claims ADD COLUMN decided_at TIMESTAMP(6) NULL'
);
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;

SET @dlf_ddl = IF(
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'lost_items' AND column_name = 'returned_at'
    ),
    'SELECT 1',
    'ALTER TABLE lost_items ADD COLUMN returned_at TIMESTAMP(6) NULL'
);
PREPARE dlf_stmt FROM @dlf_ddl;
EXECUTE dlf_stmt;
DEALLOCATE PREPARE dlf_stmt;
