-- Chạy sau khi USE database cần kiểm tra. Mọi violations phải bằng 0.
-- Chỉ đọc dữ liệu; không sửa schema, kho hoặc giao dịch.
SELECT 'users' AS entity, COUNT(*) AS actual, 6 AS minimum FROM users
UNION ALL SELECT 'products', COUNT(*), 36 FROM products
UNION ALL SELECT 'used_products', COUNT(*), 6 FROM products WHERE condition_type = 'CU'
UNION ALL SELECT 'courts', COUNT(*), 3 FROM courts
UNION ALL SELECT 'court_slots', COUNT(*), 12 FROM court_slots;

SELECT 'customer_without_cart' AS rule_name, COUNT(*) AS violations
FROM users u LEFT JOIN carts c ON c.user_id = u.id WHERE u.role = 'CUSTOMER' AND c.id IS NULL
UNION ALL SELECT 'product_without_sku', COUNT(*) FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_skus s WHERE s.product_id = p.id)
UNION ALL SELECT 'product_without_one_primary_image', COUNT(*) FROM products p
WHERE (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id AND i.is_primary = 1) <> 1
UNION ALL SELECT 'used_without_wear', COUNT(*) FROM products
WHERE condition_type = 'CU' AND (wear_description IS NULL OR TRIM(wear_description) = '')
UNION ALL SELECT 'invalid_sku', COUNT(*) FROM product_skus
WHERE stock < 0 OR price < 0 OR (unit = 'CHIEC' AND quantity_per_lot <> 1) OR (unit = 'LO' AND quantity_per_lot <= 1)
UNION ALL SELECT 'booking_wrong_court', COUNT(*) FROM court_bookings b
LEFT JOIN court_slots s ON s.id = b.court_slot_id AND s.court_id = b.court_id WHERE s.id IS NULL
UNION ALL SELECT 'overlapping_active_slots', COUNT(*) FROM court_slots a JOIN court_slots b
ON a.court_id = b.court_id AND a.id < b.id AND a.status = 'ACTIVE' AND b.status = 'ACTIVE'
AND a.start_time < b.end_time AND b.start_time < a.end_time
UNION ALL SELECT 'duplicate_held_bookings', COUNT(*) FROM (
SELECT court_slot_id, booking_date FROM court_bookings WHERE status IN ('CHO_XAC_NHAN', 'XAC_NHAN')
GROUP BY court_slot_id, booking_date HAVING COUNT(*) > 1) duplicates
UNION ALL SELECT 'invalid_order_total_or_empty', COUNT(*) FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id)
OR o.total_amount <> (SELECT COALESCE(SUM(i.quantity * i.price_at_order), 0) FROM order_items i WHERE i.order_id = o.id) + o.shipping_fee
UNION ALL SELECT 'invalid_buyback', COUNT(*) FROM buyback_requests
WHERE JSON_TYPE(images) <> 'ARRAY' OR JSON_LENGTH(images) NOT BETWEEN 1 AND 5
OR (status IN ('OFFERED', 'ACCEPTED', 'COMPLETED') AND offered_price IS NULL);
