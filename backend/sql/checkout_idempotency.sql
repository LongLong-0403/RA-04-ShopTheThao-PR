ALTER TABLE orders
ADD COLUMN idempotency_key VARCHAR(64) NULL
COMMENT 'Khóa chống gửi checkout lặp';

CREATE UNIQUE INDEX uk_orders_user_idempotency
ON orders (user_id, idempotency_key);