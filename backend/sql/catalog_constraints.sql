-- Apply once to an existing MySQL database before enabling catalog writes.
-- Back up the database first. Select the application's database explicitly.
-- Preflight: resolve any rows returned by these queries before ALTER TABLE.
SELECT LOWER(TRIM(name)) AS normalized_name, COUNT(*) AS total
FROM categories GROUP BY LOWER(TRIM(name)) HAVING COUNT(*) > 1;
SELECT id, parent_id FROM categories WHERE id = parent_id;

-- MySQL DDL auto-commits. Do not run on a newly created schema: the model
-- already defines these constraints. Check SHOW CREATE TABLE categories first.
ALTER TABLE categories ADD CONSTRAINT uq_categories_name UNIQUE (name);

-- Locate the actual old parent FK name (it may vary across installations).
SET @parent_fk = (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories'
      AND COLUMN_NAME = 'parent_id' AND REFERENCED_TABLE_NAME = 'categories'
    LIMIT 1
);
SET @drop_fk = IF(@parent_fk IS NULL, 'SELECT 1',
    CONCAT('ALTER TABLE categories DROP FOREIGN KEY `', REPLACE(@parent_fk, '`', '``'), '`'));
PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE categories ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;