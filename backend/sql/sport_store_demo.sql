-- =============================================================================
-- HỆ THỐNG BÁN ĐỒ THỂ THAO (SPORTS EQUIPMENT E-COMMERCE & COURT BOOKING SYSTEM)
-- FILE: sport_store_demo.sql (MySQL 8.0.16+)
-- MỤC ĐÍCH: Tự động khởi tạo Database, toàn bộ 16 bảng DDL, Trigger và nạp DML Seed Data
-- CÁCH CHẠY: mở file bằng MySQL Workbench và Execute toàn bộ.
-- =============================================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `sport_store_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `sport_store_db`;

-- Khởi tạo trên database mới; chạy lại không ghi đè dữ liệu.
-- Không thay thế migration cho database đã có schema cũ. Xem README_SRS.md.

-- -----------------------------------------------------------------------------
-- PHẦN II: TẠO 16 BẢNG DỮ LIỆU CHUẨN SRS (DDL)
-- -----------------------------------------------------------------------------

-- 1. Bảng users (Người dùng)
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh duy nhất người dùng',
    `email` VARCHAR(255) NOT NULL COMMENT 'Email đăng nhập duy nhất',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã mã hoá bcrypt',
    `full_name` VARCHAR(150) NOT NULL COMMENT 'Họ và tên người dùng',
    `phone` VARCHAR(20) NOT NULL COMMENT 'Số điện thoại liên hệ',
    `address` TEXT NULL COMMENT 'Địa chỉ mặc định nhận hàng',
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER' COMMENT 'Vai trò người dùng',
    `status` ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái hoạt động',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tài khoản',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    INDEX `idx_users_phone` (`phone`),
    INDEX `idx_users_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quản lý tài khoản người dùng và phân quyền';

-- 2. Bảng sports (Môn thể thao)
CREATE TABLE IF NOT EXISTS `sports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh môn thể thao',
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên môn thể thao (Cầu lông, Bóng đá...)',
    `slug` VARCHAR(120) NOT NULL COMMENT 'Đường dẫn tĩnh thân thiện duy nhất',
    `description` TEXT NULL COMMENT 'Mô tả tổng quan môn thể thao',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái hiển thị',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sports_name` (`name`),
    UNIQUE KEY `uk_sports_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục môn thể thao';

-- 3. Bảng categories (Danh mục sản phẩm cha/con)
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh danh mục',
    `parent_id` BIGINT NULL COMMENT 'ID danh mục cha (NULL nếu là danh mục gốc)',
    `name` VARCHAR(150) NOT NULL COMMENT 'Tên danh mục (Vợt, Giày, Quả cầu...)',
    `slug` VARCHAR(150) NOT NULL COMMENT 'Đường dẫn tĩnh thân thiện duy nhất',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái hiển thị',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_categories_slug` (`slug`),
    INDEX `idx_categories_parent_id` (`parent_id`),
    CONSTRAINT `fk_categories_parent`
        FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm hỗ trợ đa cấp cha - con';

-- 4. Bảng brands (Thương hiệu)
CREATE TABLE IF NOT EXISTS `brands` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh thương hiệu',
    `name` VARCHAR(150) NOT NULL COMMENT 'Tên thương hiệu (Yonex, Nike, Adidas...)',
    `slug` VARCHAR(150) NOT NULL COMMENT 'Đường dẫn tĩnh duy nhất',
    `logo_url` VARCHAR(500) NULL COMMENT 'Ảnh logo thương hiệu',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái hiển thị',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_brands_name` (`name`),
    UNIQUE KEY `uk_brands_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục thương hiệu thể thao';

-- 5. Bảng products (Sản phẩm: Hàng Mới & Hàng Cũ)
CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh sản phẩm',
    `sport_id` BIGINT NOT NULL COMMENT 'Thuộc môn thể thao',
    `category_id` BIGINT NOT NULL COMMENT 'Thuộc danh mục sản phẩm',
    `brand_id` BIGINT NOT NULL COMMENT 'Thuộc thương hiệu',
    `name` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm',
    `description` TEXT NULL COMMENT 'Mô tả chi tiết sản phẩm',
    `specifications` JSON NULL COMMENT 'Thông số kỹ thuật (dạng JSON: trọng lượng, điểm cân bằng, chất liệu...)',
    `condition_type` ENUM('MOI', 'CU') NOT NULL DEFAULT 'MOI' COMMENT 'Tình trạng hàng: MOI hoặc CU',
    `wear_description` TEXT NULL COMMENT 'Mô tả chi tiết độ hao mòn (bắt buộc đối với hàng CU)',
    `status` ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái kinh doanh sản phẩm',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
    CONSTRAINT `chk_products_wear` CHECK (`condition_type` <> 'CU' OR (`wear_description` IS NOT NULL AND CHAR_LENGTH(TRIM(`wear_description`)) > 0)),
    PRIMARY KEY (`id`),
    INDEX `idx_products_sport` (`sport_id`),
    INDEX `idx_products_category` (`category_id`),
    INDEX `idx_products_brand` (`brand_id`),
    INDEX `idx_products_condition` (`condition_type`),
    INDEX `idx_products_status` (`status`),
    INDEX `idx_products_filter` (`sport_id`, `category_id`, `brand_id`, `condition_type`, `status`),
    CONSTRAINT `fk_products_sport`
        FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_category`
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_brand`
        FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông tin sản phẩm chung (Hàng Mới & Hàng Cũ)';

-- 6. Bảng product_skus (Biến thể sản phẩm SKU)
CREATE TABLE IF NOT EXISTS `product_skus` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh SKU',
    `product_id` BIGINT NOT NULL COMMENT 'Thuộc sản phẩm nào',
    `sku_code` VARCHAR(100) NOT NULL COMMENT 'Mã quản lý kho duy nhất (SKU code)',
    `size` VARCHAR(50) NULL COMMENT 'Kích cỡ (S, M, L, 40, 41, 3U, 4U...)',
    `color` VARCHAR(50) NULL COMMENT 'Màu sắc (Trắng, Đen, Xanh ngọc...)',
    `price` DECIMAL(12,2) NOT NULL COMMENT 'Giá bán của biến thể',
    `stock` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho',
    `unit` ENUM('CHIEC', 'LO') NOT NULL DEFAULT 'CHIEC' COMMENT 'Đơn vị bán: CHIEC (Chiếc) hoặc LO (Lô/Ống/Hộp)',
    `quantity_per_lot` INT NOT NULL DEFAULT 1 COMMENT 'Số sản phẩm/lô (VD: 12 quả/ống, mặc định 1 nếu là CHIEC)',
    PRIMARY KEY (`id`),
    `size_key` VARCHAR(50) GENERATED ALWAYS AS (LOWER(TRIM(COALESCE(`size`, '')))) STORED,
    `color_key` VARCHAR(50) GENERATED ALWAYS AS (LOWER(TRIM(COALESCE(`color`, '')))) STORED,
    UNIQUE KEY `uk_sku_variant` (`product_id`, `size_key`, `color_key`, `unit`, `quantity_per_lot`),
    UNIQUE KEY `uk_product_skus_code` (`sku_code`),
    INDEX `idx_product_skus_product_id` (`product_id`),
    INDEX `idx_product_skus_price` (`price`),
    CONSTRAINT `fk_product_skus_product`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `chk_product_skus_price` CHECK (`price` >= 0),
    CONSTRAINT `chk_product_skus_stock` CHECK (`stock` >= 0),
    CONSTRAINT `chk_product_skus_qty_lot` CHECK ((`unit` = 'CHIEC' AND `quantity_per_lot` = 1) OR (`unit` = 'LO' AND `quantity_per_lot` > 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biến thể SKU chi tiết (size, màu, giá, tồn kho, đơn vị tính)';

-- 7. Bảng product_images (Hình ảnh sản phẩm)
CREATE TABLE IF NOT EXISTS `product_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh hình ảnh',
    `product_id` BIGINT NOT NULL COMMENT 'Thuộc sản phẩm',
    `image_url` VARCHAR(500) NOT NULL COMMENT 'Đường dẫn ảnh sản phẩm',
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Ảnh đại diện chính của sản phẩm',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự ưu tiên hiển thị',
    PRIMARY KEY (`id`),
    `primary_marker` TINYINT GENERATED ALWAYS AS (CASE WHEN `is_primary` = 1 THEN 1 ELSE NULL END) STORED,
    UNIQUE KEY `uk_primary_product_image` (`product_id`, `primary_marker`),
    CONSTRAINT `chk_image_sort` CHECK (`sort_order` >= 0),
    CONSTRAINT `chk_image_primary` CHECK (`is_primary` IN (0, 1)),
    INDEX `idx_product_images_product_id` (`product_id`),
    CONSTRAINT `fk_product_images_product`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
        ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh sách hình ảnh sản phẩm';

-- 8. Bảng courts (Sân thể thao)
CREATE TABLE IF NOT EXISTS `courts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh sân thể thao',
    `sport_id` BIGINT NOT NULL COMMENT 'Môn thể thao của sân',
    `name` VARCHAR(150) NOT NULL COMMENT 'Tên sân (VD: Sân Cầu Lông Đền Lừ)',
    `address` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ thực tế của sân',
    `description` TEXT NULL COMMENT 'Mô tả mặt sân, tiện ích, bãi xe...',
    `status` ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái hoạt động',
    PRIMARY KEY (`id`),
    INDEX `idx_courts_sport_id` (`sport_id`),
    INDEX `idx_courts_status` (`status`),
    CONSTRAINT `fk_courts_sport`
        FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh sách sân thể thao phục vụ đặt lịch';

-- 9. Bảng court_slots (Ca giờ cố định)
CREATE TABLE IF NOT EXISTS `court_slots` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh ca giờ',
    `court_id` BIGINT NOT NULL COMMENT 'Thuộc sân thể thao nào',
    `slot_name` VARCHAR(100) NOT NULL COMMENT 'Tên ca (VD: Ca 1: 06:00 - 08:00)',
    `start_time` TIME NOT NULL COMMENT 'Giờ bắt đầu',
    `end_time` TIME NOT NULL COMMENT 'Giờ kết thúc',
    `price` DECIMAL(12,2) NOT NULL COMMENT 'Đơn giá thuê ca giờ này',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái ca giờ',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slot_court` (`id`, `court_id`),
    CONSTRAINT `chk_slot_time` CHECK (`start_time` >= '00:00:00' AND `start_time` < `end_time` AND `end_time` < '24:00:00'),
    INDEX `idx_court_slots_court_id` (`court_id`),
    CONSTRAINT `fk_court_slots_court`
        FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `chk_court_slots_price` CHECK (`price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Các khung ca giờ cố định và giá thuê của từng sân';

-- 10. Bảng court_bookings (Đặt lịch sân)
CREATE TABLE IF NOT EXISTS `court_bookings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh phiếu đặt sân',
    `user_id` BIGINT NOT NULL COMMENT 'Khách hàng đặt sân',
    `court_id` BIGINT NOT NULL COMMENT 'Sân được đặt',
    `court_slot_id` BIGINT NOT NULL COMMENT 'Ca giờ được đặt',
    `booking_date` DATE NOT NULL COMMENT 'Ngày sử dụng sân',
    `price_at_booking` DECIMAL(12,2) NOT NULL COMMENT 'Giá ca giờ lưu cố định tại thời điểm đặt',
    `status` ENUM('CHO_XAC_NHAN', 'XAC_NHAN', 'TU_CHOI', 'HUY') NOT NULL DEFAULT 'CHO_XAC_NHAN' COMMENT 'Trạng thái đặt sân',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo yêu cầu',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
    PRIMARY KEY (`id`),
    `held_marker` TINYINT GENERATED ALWAYS AS (CASE WHEN `status` IN ('CHO_XAC_NHAN', 'XAC_NHAN') THEN 1 ELSE NULL END) STORED,
    UNIQUE KEY `uk_held_booking` (`court_slot_id`, `booking_date`, `held_marker`),
    INDEX `idx_booking_slot_date_status` (`court_slot_id`, `booking_date`, `status`),
    INDEX `idx_court_bookings_user_id` (`user_id`),
    INDEX `idx_court_bookings_court_id` (`court_id`),
    INDEX `idx_court_bookings_slot_id` (`court_slot_id`),
    INDEX `idx_court_bookings_schedule` (`court_id`, `court_slot_id`, `booking_date`, `status`),
    CONSTRAINT `fk_court_bookings_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_court_bookings_court`
        FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_court_bookings_slot`
        FOREIGN KEY (`court_slot_id`, `court_id`) REFERENCES `court_slots` (`id`, `court_id`)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `chk_court_bookings_price` CHECK (`price_at_booking` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử và phiếu đặt lịch sân thể thao';

-- 11. Bảng match_posts (Bài đăng ghép kèo / tìm đối)
CREATE TABLE IF NOT EXISTS `match_posts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh bài đăng',
    `user_id` BIGINT NOT NULL COMMENT 'Người đăng tin',
    `sport_id` BIGINT NOT NULL COMMENT 'Môn thể thao cần ghép kèo',
    `match_time` DATETIME NOT NULL COMMENT 'Ngày giờ giao lưu/thi đấu',
    `location` VARCHAR(255) NOT NULL COMMENT 'Địa điểm sân giao lưu',
    `skill_level` VARCHAR(100) NOT NULL COMMENT 'Trình độ (Yếu, Trung bình, Khá, Bán chuyên...)',
    `contact_info` VARCHAR(255) NOT NULL COMMENT 'SĐT / Zalo / Facebook liên hệ',
    `status` ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN' COMMENT 'Trạng thái tìm đối',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm đăng',
    PRIMARY KEY (`id`),
    INDEX `idx_match_posts_user_id` (`user_id`),
    INDEX `idx_match_posts_sport_time` (`sport_id`, `status`, `match_time`),
    INDEX `idx_match_posts_status` (`status`),
    CONSTRAINT `fk_match_posts_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_match_posts_sport`
        FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cộng đồng đăng tin tìm đối thủ và ghép kèo thể thao';

-- 12. Bảng buyback_requests (Yêu cầu thu mua đồ cũ)
CREATE TABLE IF NOT EXISTS `buyback_requests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh yêu cầu thu mua',
    `user_id` BIGINT NOT NULL COMMENT 'Khách hàng gửi yêu cầu',
    `sport_id` BIGINT NULL COMMENT 'Môn thể thao liên quan',
    `brand_model` VARCHAR(255) NOT NULL COMMENT 'Hãng sản xuất & Tên Model đồ cũ',
    `condition_detail` TEXT NOT NULL COMMENT 'Mô tả tình trạng thực tế của khách hàng',
    `expected_price` DECIMAL(12,2) NOT NULL COMMENT 'Mức giá mong muốn bán của khách',
    `images` JSON NOT NULL COMMENT 'Danh sách URL hình ảnh chụp thực tế (dạng JSON Array)',
    `offered_price` DECIMAL(12,2) NULL COMMENT 'Mức giá đề nghị thu mua từ Admin sau thẩm định',
    `status` ENUM('PENDING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái xử lý thu mua',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm gửi yêu cầu',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_buyback_images` CHECK (JSON_TYPE(`images`) = 'ARRAY' AND JSON_LENGTH(`images`) BETWEEN 1 AND 5),
    CONSTRAINT `chk_buyback_offer_required` CHECK (`status` NOT IN ('OFFERED', 'ACCEPTED', 'COMPLETED') OR `offered_price` IS NOT NULL),
    INDEX `idx_buyback_user_id` (`user_id`, `status`),
    INDEX `idx_buyback_sport_id` (`sport_id`),
    INDEX `idx_buyback_status` (`status`),
    CONSTRAINT `fk_buyback_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_buyback_sport`
        FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `chk_buyback_expected_price` CHECK (`expected_price` >= 0),
    CONSTRAINT `chk_buyback_offered_price` CHECK (`offered_price` IS NULL OR `offered_price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phiếu yêu cầu thu mua ký gửi đồ thể thao cũ (Buyback)';

-- 13. Bảng carts (Giỏ hàng)
CREATE TABLE IF NOT EXISTS `carts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh giỏ hàng',
    `user_id` BIGINT NOT NULL COMMENT 'Mỗi khách hàng sở hữu duy nhất 1 giỏ hàng',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo giỏ',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_carts_user_id` (`user_id`),
    CONSTRAINT `fk_carts_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giỏ hàng của người dùng (1-1 với users)';

-- 14. Bảng cart_items (Chi tiết giỏ hàng theo SKU)
CREATE TABLE IF NOT EXISTS `cart_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh dòng giỏ hàng',
    `cart_id` BIGINT NOT NULL COMMENT 'Thuộc giỏ hàng nào',
    `product_sku_id` BIGINT NOT NULL COMMENT 'Tham chiếu trực tiếp đến biến thể SKU',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT 'Số lượng chọn mua',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm vào giỏ',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_cart_sku` (`cart_id`, `product_sku_id`),
    INDEX `idx_cart_items_cart_id` (`cart_id`),
    INDEX `idx_cart_items_sku_id` (`product_sku_id`),
    CONSTRAINT `fk_cart_items_cart`
        FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cart_items_sku`
        FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `chk_cart_items_qty` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết các mặt hàng trong giỏ';

-- 15. Bảng orders (Đơn hàng)
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh đơn hàng',
    `order_code` VARCHAR(50) NOT NULL COMMENT 'Mã đơn hàng hiển thị duy nhất (VD: ORD-20261106-001)',
    `user_id` BIGINT NOT NULL COMMENT 'Khách hàng đặt mua',
    `receiver_name` VARCHAR(150) NOT NULL COMMENT 'Họ tên người nhận hàng',
    `receiver_phone` VARCHAR(20) NOT NULL COMMENT 'Số điện thoại người nhận',
    `shipping_address` TEXT NOT NULL COMMENT 'Địa chỉ giao hàng chi tiết',
    `payment_method` ENUM('COD') NOT NULL DEFAULT 'COD' COMMENT 'Phương thức thanh toán khi nhận hàng',
    `shipping_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Phí vận chuyển (mặc định 0đ)',
    `total_amount` DECIMAL(12,2) NOT NULL COMMENT 'Tổng tiền thanh toán của đơn hàng',
    `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái đơn hàng',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm đặt hàng',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_orders_order_code` (`order_code`),
    INDEX `idx_orders_user_id` (`user_id`, `created_at`),
    INDEX `idx_orders_status` (`status`, `created_at`),
    INDEX `idx_orders_created_at` (`created_at`),
    CONSTRAINT `fk_orders_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `chk_orders_shipping_fee` CHECK (`shipping_fee` = 0),
    CONSTRAINT `chk_orders_total_amount` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn hàng thương mại điện tử';

-- 16. Bảng order_items (Chi tiết sản phẩm trong đơn hàng)
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Định danh chi tiết đơn hàng',
    `order_id` BIGINT NOT NULL COMMENT 'Thuộc đơn hàng nào',
    `product_sku_id` BIGINT NOT NULL COMMENT 'SKU được đặt mua',
    `quantity` INT NOT NULL COMMENT 'Số lượng mua',
    `price_at_order` DECIMAL(12,2) NOT NULL COMMENT 'Giá SKU lưu cố định tại thời điểm đặt',
    `condition_at_order` ENUM('MOI', 'CU') NOT NULL COMMENT 'Tình trạng sản phẩm (MOI/CU) lúc đặt hàng',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_sku` (`order_id`, `product_sku_id`),
    INDEX `idx_order_items_order_id` (`order_id`),
    INDEX `idx_order_items_sku_id` (`product_sku_id`),
    CONSTRAINT `fk_order_items_order`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_sku`
        FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0),
    CONSTRAINT `chk_order_items_price` CHECK (`price_at_order` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết các sản phẩm trong đơn hàng kèm lịch sử giá & tình trạng';

-- -----------------------------------------------------------------------------
-- PHẦN III: CÁC TRIGGER THỰC THI QUY TẮC NGHIỆP VỤ (BUSINESS RULES)
-- -----------------------------------------------------------------------------
-- Chống đặt trùng bằng uk_held_booking, kể cả hai giao dịch đồng thời.
-- HUY/TU_CHOI tạo khóa NULL nên vẫn đặt lại được.


-- -----------------------------------------------------------------------------
-- PHẦN IV: NẠP DỮ LIỆU MẪU (SEED DATA CHUẨN SRS)
-- -----------------------------------------------------------------------------



-- Seed trong một transaction. Database có dữ liệu sẽ được giữ nguyên.
-- Không dùng INSERT IGNORE và không tắt FOREIGN_KEY_CHECKS.
DELIMITER $$
DROP PROCEDURE IF EXISTS `seed_sport_store_demo`$$
CREATE PROCEDURE `seed_sport_store_demo`()
seed: BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    IF EXISTS (SELECT 1 FROM `users` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `sports` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `categories` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `brands` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `products` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `product_skus` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `product_images` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `courts` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `court_slots` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `court_bookings` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `match_posts` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `buyback_requests` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `carts` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `cart_items` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `orders` LIMIT 1) OR
        EXISTS (SELECT 1 FROM `order_items` LIMIT 1) THEN
        COMMIT;
        SELECT 'SKIPPED: database already contains data; no seed rows changed' AS seed_result;
        LEAVE seed;
    END IF;
-- 1. Users
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `address`, `role`, `status`) VALUES
(1, 'admin@sportstore.vn', '$2b$12$VZA7sMkK5qfWikCtW/PG3OytQGmnotqdH3/4v04NsL4dKJ5LbdfXS', 'Quản Trị Viên Hệ Thống', '0901234567', 'Tòa nhà TechCenter, Cầu Giấy, Hà Nội', 'ADMIN', 'ACTIVE'),
(2, 'nguyen.vana@gmail.com', '$2b$12$enuOosUqHQnbP2o9wpalqOVjVXMZe0NiF.OcrXIdX5nz5LmbwcItS', 'Nguyễn Văn An', '0912345678', 'Số 15 Lê Duẩn, Hoàn Kiếm, Hà Nội', 'CUSTOMER', 'ACTIVE'),
(3, 'tran.thib@gmail.com', '$2b$12$0Uanc812n6C4HQcjz.OvF.xkUjIp5scMEx3FxdAH1446zHwDbAC5i', 'Trần Thị Bích', '0923456789', 'Phòng 802, Chung cư Skylight, Minh Khai, Hai Bà Trưng, Hà Nội', 'CUSTOMER', 'ACTIVE'),
(4, 'le.quangc@gmail.com', '$2b$12$Jql/veJx9i/zj8rUXsZLGuyLr4.AmMMXnbYJ7F6tFrcTcmMZxjp.a', 'Lê Quang Cường', '0934567890', 'Tòa Landmark 81, Phường 22, Bình Thạnh, TP.HCM', 'CUSTOMER', 'ACTIVE'),
(5, 'pham.thid@gmail.com', '$2b$12$DQe0bOjqxlPutjXoxLQKkeJx7bi5EYCNav5z622b398tbI5Zi1s3y', 'Phạm Thị Dung', '0945678901', 'Số 48 Ngô Quyền, Sơn Trà, Đà Nẵng', 'CUSTOMER', 'ACTIVE'),
(6, 'hoang.vane@gmail.com', '$2b$12$M63xUTrdBCr7Dp/f41tjPuzenoJIcAO0FiwmQ5B3eCLZvgFZvIEAW', 'Hoàng Văn Em', '0956789012', 'Số 120 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', 'CUSTOMER', 'ACTIVE'),
(7, 'do.minhf@gmail.com', '$2b$12$L8uzKI6PNoqjq6NZKnuhfeY4n.mnqs8TwRjCnUbL1Mcth4QA5oyhK', 'Đỗ Minh Phúc', '0967890123', 'Số 88 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', 'CUSTOMER', 'ACTIVE');

-- 2. Sports (6 môn thể thao)
INSERT INTO `sports` (`id`, `name`, `slug`, `description`, `status`) VALUES
(1, 'Cầu lông', 'cau-long', 'Môn thể thao dùng vợt đánh cầu lông phong trào và chuyên nghiệp', 'ACTIVE'),
(2, 'Bóng đá', 'bong-da', 'Môn thể thao vua với giày đinh sân cỏ nhân tạo và bóng thi đấu', 'ACTIVE'),
(3, 'Tennis', 'tennis', 'Quần vợt chuyên nghiệp với vợt trợ lực và bóng thi đấu nỉ cao cấp', 'ACTIVE'),
(4, 'Pickleball', 'pickleball', 'Môn thể thao xu hướng kết hợp bóng bàn, tennis và cầu lông', 'ACTIVE'),
(5, 'Bóng rổ', 'bong-ro', 'Môn thể thao bóng rổ trong nhà sàn gỗ và ngoài trời bê tông', 'ACTIVE'),
(6, 'Bóng bàn', 'bong-ban', 'Môn bóng bàn phong trào và thi đấu chuyên nghiệp với cốt vợt, mặt vợt và bóng 3 sao chuẩn ITTF', 'ACTIVE');

-- 3. Categories (4 danh mục cha + 16 danh mục con)
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `status`) VALUES
(1, NULL, 'Vợt thể thao', 'vot-the-thao', 'ACTIVE'),
(2, 1, 'Vợt cầu lông', 'vot-cau-long', 'ACTIVE'),
(3, 1, 'Vợt Tennis', 'vot-tennis', 'ACTIVE'),
(4, 1, 'Vợt Pickleball', 'vot-pickleball', 'ACTIVE'),
(17, 1, 'Vợt & Cốt vợt bóng bàn', 'vot-cot-vot-bong-ban', 'ACTIVE'),
(18, 1, 'Mặt vợt bóng bàn', 'mat-vot-bong-ban', 'ACTIVE'),
(5, NULL, 'Giày thể thao', 'giay-the-thao', 'ACTIVE'),
(6, 5, 'Giày cầu lông', 'giay-cau-long', 'ACTIVE'),
(7, 5, 'Giày bóng đá', 'giay-bong-da', 'ACTIVE'),
(8, 5, 'Giày Tennis & Pickleball', 'giay-tennis-pickleball', 'ACTIVE'),
(19, 5, 'Giày bóng bàn & Đa năng', 'giay-bong-ban', 'ACTIVE'),
(9, NULL, 'Bóng & Quả thi đấu', 'bong-va-qua-thi-dau', 'ACTIVE'),
(10, 9, 'Quả cầu lông', 'qua-cau-long', 'ACTIVE'),
(11, 9, 'Quả bóng đá', 'qua-bong-da', 'ACTIVE'),
(12, 9, 'Bóng Tennis', 'bong-tennis', 'ACTIVE'),
(13, 9, 'Bóng Pickleball', 'bong-pickleball', 'ACTIVE'),
(20, 9, 'Hộp bóng bàn 3 sao ITTF', 'hop-bong-ban-3-sao', 'ACTIVE'),
(14, NULL, 'Trang phục & Balo', 'trang-phuc-balo', 'ACTIVE'),
(15, 14, 'Áo đấu & Trang phục', 'ao-dau-trang-phuc', 'ACTIVE'),
(16, 14, 'Túi vợt & Balo', 'tui-vot-balo', 'ACTIVE');

-- 4. Brands (13 thương hiệu chính hãng)
INSERT INTO `brands` (`id`, `name`, `slug`, `logo_url`, `status`) VALUES
(1, 'Yonex', 'yonex', '/frontend/assets/products/catalog/p001.webp', 'ACTIVE'),
(2, 'Lining', 'lining', '/frontend/assets/products/catalog/p005.webp', 'ACTIVE'),
(3, 'Victor', 'victor', '/frontend/assets/products/victor-auraspeed-90k-ii.png', 'ACTIVE'),
(4, 'Nike', 'nike', '/frontend/assets/products/catalog/p061.jpg', 'ACTIVE'),
(5, 'Adidas', 'adidas', '/frontend/assets/products/catalog/p064.jpg', 'ACTIVE'),
(6, 'Wilson', 'wilson', '/frontend/assets/products/catalog/p011.webp', 'ACTIVE'),
(7, 'Babolat', 'babolat', '/frontend/assets/products/catalog/p015.webp', 'ACTIVE'),
(8, 'Selkirk', 'selkirk', '/frontend/assets/products/catalog/p025.webp', 'ACTIVE'),
(9, 'Joola', 'joola', '/frontend/assets/products/catalog/p021.webp', 'ACTIVE'),
(10, 'Mizuno', 'mizuno', '/frontend/assets/products/catalog/p009.webp', 'ACTIVE'),
(11, 'Kamito', 'kamito', '/frontend/assets/products/catalog/p069.jpg', 'ACTIVE'),
(12, 'Butterfly', 'butterfly', '/frontend/assets/products/catalog/p031.jpg', 'ACTIVE'),
(13, 'DHS', 'dhs', '/frontend/assets/products/catalog/p036.webp', 'ACTIVE');

-- 5. Products (160 sản phẩm: 16 danh mục con x 10 sản phẩm đúng hãng)
INSERT INTO `products` (`id`, `sport_id`, `category_id`, `brand_id`, `name`, `description`, `specifications`, `condition_type`, `wear_description`, `status`) VALUES
(1, 1, 2, 1, 'Vợt cầu lông Yonex Astrox 88D Pro 2024', 'Dòng vợt tấn công đỉnh cao thế hệ 3 dành cho người chơi cầu sau, trợ lực đập smash cực uy lực.', '{"weight": "4U", "grip": "G5", "tension": "28 lbs", "balance": "Head Heavy", "material": "HM Graphite + 2G-Namd Flex Force"}', 'MOI', NULL, 'ACTIVE'),
(2, 1, 2, 1, 'Vợt cầu lông Yonex Nanoflare 1000Z', 'Siêu phẩm tốc độ với hệ thống Sonic Flare System giúp vung vợt chớp nhoáng và phản tạt cực nhanh.', '{"weight": "4U", "grip": "G5", "tension": "28 lbs", "balance": "Head Light", "material": "HM Graphite + NANOMETRIC DR"}', 'MOI', NULL, 'ACTIVE'),
(3, 1, 2, 1, 'Vợt cầu lông Yonex Astrox 100ZZ Kurenai', 'Cây vợt huyền thoại đồng hành cùng Viktor Axelsen với đũa vợt siêu mảnh, đập cầu cắm sân mạnh mẽ.', '{"weight": "4U", "grip": "G5", "tension": "28 lbs", "balance": "Head Heavy", "material": "Hyper Slim Shaft + Namd"}', 'MOI', NULL, 'ACTIVE'),
(4, 1, 2, 1, 'Vợt cầu lông Yonex Arcsaber 11 Pro', 'Vợt công thủ toàn diện kiểm soát cầu tuyệt đối, giữ cầu trên mặt vợt lâu hơn để điều cầu chuẩn xác.', '{"weight": "4U", "grip": "G5", "tension": "27 lbs", "balance": "Even Balance", "material": "HM Graphite + POCKETING BOOSTER"}', 'MOI', NULL, 'ACTIVE'),
(5, 1, 2, 2, 'Vợt cầu lông Lining Axforce 90 Max Tiger', 'Vợt tấn công uy lực mạnh mẽ với thiết kế họa tiết hổ vằn sắc sảo, thân vợt đàn hồi cao.', '{"weight": "4U", "grip": "G5", "tension": "30 lbs", "balance": "Head Heavy", "material": "TB Nano + M50 Super Carbon"}', 'MOI', NULL, 'ACTIVE'),
(6, 1, 2, 2, 'Vợt cầu lông Lining Halbertec 8000', 'Phối màu bất đối xứng nổi bật, tối ưu khả năng kiểm soát và điều cầu toàn diện trên sân.', '{"weight": "4U", "grip": "G5", "tension": "29 lbs", "balance": "Even Balance", "material": "T1100 + ACC-RIF TECH"}', 'MOI', NULL, 'ACTIVE'),
(7, 1, 2, 2, 'Vợt cầu lông Lining Bladex 900 Moon Max', 'Dòng vợt tốc độ cao dành cho đánh đôi chuyên nghiệp, vung vợt thoát gió cực nhanh.', '{"weight": "4U", "grip": "G6", "tension": "30 lbs", "balance": "Head Light", "material": "M46 + ULTRA Carbon"}', 'MOI', NULL, 'ACTIVE'),
(8, 1, 2, 3, 'Vợt cầu lông Victor Thruster Ryuga II Pro', 'Cây vợt rồng lửa đồng hành cùng Lee Zii Jia, công nghệ WES 2.0 tạo cú smash bộc phá.', '{"weight": "4U", "grip": "G5", "tension": "31 lbs", "balance": "Head Heavy", "material": "High Resilience Modulus Graphite + PYROFIL"}', 'MOI', NULL, 'ACTIVE'),
(9, 1, 2, 10, 'Vợt cầu lông Mizuno Fortius 11 Quick', 'Sản xuất tại Nhật Bản với công nghệ Torque Technology T5 truyền lực tối đa trong từng pha cầu.', '{"weight": "4U", "grip": "G6", "tension": "29 lbs", "balance": "Head Heavy", "material": "High Elasticity Graphite + MFUSION"}', 'MOI', NULL, 'ACTIVE'),
(10, 1, 2, 3, 'Vợt cầu lông Victor Auraspeed 90K II (Cũ 95%)', 'Vợt tốc độ phản tạt đôi nam cực thoát tay, đã qua kiểm định kỹ thuật tại Tsport.', '{"weight": "3U", "grip": "G5", "tension": "27 lbs", "balance": "Even Balance", "condition_grade": "95%"}', 'CU', 'Ngoại hình như mới 95%, chỉ xước dăm li ti ở nắp chụp cán vợt, khung carbon nguyên bản chưa từng va chạm.', 'ACTIVE'),
(11, 3, 3, 6, 'Vợt Tennis Wilson Pro Staff 97 V14', 'Cây vợt huyền thoại chuẩn kiểm soát với công nghệ Paradigm Bending cho cảm giác bóng chân thực.', '{"head_size": "97 sq in", "weight": "315g", "string_pattern": "16x19", "balance": "31cm"}', 'MOI', NULL, 'ACTIVE'),
(12, 3, 3, 6, 'Vợt Tennis Wilson Blade 98 16x19 V9', 'Dòng vợt được ưa chuộng nhất trên ATP/WTA Tour với độ ổn định và cảm giác kết nối bóng vượt trội.', '{"head_size": "98 sq in", "weight": "305g", "string_pattern": "16x19", "tech": "StableFeel"}', 'MOI', NULL, 'ACTIVE'),
(13, 3, 3, 6, 'Vợt Tennis Wilson Clash 100 V2', 'Cây vợt thân thiện bậc nhất cho cánh tay nhờ độ uốn dẻo linh hoạt và điểm ngọt mở rộng.', '{"head_size": "100 sq in", "weight": "295g", "string_pattern": "16x19", "tech": "FORTYFIVE"}', 'MOI', NULL, 'ACTIVE'),
(14, 3, 3, 6, 'Vợt Tennis Wilson Shift 99 V1', 'Thiết kế uốn ngang độc quyền tạo độ xoáy topspin hiện đại cùng độ kiểm soát cao.', '{"head_size": "99 sq in", "weight": "300g", "string_pattern": "16x20", "tech": "ARC 3D"}', 'MOI', NULL, 'ACTIVE'),
(15, 3, 3, 7, 'Vợt Tennis Babolat Pure Aero 2023', 'Cỗ máy tạo xoáy topspin cực đại đồng hành cùng Carlos Alcaraz và Rafael Nadal.', '{"head_size": "100 sq in", "weight": "300g", "string_pattern": "16x19", "tech": "NF2-Tech"}', 'MOI', NULL, 'ACTIVE'),
(16, 3, 3, 7, 'Vợt Tennis Babolat Pure Drive 2021', 'Biểu tượng sức mạnh bùng nổ và dễ chơi cho cả người chơi phong trào lẫn bán chuyên.', '{"head_size": "100 sq in", "weight": "300g", "string_pattern": "16x19", "tech": "HTR System"}', 'MOI', NULL, 'ACTIVE'),
(17, 3, 3, 7, 'Vợt Tennis Babolat Pure Strike 100 16x19', 'Kết hợp hoàn hảo giữa kiểm soát sắc bén và lực đánh linh hoạt cho lối chơi tấn công sớm.', '{"head_size": "100 sq in", "weight": "300g", "string_pattern": "16x19", "tech": "Control Frame"}', 'MOI', NULL, 'ACTIVE'),
(18, 3, 3, 1, 'Vợt Tennis Yonex EZONE 100 2022', 'Khung đầu vợt ISOMETRIC mở rộng vùng điểm ngọt 7%, trợ lực êm ái sản xuất tại Nhật Bản.', '{"head_size": "100 sq in", "weight": "300g", "string_pattern": "16x19", "tech": "ISOMETRIC + 2G-Namd Speed"}', 'MOI', NULL, 'ACTIVE'),
(19, 3, 3, 1, 'Vợt Tennis Yonex VCORE 98 2023', 'Dòng vợt xoáy đỉnh cao của Yonex giúp dây cước bật nảy nhanh và tạo quỹ đạo bóng khó chịu.', '{"head_size": "98 sq in", "weight": "305g", "string_pattern": "16x19", "tech": "Silicone Oil Infused Grommet"}', 'MOI', NULL, 'ACTIVE'),
(20, 3, 3, 6, 'Vợt Tennis Wilson Ultra 100 V4 (Cũ 90%)', 'Dòng vợt trợ lực mạnh mẽ với thiết kế khung FORTYFIVE bóng bẩy đổi màu theo góc nhìn.', '{"head_size": "100 sq in", "weight": "300g", "string_pattern": "16x19", "condition_grade": "90%"}', 'CU', 'Vành bảo vệ đầu vợt có vài vết xước nhẹ khi cứu bóng, thân khung đẹp nguyên bản không rạn nứt.', 'ACTIVE'),
(21, 4, 4, 9, 'Vợt Pickleball Joola Ben Johns Perseus 3S 16mm', 'Vợt thi đấu chuyên nghiệp của tay vợt số 1 thế giới Ben Johns, tối ưu cả lực đập lẫn độ xoáy.', '{"core": "Propulsion Core 16mm", "face": "Charged Carbon Surface", "weight": "8.0 oz", "length": "16.5 in"}', 'MOI', NULL, 'ACTIVE'),
(22, 4, 4, 9, 'Vợt Pickleball Joola Collin Johns Scorpeus 16mm', 'Mặt vợt bản rộng tối ưu điểm ngọt cho lối chơi phòng thủ chắc chắn và bỏ nhỏ dink chuẩn xác.', '{"core": "Reactive Honeycomb 16mm", "face": "Charged Carbon Surface", "weight": "8.0 oz"}', 'MOI', NULL, 'ACTIVE'),
(23, 4, 4, 9, 'Vợt Pickleball Joola Anna Bright Scorpeus 14mm', 'Phiên bản 14mm phản hồi bóng nhanh, linh hoạt tuyệt đối trong các pha đôi công trên lưới.', '{"core": "Reactive Honeycomb 14mm", "face": "Charged Carbon", "weight": "7.8 oz"}', 'MOI', NULL, 'ACTIVE'),
(24, 4, 4, 9, 'Vợt Pickleball Joola Ben Johns Hyperion CFS 16', 'Đầu vợt khí động học Aero-Curve giảm sức cản gió, tạo cú drive sâu và xoáy mạnh.', '{"core": "Reactive Honeycomb 16mm", "face": "Carbon Friction Surface", "weight": "8.4 oz"}', 'MOI', NULL, 'ACTIVE'),
(25, 4, 4, 8, 'Vợt Pickleball Selkirk Vanguard Power Air Invikta', 'Vợt không viền khí động học có lỗ thoát gió Air Dynamic Throat cho tốc độ vung vợt cực cao.', '{"core": "SuperCore Polymer 13mm", "face": "QuadFlex 4 Layer Hybrid", "weight": "7.9 oz"}', 'MOI', NULL, 'ACTIVE'),
(26, 4, 4, 8, 'Vợt Pickleball Selkirk Luxx Control Air Invikta', 'Độ dày lõi 20mm mang lại cảm giác kiểm soát mềm mại hàng đầu thế giới cho người chơi kỹ thuật.', '{"core": "X7 Thikset Honeycomb 20mm", "face": "Florek Carbon Fiber", "weight": "7.9 oz"}', 'MOI', NULL, 'ACTIVE'),
(27, 4, 4, 8, 'Vợt Pickleball Selkirk SLK Halo Control XL', 'Mặt sợi carbon thô T700 bám bóng tốt, mức giá hợp lý cho người chơi từ phong trào đến nâng cao.', '{"core": "Rev-Core Control 16mm", "face": "T700 Raw Carbon Fiber", "weight": "7.8 oz"}', 'MOI', NULL, 'ACTIVE'),
(28, 4, 4, 8, 'Vợt Pickleball Selkirk SLK Latitude Max', 'Lựa chọn lý tưởng cho người mới bắt đầu với mặt vợt rộng dễ làm quen và kiểm soát.', '{"core": "SX4 Polymer Core", "face": "GraphiFlex", "weight": "7.7 oz"}', 'MOI', NULL, 'ACTIVE'),
(29, 4, 4, 11, 'Vợt Pickleball Kamito Alpha Pro 16mm', 'Thiết kế dành riêng cho người chơi Việt Nam, mặt carbon nhám T700 cân bằng công thủ tốt.', '{"core": "PP Honeycomb 16mm", "face": "Toray T700 Carbon", "weight": "8.0 oz"}', 'MOI', NULL, 'ACTIVE'),
(30, 4, 4, 8, 'Vợt Pickleball Selkirk SLK Halo Power Max (Cũ 90%)', 'Vợt kiểm định chính hãng, mặt carbon còn độ nhám tốt cho các cú đánh xoáy.', '{"core": "Rev-Core Power 13mm", "face": "T700 Raw Carbon", "weight": "8.0 oz", "condition_grade": "90%"}', 'CU', 'Viền bảo vệ có xước dăm nhẹ khi cứu bóng thấp, mặt T700 nguyên vẹn không lún lõi.', 'ACTIVE'),
(31, 6, 17, 12, 'Cốt vợt bóng bàn Butterfly Viscaria FL', 'Cốt vợt huyền thoại số 1 thế giới với cấu trúc ALC cân bằng hoàn hảo giữa tốc độ và cảm giác.', '{"plies": "5 Gỗ + 2 Arylate-Carbon", "weight": "87g", "thickness": "5.8mm", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(32, 6, 17, 12, 'Cốt vợt bóng bàn Butterfly Timo Boll ALC', 'Mẫu cốt vợt gắn liền với huyền thoại Timo Boll, lý tưởng cho lối đánh giật xoáy hai càng.', '{"plies": "5 Gỗ + 2 Arylate-Carbon", "weight": "86g", "thickness": "5.8mm", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(33, 6, 17, 12, 'Cốt vợt bóng bàn Butterfly Fan Zhendong ALC', 'Phiên bản đặc biệt của nhà vô địch Olympic Fan Zhendong, tốc độ bùng nổ và kiểm soát ổn định.', '{"plies": "5 Gỗ + 2 Arylate-Carbon", "weight": "87g", "thickness": "5.8mm", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(34, 6, 17, 12, 'Cốt vợt bóng bàn Butterfly Harimoto Innerforce ALC', 'Cấu trúc sợi carbon đặt sát lõi gỗ giúp giữ bóng lâu hơn, cực kỳ dễ điều khiển bóng ngắn.', '{"plies": "5 Gỗ + 2 Inner ALC", "weight": "88g", "thickness": "6.0mm", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(35, 6, 17, 12, 'Cốt vợt bóng bàn Butterfly Sardius TAMCA 5000', 'Siêu tốc độ bạt bóng đầy uy lực với lớp gỗ Hinoki dày đặc trưng của dòng tấn công cổ điển.', '{"plies": "3 Gỗ Hinoki + 2 Carbon T5000", "weight": "92g", "thickness": "7.0mm", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(36, 6, 17, 13, 'Cốt vợt bóng bàn DHS Hurricane Long 5', 'Cốt vợt của nhà vô địch Grand Slam Ma Long, nổi tiếng với cú giật thuận tay cực mạnh.', '{"plies": "5 Gỗ + 2 Arylate-Carbon", "weight": "89g", "thickness": "5.9mm", "origin": "Trung Quốc"}', 'MOI', NULL, 'ACTIVE'),
(37, 6, 17, 13, 'Cốt vợt bóng bàn DHS Hurricane 301', 'Cốt vợt quốc dân hiệu năng vượt tầm giá với lớp mặt Koto sắc bén và cảm giác bóng rõ nét.', '{"plies": "5 Gỗ + 2 Inner ALC", "weight": "88g", "thickness": "5.8mm"}', 'MOI', NULL, 'ACTIVE'),
(38, 6, 17, 13, 'Cốt vợt bóng bàn DHS Fang Bo B2X', 'Phiên bản nâng cấp lõi dày hỗ trợ lực đánh mạnh mẽ khi chơi bóng nhựa 40+.', '{"plies": "5 Gỗ + 2 Arylate-Carbon", "weight": "88g", "thickness": "5.9mm"}', 'MOI', NULL, 'ACTIVE'),
(39, 6, 17, 13, 'Vợt bóng bàn dán sẵn DHS 4002', 'Vợt dán sẵn chính hãng DHS sử dụng mặt Hurricane bám xoáy, tặng kèm bao đựng tiện lợi.', '{"rubbers": "Hurricane 3 + Tin Arc", "weight": "178g", "level": "Phong trào / Bán chuyên"}', 'MOI', NULL, 'ACTIVE'),
(40, 6, 17, 12, 'Cốt vợt bóng bàn Butterfly Primorac OFF- (Cũ 92%)', 'Cốt vợt 5 lớp gỗ thuần kinh điển dành cho người tập kỹ thuật cơ bản và kiểm soát bóng.', '{"plies": "5 lớp gỗ thuần", "weight": "85g", "thickness": "5.5mm", "condition_grade": "92%"}', 'CU', 'Cán vợt hơi sẫm màu mồ hôi tay, cạnh gỗ nguyên vẹn không sứt mẻ, mặt vợt phẳng đẹp.', 'ACTIVE'),
(41, 6, 18, 12, 'Mặt vợt bóng bàn Butterfly Tenergy 05', 'Mặt vợt bán chạy nhất mọi thời đại với công nghệ High Tension cho khả năng giật xoáy vượt trội.', '{"sponge": "Spring Sponge 36°", "speed": "13.0", "spin": "11.5", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(42, 6, 18, 12, 'Mặt vợt bóng bàn Butterfly Dignics 09C', 'Siêu phẩm mặt vợt lai Tàu - Nhật độ bám xoáy cực đại, kiểm soát giao bóng và cắt bóng sắc lẹm.', '{"sponge": "Spring Sponge X 44°", "surface": "Tacky (Hơi dính)", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(43, 6, 18, 12, 'Mặt vợt bóng bàn Butterfly Dignics 05', 'Nâng cấp toàn diện từ Tenergy 05 với độ đàn hồi Spring Sponge X tạo vòng cung bóng uy lực.', '{"sponge": "Spring Sponge X 40°", "speed": "13.5", "spin": "12.0", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(44, 6, 18, 12, 'Mặt vợt bóng bàn Butterfly Rozena', 'Mặt vợt thân thiện dễ kiểm soát, hỗ trợ sửa lỗi góc vợt cực tốt cho người chơi phong trào.', '{"sponge": "Spring Sponge 35°", "level": "Trung cấp - Nâng cao", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(45, 6, 18, 12, 'Mặt vợt bóng bàn Butterfly Tenergy 64', 'Tốc độ nhanh nhất dòng Tenergy, cực kỳ thích hợp đánh trái tay hoặc giật xa bàn.', '{"sponge": "Spring Sponge 36°", "speed": "13.5", "spin": "10.5", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(46, 6, 18, 12, 'Mặt vợt bóng bàn Butterfly Glayzer', 'Trang bị lót Spring Sponge X cao cấp với mức giá mềm hơn dòng Dignics.', '{"sponge": "Spring Sponge X 38°", "origin": "Nhật Bản"}', 'MOI', NULL, 'ACTIVE'),
(47, 6, 18, 13, 'Mặt vợt bóng bàn DHS Hurricane 3 Neo', 'Mặt vợt huyền thoại của tuyển Trung Quốc với độ dính cao tạo quỹ đạo giật bóng cắm và xoáy sâu.', '{"sponge": "Neo Orange Sponge 39°", "surface": "Tacky Dính", "origin": "Trung Quốc"}', 'MOI', NULL, 'ACTIVE'),
(48, 6, 18, 13, 'Mặt vợt bóng bàn DHS Hurricane 3 National Blue Sponge', 'Phiên bản lót xanh cấp độ đội tuyển quốc gia cho độ nén và lực bật vượt trội.', '{"sponge": "Blue Sponge 40°", "grade": "National Tuyển Quốc Gia"}', 'MOI', NULL, 'ACTIVE'),
(49, 6, 18, 13, 'Mặt vợt bóng bàn DHS Hurricane 8-80', 'Lót đàn hồi mềm hơn giúp dễ phát lực đánh trái tay mà vẫn giữ độ xoáy đặc trưng dòng Hurricane.', '{"sponge": "Elastic 80# Sponge 37°", "use": "Trái tay / Thuận tay"}', 'MOI', NULL, 'ACTIVE'),
(50, 6, 18, 13, 'Mặt vợt bóng bàn DHS Gold Arc 8', 'Mặt vợt công nghệ bọt khí Đức hợp tác cùng DHS, phát tiếng nổ giòn và tốc độ cực cao.', '{"sponge": "German Tensor 47.5°", "origin": "Sản xuất tại Đức"}', 'MOI', NULL, 'ACTIVE'),
(51, 1, 6, 1, 'Giày cầu lông Yonex Power Cushion 65Z3', 'Đôi giày quốc dân êm ái toàn diện, bám sân cực tốt và giảm chấn gót chân hiệu quả.', '{"outsole": "Radial Blade Sole", "midsole": "Power Cushion+", "weight": "310g"}', 'MOI', NULL, 'ACTIVE'),
(52, 1, 6, 1, 'Giày cầu lông Yonex Power Cushion Aerus Z2', 'Dòng giày siêu nhẹ chỉ 240g giúp tăng tốc độ di chuyển và bật nhảy thanh thoát trên sân.', '{"weight": "240g (Siêu nhẹ)", "midsole": "Feather Light X", "upper": "Double Raschel Mesh"}', 'MOI', NULL, 'ACTIVE'),
(53, 1, 6, 1, 'Giày cầu lông Yonex Power Cushion Eclipsion Z3', 'Tối ưu sự ổn định tối đa cho các bước di chuyển ngang gắt và tiếp đất sau cú đập nhảy.', '{"stability": "3D Power Graphite", "midsole": "Power Cushion+", "fit": "Ôm cổ chân chống lật"}', 'MOI', NULL, 'ACTIVE'),
(54, 1, 6, 1, 'Giày cầu lông Yonex Power Cushion Comfort Z3', 'Đệm khí Power Cushion+ trải dài toàn bàn chân giúp bảo vệ đầu gối tối ưu khi chơi cường độ cao.', '{"cushion": "Full-length Power Cushion+", "fit": "Wide 4E"}', 'MOI', NULL, 'ACTIVE'),
(55, 1, 6, 2, 'Giày cầu lông Lining Blade Pro', 'Trang bị đế BOOM siêu đàn hồi kết hợp tấm carbon chống xoắn giữa bàn chân.', '{"midsole": "BOOM Technology", "plate": "Carbon Fiber Plate"}', 'MOI', NULL, 'ACTIVE'),
(56, 1, 6, 2, 'Giày cầu lông Lining Saga II Pro', 'Form giày vững chãi bảo vệ cổ chân tốt, thiết kế thể thao hiện đại.', '{"midsole": "Light Foam + BOOM", "upper": "Mesh thoáng khí + TPU"}', 'MOI', NULL, 'ACTIVE'),
(57, 1, 6, 3, 'Giày cầu lông Victor P9200III', 'Dòng giày bảo vệ mắt cá chân trứ danh của Victor với độ bền đế vượt trội.', '{"midsole": "NEO DUPLEX + HYPEREVA", "stability": "LS-S chống lật cổ chân"}', 'MOI', NULL, 'ACTIVE'),
(58, 1, 6, 3, 'Giày cầu lông Victor A970NitroLite', 'Công nghệ bọt khí NitroLite siêu nhẹ đàn hồi giúp khởi phát bước chạy bùng nổ.', '{"midsole": "NitroLite Foam", "upper": "Microfiber PU Leather"}', 'MOI', NULL, 'ACTIVE'),
(59, 1, 6, 10, 'Giày cầu lông Mizuno Wave Claw 3', 'Form giày cực kỳ vừa vặn cho bàn chân bè người Việt, đệm Wave êm ái ổn định.', '{"midsole": "MIZUNO ENERZY + Wave", "fit": "Chân bè châu Á"}', 'MOI', NULL, 'ACTIVE'),
(60, 1, 6, 10, 'Giày cầu lông Mizuno Wave Fang 2 (Cũ 90%)', 'Dòng giày bền bỉ chắc chắn với đế cao su XG bám sàn cực tốt.', '{"outsole": "XG Rubber", "midsole": "Mizuno Wave", "condition_grade": "90%"}', 'CU', 'Đế cao su mòn nhẹ khoảng 10% ở gót ngoài, da mũi giày nguyên vẹn, lót trong sạch đẹp.', 'ACTIVE'),
(61, 2, 7, 4, 'Giày bóng đá Nike Zoom Mercurial Vapor 15 Pro TF', 'Siêu phẩm tốc độ sân cỏ nhân tạo với túi khí Air Zoom hoàn trả năng lượng cực nhạy.', '{"surface": "Sân cỏ nhân tạo TF", "cushion": "Air Zoom", "upper": "NikeSkin"}', 'MOI', NULL, 'ACTIVE'),
(62, 2, 7, 4, 'Giày bóng đá Nike Tiempo Legend 10 Pro TF', 'Cảm giác chạm bóng êm ái thật chân nhất phân khúc với chất liệu da tổng hợp FlyTouch Pro.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "FlyTouch Pro siêu mềm"}', 'MOI', NULL, 'ACTIVE'),
(63, 2, 7, 4, 'Giày bóng đá Nike Phantom GX 2 Pro TF', 'Bề mặt vân nổi Gripknit hỗ trợ kiểm soát bóng dính chân và chuyền sút chuẩn xác.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "Flyknit + Gripknit"}', 'MOI', NULL, 'ACTIVE'),
(64, 2, 7, 5, 'Giày bóng đá Adidas Predator Elite TF', 'Dòng giày sút xoáy huyền thoại trang bị vây cao su Strikeskin tăng độ bám bóng.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "HybridTouch 2.0 + Strikeskin", "cushion": "Lightstrike"}', 'MOI', NULL, 'ACTIVE'),
(65, 2, 7, 5, 'Giày bóng đá Adidas F50 Pro TF', 'Sự trở lại của huyền thoại tốc độ F50 với trọng lượng nhẹ và bộ đế bám sân sắc bén.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "Fibertouch", "cushion": "Lightstrike"}', 'MOI', NULL, 'ACTIVE'),
(66, 2, 7, 5, 'Giày bóng đá Adidas Copa Pure 2 Pro TF', 'Mũi giày da bò thật mềm mại cho cảm giác khống chế bóng cổ điển đầy tinh tế.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "Fusionskin Da Bò"}', 'MOI', NULL, 'ACTIVE'),
(67, 2, 7, 10, 'Giày bóng đá Mizuno Morelia Neo IV Pro AS TF', 'Da Kangaroo mềm như bơ ôm gọn chân bè, đinh chữ L siêu bám sân cỏ nhân tạo.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "Da Kangaroo thật", "weight": "235g"}', 'MOI', NULL, 'ACTIVE'),
(68, 2, 7, 10, 'Giày bóng đá Mizuno Alpha Pro AS TF', 'Mẫu giày tốc độ nhẹ nhất lịch sử Mizuno, cực êm gót với lớp đệm Enerzy Foam.', '{"surface": "Sân cỏ nhân tạo TF", "cushion": "MIZUNO ENERZY", "weight": "225g"}', 'MOI', NULL, 'ACTIVE'),
(69, 2, 7, 11, 'Giày bóng đá Kamito TA11 Pro TF', 'Đồng sáng tạo cùng tuyển thủ Nguyễn Tuấn Anh, form giày êm chân bền bỉ cực hợp sân 7.', '{"surface": "Sân cỏ nhân tạo TF", "upper": "KA-FIBER", "fit": "Form chân bè Việt Nam"}', 'MOI', NULL, 'ACTIVE'),
(70, 2, 7, 4, 'Giày bóng đá Nike Phantom GX Pro TF (Cũ 88%)', 'Hàng chính hãng đã qua sử dụng khoảng 10 trận sân 7, đinh còn rất sắc.', '{"surface": "Sân cỏ nhân tạo TF", "condition_grade": "88%"}', 'CU', 'Đinh dăm mòn nhẹ ~12%, mũi giày có vết xước nhỏ do sút bóng, keo đế nguyên zin chưa hở.', 'ACTIVE'),
(71, 3, 8, 4, 'Giày Tennis Nike Court Air Zoom Vapor 11', 'Thiết kế thấp sát mặt sân giúp chuyển hướng gắt và bứt tốc cực nhanh trên sân cứng.', '{"surface": "Hard Court", "cushion": "Forefoot Air Zoom", "profile": "Low-to-court"}', 'MOI', NULL, 'ACTIVE'),
(72, 3, 8, 4, 'Giày Tennis Nike Court Air Zoom GP Challenge Pro', 'Khung đế rộng vững chãi chống lật cổ chân tuyệt vời cho cả Tennis lẫn Pickleball.', '{"surface": "Hard Court / Pickleball", "stability": "Midfoot Plastic Plate"}', 'MOI', NULL, 'ACTIVE'),
(73, 3, 8, 4, 'Giày Tennis Nike Court Vapor Pro 2', 'Thoáng khí tối đa và bền bỉ cho những trận đấu kéo dài dưới trời nắng.', '{"surface": "Hard Court", "upper": "Reinforced Mesh", "cushion": "Air Zoom"}', 'MOI', NULL, 'ACTIVE'),
(74, 3, 8, 5, 'Giày Tennis Adidas Barricade 13', 'Biểu tượng độ bền và sự ổn định hàng đầu thế giới cho những tay vợt trượt cứu bóng.', '{"surface": "Hard Court", "midsole": "REPETITOR", "outsole": "Adiwear siêu bền"}', 'MOI', NULL, 'ACTIVE'),
(75, 3, 8, 5, 'Giày Tennis Adidas Adizero Ubersonic 4.1', 'Tối ưu tốc độ di chuyển nhẹ như bay với phần thân dệt ôm chân như tất.', '{"surface": "Hard Court", "midsole": "Lightstrike", "weight": "Siêu nhẹ"}', 'MOI', NULL, 'ACTIVE'),
(76, 3, 8, 5, 'Giày Tennis Adidas CourtJam Control 3', 'Mức giá dễ tiếp cận với đệm Bounce êm ái và khả năng chống xoắn bàn chân tốt.', '{"surface": "Hard Court", "midsole": "Bounce", "torsion": "Torsion System"}', 'MOI', NULL, 'ACTIVE'),
(77, 3, 8, 7, 'Giày Tennis Babolat Jet Mach 3 All Court', 'Đế cao su hợp tác cùng Michelin siêu bám sân kết hợp vải sợi Kevlar siêu nhẹ.', '{"outsole": "Michelin Premium Rubber", "upper": "Matryx EVO"}', 'MOI', NULL, 'ACTIVE'),
(78, 3, 8, 7, 'Giày Tennis Babolat Propulse Fury 3', 'Khóa chặt cổ chân chắc chắn cho lối chơi di chuyển mạnh mẽ và bùng nổ.', '{"outsole": "Michelin", "stability": "Power Belt ôm cổ chân"}', 'MOI', NULL, 'ACTIVE'),
(79, 3, 8, 6, 'Giày Tennis Wilson Rush Pro 4.0', 'Khung nâng đỡ 4D giảm xoắn bàn chân và tăng lực đẩy khi bật bước đầu tiên.', '{"chassis": "4D Support Chassis 2.0", "cushion": "Energy Cell EVA"}', 'MOI', NULL, 'ACTIVE'),
(80, 3, 8, 6, 'Giày Pickleball Wilson Viper Court Pro (Cũ 92%)', 'Form mũi rộng thoải mái, đế cao su Duralast chuyên sân ngoài trời.', '{"surface": "Hard Court / Pickleball", "fit": "Wide Toe Box", "condition_grade": "92%"}', 'CU', 'Mới đi 4 buổi tập Pickleball, đế còn mới 92%, thân giày sạch đẹp không rách.', 'ACTIVE'),
(81, 6, 19, 10, 'Giày bóng bàn Mizuno Wave Drive 9', 'Mẫu giày bóng bàn huyền thoại được giới vận động viên tin dùng nhờ độ bám sàn gỗ tuyệt đối.', '{"outsole": "XG Rubber", "midsole": "Mizuno Wave", "weight": "255g"}', 'MOI', NULL, 'ACTIVE'),
(82, 6, 19, 10, 'Giày bóng bàn Mizuno Wave Medal 7', 'Cải tiến đệm Enerzy êm ái hơn, hỗ trợ các bước di chuyển ngang tốc độ cao.', '{"midsole": "MIZUNO ENERZY", "stability": "Ổn định bước ngang"}', 'MOI', NULL, 'ACTIVE'),
(83, 6, 19, 10, 'Giày bóng bàn Mizuno Wave Drive Neo 3', 'Cảm giác chân trần nhạy bén nhất trong dòng giày bóng bàn Mizuno cao cấp.', '{"weight": "Siêu nhẹ", "fit": "Sock-like Prime Fit"}', 'MOI', NULL, 'ACTIVE'),
(84, 6, 19, 10, 'Giày bóng bàn Mizuno Crossmatch Sword', 'Đế phẳng chống trượt bền bỉ, lựa chọn kinh tế cho người chơi bóng bàn thường xuyên.', '{"outsole": "Non-marking Rubber", "level": "Phong trào / Tập luyện"}', 'MOI', NULL, 'ACTIVE'),
(85, 6, 19, 12, 'Giày bóng bàn Butterfly Lezoline Rifones', 'Flagship của Butterfly trang bị đầy đủ công nghệ giảm chấn và bám sàn thi đấu chuyên nghiệp.', '{"cushion": "B-Absorber", "outsole": "Wingrip", "stability": "STB chống xoắn"}', 'MOI', NULL, 'ACTIVE'),
(86, 6, 19, 12, 'Giày bóng bàn Butterfly Lezoline Gigu', 'Đế dày êm hơn giúp giảm áp lực lên đầu gối và cổ chân trong các buổi tập dài.', '{"cushion": "Thick B-Absorber", "outsole": "Wingrip"}', 'MOI', NULL, 'ACTIVE'),
(87, 6, 19, 12, 'Giày bóng bàn Butterfly Lezoline Vilata', 'Thiết kế thanh lịch, nhẹ nhàng và cực kỳ thoáng khí cho người chơi câu lạc bộ.', '{"weight": "Nhẹ linh hoạt", "upper": "Mesh thoáng khí"}', 'MOI', NULL, 'ACTIVE'),
(88, 6, 19, 2, 'Giày bóng bàn Lining APPU011', 'Đế cao su sống bám sàn tốt, form ôm gọn hỗ trợ đổi hướng nhanh.', '{"outsole": "Non-marking Gum", "upper": "Mesh + TPU"}', 'MOI', NULL, 'ACTIVE'),
(89, 6, 19, 2, 'Giày bóng bàn Lining APPT001 Pro', 'Tích hợp thanh chống xoắn vòm bàn chân PROBAR LOC cùng đệm BOUNSE+ đàn hồi.', '{"midsole": "BOUNSE+", "stability": "PROBAR LOC"}', 'MOI', NULL, 'ACTIVE'),
(90, 6, 19, 1, 'Giày trong nhà đa năng Yonex Strider Flow', 'Đôi giày đa năng êm ái dùng tốt cho cả bóng bàn, cầu lông và tập luyện trong nhà.', '{"midsole": "Power Cushion", "outsole": "Radial Blade"}', 'MOI', NULL, 'ACTIVE'),
(91, 1, 10, 1, 'Ống quả cầu lông Yonex Aerosensa 50 (AS50)', 'Chuẩn thi đấu Olympic và các giải BWF World Tour, quỹ đạo bay cực kỳ ổn định.', '{"material": "Lông ngỗng cao cấp", "speed": "77", "standard": "BWF Approved"}', 'MOI', NULL, 'ACTIVE'),
(92, 1, 10, 1, 'Ống quả cầu lông Yonex Aerosensa 40 (AS40)', 'Độ bền lông cao, cảm giác cầu đầm tay cho các trận đấu phong trào trình độ khá.', '{"material": "Lông ngỗng chọn lọc", "speed": "77"}', 'MOI', NULL, 'ACTIVE'),
(93, 1, 10, 1, 'Ống quả cầu lông Yonex Aerosensa 30 (AS30)', 'Lựa chọn bán chạy hàng đầu tại các câu lạc bộ cầu lông chuyên nghiệp.', '{"material": "Lông ngỗng tự nhiên", "speed": "77"}', 'MOI', NULL, 'ACTIVE'),
(94, 1, 10, 1, 'Ống quả cầu lông Yonex Aerosensa 20 (AS20)', 'Bay đều, ít tưa lông khi đánh đôi cường độ cao.', '{"material": "Lông vũ tự nhiên", "speed": "77"}', 'MOI', NULL, 'ACTIVE'),
(95, 1, 10, 1, 'Ống quả cầu lông Yonex Mavis 350 (Cầu nhựa)', 'Cầu nhựa siêu bền với tốc độ phục hồi tương đương cầu lông vũ, lý tưởng cho tập luyện.', '{"material": "Nylon cao cấp", "speed": "Medium (Xanh dương)"}', 'MOI', NULL, 'ACTIVE'),
(96, 1, 10, 3, 'Ống quả cầu lông Victor Master Ace', 'Dòng cầu cao cấp nhất của Victor dùng tại nhiều giải đấu quốc tế.', '{"material": "Lông ngỗng loại 1", "standard": "BWF Approved"}', 'MOI', NULL, 'ACTIVE'),
(97, 1, 10, 3, 'Ống quả cầu lông Victor Champion No.1', 'Cân bằng tuyệt vời giữa độ bền và cảm giác cầu, rất phổ biến tại Việt Nam.', '{"material": "Lông vịt tuyển chọn", "speed": "77"}', 'MOI', NULL, 'ACTIVE'),
(98, 1, 10, 3, 'Ống quả cầu lông Victor Lark 5', 'Đế bần ghép chắc chắn, chịu đập tốt phù hợp cho giao lưu câu lạc bộ.', '{"material": "Lông vịt bền bỉ", "speed": "77"}', 'MOI', NULL, 'ACTIVE'),
(99, 1, 10, 2, 'Ống quả cầu lông Lining A+300', 'Cầu thi đấu cao cấp của Li-Ning với độ ổn định quỹ đạo và độ bền vượt trội.', '{"material": "Lông ngỗng cao cấp", "standard": "BWF Approved"}', 'MOI', NULL, 'ACTIVE'),
(100, 1, 10, 2, 'Ống quả cầu lông Lining A+90', 'Đường cầu đầm chắc, thích hợp chơi trong nhà thi đấu có gió nhẹ.', '{"material": "Lông vịt chọn lọc", "speed": "77"}', 'MOI', NULL, 'ACTIVE'),
(101, 2, 11, 4, 'Quả bóng đá Nike Flight Premier League Match Ball', 'Bóng thi đấu chính thức giải Ngoại Hạng Anh với rãnh khí động học giảm liệng gió 30%.', '{"size": "Size 5", "tech": "Aerowsculpt", "standard": "FIFA Quality Pro"}', 'MOI', NULL, 'ACTIVE'),
(102, 2, 11, 4, 'Quả bóng đá Nike Academy Premier League', 'Vỏ bóng có rãnh định hướng ổn định cùng ruột cao su giữ hơi cực lâu.', '{"size": "Size 5", "tech": "Nike Aerowsculpt", "use": "Tập luyện & Thi đấu"}', 'MOI', NULL, 'ACTIVE'),
(103, 2, 11, 4, 'Quả bóng đá Nike Pitch Training', 'Thiết kế họa tiết tương phản cao dễ quan sát bóng khi đá buổi tối trên sân nhân tạo.', '{"size": "Size 5", "construction": "12 miếng khâu máy"}', 'MOI', NULL, 'ACTIVE'),
(104, 2, 11, 5, 'Quả bóng đá Adidas UCL Pro Match Ball', 'Bóng thi đấu chính thức UEFA Champions League với hoa văn ngôi sao kinh điển.', '{"size": "Size 5", "construction": "Ép nhiệt không đường may", "standard": "FIFA Quality Pro"}', 'MOI', NULL, 'ACTIVE'),
(105, 2, 11, 5, 'Quả bóng đá Adidas Al Rihla Pro World Cup', 'Cấu trúc 20 miếng ép nhiệt cho quỹ đạo bay cực nhanh và chính xác.', '{"size": "Size 5", "tech": "CRT-CORE + Speedshell", "standard": "FIFA Quality Pro"}', 'MOI', NULL, 'ACTIVE'),
(106, 2, 11, 5, 'Quả bóng đá Adidas Fussballliebe Euro 2024 Pro', 'Bóng thi đấu chính thức Euro 2024 với bề mặt vân nổi tăng độ kiểm soát.', '{"size": "Size 5", "tech": "PRECISIONSHELL", "standard": "FIFA Quality Pro"}', 'MOI', NULL, 'ACTIVE'),
(107, 2, 11, 5, 'Quả bóng đá Adidas Tiro League Thermally Bonded', 'Bóng ép nhiệt không ngấm nước khi trời mưa, độ nảy cực kỳ chuẩn xác.', '{"size": "Size 5", "construction": "Ép nhiệt chống thấm nước", "standard": "IMS Certified"}', 'MOI', NULL, 'ACTIVE'),
(108, 2, 11, 11, 'Quả bóng đá Kamito KMB Pro Size 5', 'Da PU mềm êm chân, chịu mài mòn tốt trên mặt cỏ nhân tạo và sân 7.', '{"size": "Size 5", "material": "Da PU cao cấp", "use": "Sân cỏ nhân tạo"}', 'MOI', NULL, 'ACTIVE'),
(109, 2, 11, 11, 'Quả bóng đá Kamito Futsal Size 4', 'Chuyên dụng cho sân 5 và sàn gỗ Futsal với độ nảy đầm dễ xử lý kỹ thuật.', '{"size": "Size 4 (Futsal)", "bounce": "Độ nảy thấp chuẩn Futsal"}', 'MOI', NULL, 'ACTIVE'),
(110, 2, 11, 5, 'Quả bóng đá Adidas Conext 24 League', 'Cấu trúc không đường may TSBE giúp chạm bóng mượt và hạn chế thấm nước.', '{"size": "Size 5", "construction": "TSBE Seamless", "standard": "FIFA Quality"}', 'MOI', NULL, 'ACTIVE'),
(111, 3, 12, 6, 'Lon bóng Tennis Wilson US Open Extra Duty (3 quả)', 'Bóng thi đấu chính thức giải Grand Slam US Open, nỉ dày cực bền trên sân cứng.', '{"felt": "Tex/Tech Extra Duty", "standard": "ITF & USTA Approved"}', 'MOI', NULL, 'ACTIVE'),
(112, 3, 12, 6, 'Lon bóng Tennis Wilson Roland Garros All Court (4 quả)', 'Bóng thi đấu giải Pháp Mở Rộng với lõi giữ áp suất cao và độ nảy đồng đều.', '{"felt": "All Court Felt", "standard": "ITF Approved"}', 'MOI', NULL, 'ACTIVE'),
(113, 3, 12, 6, 'Lon bóng Tennis Wilson Championship Extra Duty (3 quả)', 'Dòng bóng phổ thông bán chạy nhất của Wilson, giữ hơi tốt và giá hợp lý.', '{"felt": "Dura-Weave Felt", "use": "Tập luyện & Thi đấu phong trào"}', 'MOI', NULL, 'ACTIVE'),
(114, 3, 12, 6, 'Lon bóng Tennis Wilson Triniti Pro (4 quả)', 'Lõi đàn hồi tiên tiến giúp bóng tươi mới lâu gấp 4 lần bóng nén khí thông thường.', '{"core": "Engage Core (Hộp giấy sinh thái)", "durability": "Giữ độ nảy lâu gấp 4 lần"}', 'MOI', NULL, 'ACTIVE'),
(115, 3, 12, 7, 'Lon bóng Tennis Babolat Gold Championship (4 quả)', 'Cảm giác đánh êm tay, lớp nỉ dệt chặt hạn chế xù lông nhanh.', '{"surface": "All Court", "standard": "ITF Approved"}', 'MOI', NULL, 'ACTIVE'),
(116, 3, 12, 7, 'Lon bóng Tennis Babolat Team All Court (4 quả)', 'Bóng nén áp suất cao kết hợp độ bền ấn tượng cho các trận đánh đơn kéo dài.', '{"felt": "Extra Feel Felt", "standard": "ITF Approved"}', 'MOI', NULL, 'ACTIVE'),
(117, 3, 12, 7, 'Lon bóng Tennis Babolat Gold Academy (3 quả)', 'Lý tưởng cho huấn luyện viên và học viên tập luyện nhiều giờ liên tục.', '{"type": "Bóng không áp suất bền bỉ", "use": "Luyện tập giỏ bóng"}', 'MOI', NULL, 'ACTIVE'),
(118, 3, 12, 1, 'Lon bóng Tennis Yonex Tour Platinum (4 quả)', 'Bóng cao cấp nhất của Yonex với nỉ len dệt dày cho cảm giác bóng êm và chính xác.', '{"felt": "Woven Wool Felt", "standard": "ITF Approved"}', 'MOI', NULL, 'ACTIVE'),
(119, 3, 12, 1, 'Lon bóng Tennis Yonex Championship (3 quả)', 'Độ nảy ổn định, dễ kiểm soát trên nhiều loại mặt sân khác nhau.', '{"surface": "All Court", "standard": "ITF Approved"}', 'MOI', NULL, 'ACTIVE'),
(120, 3, 12, 6, 'Lon bóng Tennis Wilson Starter Red (3 quả - Trẻ em)', 'Bóng xốp nhẹ tốc độ chậm giúp trẻ em dễ dàng làm quen kỹ thuật đánh bóng.', '{"speed": "Chậm hơn 75%", "use": "Trẻ em & Người mới tập"}', 'MOI', NULL, 'ACTIVE'),
(121, 4, 13, 9, 'Hộp 3 quả bóng Pickleball Joola Primo Outdoor', 'Bóng thi đấu ngoài trời 40 lỗ chuẩn xác, bay ổn định trước gió.', '{"holes": "40 lỗ khoan", "standard": "USAPA Approved", "use": "Ngoài trời"}', 'MOI', NULL, 'ACTIVE'),
(122, 4, 13, 9, 'Hộp 4 quả bóng Pickleball Joola Heleus Outdoor', 'Công nghệ đúc nguyên khối hạn chế nứt vỡ khi đánh mạnh liên tục.', '{"holes": "40 lỗ đúc nguyên khối", "standard": "USAPA Approved"}', 'MOI', NULL, 'ACTIVE'),
(123, 4, 13, 9, 'Hộp 12 quả bóng Pickleball Joola Primo Pack', 'Gói tiết kiệm 12 quả chính hãng Joola cho câu lạc bộ và nhóm chơi thường xuyên.', '{"holes": "40 lỗ", "quantity": "12 quả / hộp"}', 'MOI', NULL, 'ACTIVE'),
(124, 4, 13, 9, 'Hộp 3 quả bóng Pickleball Joola Indoor 26 lỗ', 'Thiết kế 26 lỗ lớn hơn giúp kiểm soát bóng tốt trên mặt sàn gỗ/nhựa trong nhà.', '{"holes": "26 lỗ", "use": "Sân trong nhà"}', 'MOI', NULL, 'ACTIVE'),
(125, 4, 13, 8, 'Hộp 4 quả bóng Pickleball Selkirk Pro S1', 'Nổi tiếng với độ bền hàng đầu thị trường và quỹ đạo bay nhất quán.', '{"holes": "38 lỗ chuẩn lực", "durability": "Chống nứt vượt trội"}', 'MOI', NULL, 'ACTIVE'),
(126, 4, 13, 8, 'Hộp 12 quả bóng Pickleball Selkirk Pro S1', 'Quy cách 12 quả tiết kiệm dành cho các buổi luyện tập và giải đấu phong trào.', '{"holes": "38 lỗ", "quantity": "12 quả / hộp"}', 'MOI', NULL, 'ACTIVE'),
(127, 4, 13, 8, 'Hộp 3 quả bóng Pickleball Selkirk SLK Hybrid+', 'Dòng bóng đa năng chơi ổn định cả trên sân ngoài trời lẫn nhà thi đấu.', '{"holes": "40 lỗ", "use": "Trong nhà & Ngoài trời"}', 'MOI', NULL, 'ACTIVE'),
(128, 4, 13, 8, 'Túi 100 quả bóng Pickleball Selkirk Pro S1 Bucket', 'Giải pháp tối ưu cho học viện và cụm sân Pickleball chuyên nghiệp.', '{"holes": "38 lỗ", "quantity": "100 quả / thùng"}', 'MOI', NULL, 'ACTIVE'),
(129, 4, 13, 11, 'Hộp 3 quả bóng Pickleball Kamito Outdoor 40 lỗ', 'Đạt chuẩn kích thước và trọng lượng thi đấu với mức giá cực kỳ kinh tế.', '{"holes": "40 lỗ", "diameter": "74mm", "weight": "26g"}', 'MOI', NULL, 'ACTIVE'),
(130, 4, 13, 11, 'Hộp 6 quả bóng Pickleball Kamito Pro Training', 'Nhựa TPE đàn hồi dẻo dai, ít biến dạng khi thi đấu dưới nắng nóng.', '{"holes": "40 lỗ", "quantity": "6 quả / hộp"}', 'MOI', NULL, 'ACTIVE'),
(131, 6, 20, 13, 'Hộp 10 quả bóng bàn DHS D40+ 3 sao ITTF', 'Bóng thi đấu phổ biến nhất thế giới với độ tròn chuẩn xác và độ nảy đồng nhất.', '{"diameter": "40+ ABS", "grade": "3 Sao ITTF Approved"}', 'MOI', NULL, 'ACTIVE'),
(132, 6, 20, 13, 'Hộp 6 quả bóng bàn DHS DJ40+ WTT 3 sao', 'Phiên bản bóng thi đấu chính thức tại các giải World Table Tennis (WTT).', '{"diameter": "40+ ABS cao cấp", "standard": "WTT Official Match Ball"}', 'MOI', NULL, 'ACTIVE'),
(133, 6, 20, 13, 'Hộp 6 quả bóng bàn DHS RS40+ 3 sao', 'Vỏ bóng dày dặn chống móp méo tốt, âm thanh chạm vợt giòn rõ.', '{"diameter": "40+ ABS", "grade": "3 Sao ITTF"}', 'MOI', NULL, 'ACTIVE'),
(134, 6, 20, 13, 'Hộp 100 quả bóng bàn tập luyện DHS 1 sao 40+', 'Chuyên dụng cho tập nhiều bóng và máy bắn bóng tại các câu lạc bộ.', '{"diameter": "40+ ABS", "quantity": "100 quả / hộp"}', 'MOI', NULL, 'ACTIVE'),
(135, 6, 20, 12, 'Hộp 3 quả bóng bàn Butterfly R40+ 3 sao ITTF', 'Độ cân bằng tuyệt hảo và độ nảy ổn định cao chuẩn giải đấu chuyên nghiệp.', '{"diameter": "40+ ABS", "origin": "Trung Quốc (Chuẩn Nhật)", "grade": "3 Sao ITTF"}', 'MOI', NULL, 'ACTIVE'),
(136, 6, 20, 12, 'Hộp 12 quả bóng bàn Butterfly R40+ 3 sao', 'Hộp 12 quả chính hãng Butterfly giúp tiết kiệm chi phí cho đội tuyển.', '{"diameter": "40+ ABS", "quantity": "12 quả / hộp"}', 'MOI', NULL, 'ACTIVE'),
(137, 6, 20, 12, 'Hộp 3 quả bóng bàn Butterfly A40+ 3 sao', 'Bề mặt bóng mịn đều giúp tạo xoáy chuẩn xác trong từng pha giao bóng.', '{"diameter": "40+ ABS", "grade": "3 Sao ITTF"}', 'MOI', NULL, 'ACTIVE'),
(138, 6, 20, 12, 'Hộp 6 quả bóng bàn tập luyện Butterfly Training 40+', 'Độ bền cao và cảm giác gần sát bóng thi đấu 3 sao.', '{"diameter": "40+ ABS", "use": "Tập luyện câu lạc bộ"}', 'MOI', NULL, 'ACTIVE'),
(139, 6, 20, 2, 'Hộp 6 quả bóng bàn Lining 3 sao 40+ ITTF', 'Bóng nhựa ABS không đường may cho quỹ đạo bay mượt mà ổn định.', '{"diameter": "40+ ABS", "grade": "3 Sao ITTF"}', 'MOI', NULL, 'ACTIVE'),
(140, 6, 20, 13, 'Hộp 10 quả bóng bàn DHS D40+ 3 sao màu Cam', 'Màu cam dễ nhìn hơn trong phòng tập ánh sáng trắng hoặc tường sáng màu.', '{"diameter": "40+ ABS", "color": "Cam nổi bật"}', 'MOI', NULL, 'ACTIVE'),
(141, 1, 15, 1, 'Áo cầu lông Yonex Tournament Pro 10519', 'Công nghệ VeryCOOL chứa Xylitol tự nhiên giúp làm mát cơ thể tức thì khi thi đấu.', '{"material": "100% Polyester", "tech": "VeryCOOL Dry giảm 3°C"}', 'MOI', NULL, 'ACTIVE'),
(142, 1, 15, 1, 'Áo cầu lông Yonex National Team 2024', 'Form áo thi đấu đội tuyển thoáng khí, đường may raglan hỗ trợ vung tay linh hoạt.', '{"material": "Polyester co giãn 4 chiều", "tech": "UV Reduction + Sweat Absorbent"}', 'MOI', NULL, 'ACTIVE'),
(143, 1, 15, 2, 'Áo cầu lông Lining AAYT015 Dry-Fit', 'Vải siêu nhẹ nhanh khô giúp cơ thể luôn thoải mái trong suốt set đấu căng thẳng.', '{"material": "Polyester", "tech": "AT DRY thấm hút nhanh"}', 'MOI', NULL, 'ACTIVE'),
(144, 1, 15, 3, 'Áo cầu lông Victor T-40005 Competition', 'Họa tiết hình học năng động, thấm hút mồ hôi nhanh và không bết dính da.', '{"material": "100% Recycled Polyester", "tech": "PerfectDRY"}', 'MOI', NULL, 'ACTIVE'),
(145, 2, 15, 4, 'Áo đấu bóng đá Nike Dri-FIT Strike Jersey', 'Áo tập luyện và thi đấu bóng đá chính hãng Nike với lưới thoát khí dọc hai bên sườn.', '{"material": "100% Polyester", "tech": "Nike Dri-FIT"}', 'MOI', NULL, 'ACTIVE'),
(146, 2, 15, 4, 'Áo bóng đá Nike Chelsea Home 2024/25', 'Phiên bản sân nhà chính hãng với họa tiết sóng nước đặc trưng và vải thoáng khí.', '{"material": "Dri-FIT ADV", "fit": "Stadium Fit"}', 'MOI', NULL, 'ACTIVE'),
(147, 2, 15, 5, 'Áo đấu bóng đá Adidas Real Madrid Home 2024/25', 'Thiết kế trắng cổ điển thanh lịch của đội bóng Hoàng Gia với công nghệ hút ẩm AEROREADY.', '{"material": "100% Recycled Polyester", "tech": "AEROREADY"}', 'MOI', NULL, 'ACTIVE'),
(148, 2, 15, 5, 'Áo thể thao Adidas Tiro 24 Training Jersey', '3 sọc đặc trưng dọc vai, form dáng thể thao hiện đại phù hợp mọi môn vận động.', '{"material": "Polyester Interlock", "tech": "AEROREADY"}', 'MOI', NULL, 'ACTIVE'),
(149, 2, 15, 11, 'Bộ quần áo bóng đá Kamito Galaxy', 'Vải mè kim thoáng mát, in chuyển nhiệt sắc nét không bong tróc khi giặt máy.', '{"material": "Vải mè thể thao cao cấp", "fit": "Form Việt Nam"}', 'MOI', NULL, 'ACTIVE'),
(150, 1, 15, 1, 'Quần short cầu lông Yonex 15140 Pro', 'Cạp chun êm ái, túi quần sâu giữ bóng chắc chắn cho cả cầu lông và tennis.', '{"material": "Polyester co giãn", "tech": "VeryCOOL + Túi sâu"}', 'MOI', NULL, 'ACTIVE'),
(151, 1, 16, 1, 'Túi vợt cầu lông Yonex Pro Tournament 92431W', 'Dáng túi chữ nhật cứng cáp chuyên nghiệp với lớp lót cách nhiệt bảo vệ cước vợt.', '{"capacity": "6-9 cây vợt", "material": "Polyester + PU chống nước", "compartments": "2 ngăn lớn + ngăn giày"}', 'MOI', NULL, 'ACTIVE'),
(152, 1, 16, 1, 'Balo cầu lông Yonex Pro Backpack B 92412', 'Balo đa năng gọn nhẹ có ngăn đựng giày thông gió dưới đáy và quai đeo êm vai.', '{"capacity": "2-3 cây vợt + ngăn giày riêng", "dimensions": "31 x 20 x 47 cm"}', 'MOI', NULL, 'ACTIVE'),
(153, 1, 16, 2, 'Túi vợt cầu lông Lining ABJT059 6 ngăn', 'Chất liệu da PU trượt nước dễ vệ sinh, ngăn chứa rộng rãi cho cả ống cầu và quần áo.', '{"capacity": "6 cây vợt", "lining": "Lớp bạc cách nhiệt Thermo"}', 'MOI', NULL, 'ACTIVE'),
(154, 1, 16, 2, 'Balo cầu lông Lining ABSU387', 'Phong cách tối giản thanh lịch, dùng linh hoạt từ văn phòng ra thẳng sân cầu.', '{"capacity": "2 cây vợt + ngăn laptop 15.6 inch"}', 'MOI', NULL, 'ACTIVE'),
(155, 1, 16, 3, 'Túi vợt cầu lông Victor BR9613 Rectangular', 'Form hộp vuông vắn giữ phom túi cực đẹp, khóa kéo kim loại bền bỉ.', '{"capacity": "6 cây vợt", "material": "PU + Polyester cao cấp"}', 'MOI', NULL, 'ACTIVE'),
(156, 3, 16, 6, 'Balo Tennis Wilson Tour Backpack', 'Balo thiết kế chuyên biệt cho người chơi Tennis với ngăn vợt đệm êm và ngăn phụ kiện.', '{"capacity": "2 cây vợt Tennis", "compartments": "Ngăn vợt khóa chống trượt + ngăn giày"}', 'MOI', NULL, 'ACTIVE'),
(157, 3, 16, 6, 'Túi Tennis Wilson Super Tour 9 Pack', 'Lớp lót Thermoguard bảo vệ khung và dây cước trước nhiệt độ nắng nóng ngoài sân.', '{"capacity": "9 cây vợt", "tech": "Thermoguard 2.0"}', 'MOI', NULL, 'ACTIVE'),
(158, 3, 16, 7, 'Balo Tennis Babolat Pure Aero Backpack', 'Ngăn chứa vợt cách nhiệt thông minh có thể gập gọn khi không mang vợt.', '{"capacity": "3 cây vợt", "volume": "32L"}', 'MOI', NULL, 'ACTIVE'),
(159, 4, 16, 9, 'Balo Pickleball Joola Vision II Deluxe', 'Tích hợp sẵn móc treo hàng rào tiện lợi cùng hơn 10 ngăn nhỏ đựng bóng và phụ kiện.', '{"capacity": "4 vợt Pickleball + ngăn giày thông khí", "hook": "Móc treo hàng rào sân"}', 'MOI', NULL, 'ACTIVE'),
(160, 2, 16, 4, 'Túi trống thể thao Nike Brasilia 9.5 Medium (60L)', 'Túi trống rộng rãi đựng trọn bộ giày bóng đá, bóng, quần áo và bình nước.', '{"volume": "60L", "material": "Polyester chống nước đáy túi"}', 'MOI', NULL, 'ACTIVE');

-- 6. SKUs (216 biến thể)
INSERT INTO `product_skus` (`id`, `product_id`, `sku_code`, `size`, `color`, `price`, `stock`, `unit`, `quantity_per_lot`) VALUES
(1, 1, 'TS-C02-P001-A', '4U/G5', 'Đen Bạc', 4250000.00, 18, 'CHIEC', 1),
(2, 1, 'TS-C02-P001-B', '3U/G5', 'Đen Bạc', 4250000.00, 12, 'CHIEC', 1),
(3, 2, 'TS-C02-P002-A', '4U/G5', 'Vàng Đen', 4350000.00, 18, 'CHIEC', 1),
(4, 2, 'TS-C02-P002-B', '3U/G5', 'Vàng Đen', 4350000.00, 12, 'CHIEC', 1),
(5, 3, 'TS-C02-P003-A', '4U/G5', 'Đỏ Kurenai', 4650000.00, 18, 'CHIEC', 1),
(6, 3, 'TS-C02-P003-B', '3U/G5', 'Đỏ Kurenai', 4650000.00, 12, 'CHIEC', 1),
(7, 4, 'TS-C02-P004-A', '4U/G5', 'Xám Đỏ', 4150000.00, 18, 'CHIEC', 1),
(8, 4, 'TS-C02-P004-B', '3U/G5', 'Xám Đỏ', 4150000.00, 12, 'CHIEC', 1),
(9, 5, 'TS-C02-P005-A', '4U/G5', 'Đỏ Hổ', 3950000.00, 18, 'CHIEC', 1),
(10, 5, 'TS-C02-P005-B', '3U/G5', 'Đỏ Hổ', 3950000.00, 12, 'CHIEC', 1),
(11, 6, 'TS-C02-P006-A', '4U/G5', 'Xanh Hồng', 3800000.00, 18, 'CHIEC', 1),
(12, 6, 'TS-C02-P006-B', '3U/G5', 'Xanh Hồng', 3800000.00, 12, 'CHIEC', 1),
(13, 7, 'TS-C02-P007-A', '4U/G6', 'Xanh Dương', 4100000.00, 18, 'CHIEC', 1),
(14, 7, 'TS-C02-P007-B', '3U/G5', 'Xanh Dương', 4100000.00, 12, 'CHIEC', 1),
(15, 8, 'TS-C02-P008-A', '4U/G5', 'Tím Đen', 3750000.00, 18, 'CHIEC', 1),
(16, 8, 'TS-C02-P008-B', '3U/G5', 'Tím Đen', 3750000.00, 12, 'CHIEC', 1),
(17, 9, 'TS-C02-P009-A', '4U/G6', 'Đen Vàng', 3850000.00, 18, 'CHIEC', 1),
(18, 9, 'TS-C02-P009-B', '3U/G5', 'Đen Vàng', 3850000.00, 12, 'CHIEC', 1),
(19, 10, 'TS-C02-P010-A', '3U/G5', 'Đen Xanh', 2450000.00, 1, 'CHIEC', 1),
(20, 11, 'TS-C03-P011-A', 'Grip 2', 'Đồng Đen', 5600000.00, 18, 'CHIEC', 1),
(21, 12, 'TS-C03-P012-A', 'Grip 2', 'Xanh Ngọc Lục Bảo', 5450000.00, 18, 'CHIEC', 1),
(22, 13, 'TS-C03-P013-A', 'Grip 2', 'Đỏ Đen', 4950000.00, 18, 'CHIEC', 1),
(23, 14, 'TS-C03-P014-A', 'Grip 2', 'Trắng Bạc', 5250000.00, 18, 'CHIEC', 1),
(24, 15, 'TS-C03-P015-A', 'Grip 2', 'Vàng Đen', 5200000.00, 18, 'CHIEC', 1),
(25, 16, 'TS-C03-P016-A', 'Grip 2', 'Xanh Navy', 4890000.00, 18, 'CHIEC', 1),
(26, 17, 'TS-C03-P017-A', 'Grip 2', 'Trắng Đỏ Cam', 5100000.00, 18, 'CHIEC', 1),
(27, 18, 'TS-C03-P018-A', 'Grip 2', 'Xanh Biển', 4990000.00, 18, 'CHIEC', 1),
(28, 19, 'TS-C03-P019-A', 'Grip 2', 'Đỏ Tươi', 5150000.00, 18, 'CHIEC', 1),
(29, 20, 'TS-C03-P020-A', 'Grip 2', 'Xanh Ánh Tím', 2950000.00, 1, 'CHIEC', 1),
(30, 21, 'TS-C04-P021-A', '16mm', 'Đen Xanh', 6490000.00, 18, 'CHIEC', 1),
(31, 22, 'TS-C04-P022-A', '16mm', 'Đen Xanh Dương', 5800000.00, 18, 'CHIEC', 1),
(32, 23, 'TS-C04-P023-A', '14mm', 'Đen Đỏ', 5750000.00, 18, 'CHIEC', 1),
(33, 24, 'TS-C04-P024-A', '16mm', 'Đen Viền Xám', 5490000.00, 18, 'CHIEC', 1),
(34, 25, 'TS-C04-P025-A', '13mm', 'Đỏ Đen', 5900000.00, 18, 'CHIEC', 1),
(35, 26, 'TS-C04-P026-A', '20mm', 'Xanh Dương Trắng', 6150000.00, 18, 'CHIEC', 1),
(36, 27, 'TS-C04-P027-A', '16mm', 'Đen Vàng', 3490000.00, 18, 'CHIEC', 1),
(37, 28, 'TS-C04-P028-A', '13mm', 'Xanh Trắng', 2150000.00, 18, 'CHIEC', 1),
(38, 29, 'TS-C04-P029-A', '16mm', 'Đen Cam', 2490000.00, 18, 'CHIEC', 1),
(39, 30, 'TS-C04-P030-A', '13mm', 'Đen Đỏ', 2050000.00, 1, 'CHIEC', 1),
(40, 31, 'TS-C17-P031-A', 'FL', 'Gỗ / Xanh', 4150000.00, 18, 'CHIEC', 1),
(41, 32, 'TS-C17-P032-A', 'FL', 'Gỗ / Xanh Tím', 3950000.00, 18, 'CHIEC', 1),
(42, 33, 'TS-C17-P033-A', 'FL', 'Gỗ / Xanh Đen', 4250000.00, 18, 'CHIEC', 1),
(43, 34, 'TS-C17-P034-A', 'FL', 'Gỗ / Đen Vàng', 4100000.00, 18, 'CHIEC', 1),
(44, 35, 'TS-C17-P035-A', 'FL', 'Gỗ Hinoki', 3850000.00, 18, 'CHIEC', 1),
(45, 36, 'TS-C17-P036-A', 'FL', 'Gỗ / Vàng Đỏ', 4350000.00, 18, 'CHIEC', 1),
(46, 37, 'TS-C17-P037-A', 'FL', 'Gỗ / Xanh Đỏ', 1950000.00, 18, 'CHIEC', 1),
(47, 38, 'TS-C17-P038-A', 'FL', 'Gỗ / Xanh Dương', 1650000.00, 18, 'CHIEC', 1),
(48, 39, 'TS-C17-P039-A', 'FL', 'Đỏ Đen', 650000.00, 18, 'CHIEC', 1),
(49, 40, 'TS-C17-P040-A', 'FL', 'Gỗ Tự Nhiên', 1250000.00, 1, 'CHIEC', 1),
(50, 41, 'TS-C18-P041-A', '2.1mm', 'Đỏ / Đen', 1650000.00, 18, 'CHIEC', 1),
(51, 42, 'TS-C18-P042-A', '2.1mm', 'Đỏ / Đen', 2150000.00, 18, 'CHIEC', 1),
(52, 43, 'TS-C18-P043-A', '2.1mm', 'Đỏ / Đen', 2100000.00, 18, 'CHIEC', 1),
(53, 44, 'TS-C18-P044-A', '2.1mm', 'Đỏ / Đen', 980000.00, 18, 'CHIEC', 1),
(54, 45, 'TS-C18-P045-A', '2.1mm', 'Đỏ / Đen', 1650000.00, 18, 'CHIEC', 1),
(55, 46, 'TS-C18-P046-A', '2.1mm', 'Đỏ / Đen', 1050000.00, 18, 'CHIEC', 1),
(56, 47, 'TS-C18-P047-A', '2.15mm', 'Đen 39°', 680000.00, 18, 'CHIEC', 1),
(57, 48, 'TS-C18-P048-A', '2.15mm', 'Đen Lót Xanh', 1950000.00, 18, 'CHIEC', 1),
(58, 49, 'TS-C18-P049-A', '2.1mm', 'Đỏ 37°', 790000.00, 18, 'CHIEC', 1),
(59, 50, 'TS-C18-P050-A', '2.1mm', 'Đỏ / Đen', 890000.00, 18, 'CHIEC', 1),
(60, 51, 'TS-C06-P051-A', '41', 'Trắng Đỏ', 2650000.00, 18, 'CHIEC', 1),
(61, 51, 'TS-C06-P051-B', '42', 'Trắng Đỏ', 2650000.00, 12, 'CHIEC', 1),
(62, 52, 'TS-C06-P052-A', '41', 'Xanh Mint', 2950000.00, 18, 'CHIEC', 1),
(63, 52, 'TS-C06-P052-B', '42', 'Xanh Mint', 2950000.00, 12, 'CHIEC', 1),
(64, 53, 'TS-C06-P053-A', '42', 'Trắng Vàng', 2850000.00, 18, 'CHIEC', 1),
(65, 53, 'TS-C06-P053-B', '40', 'Trắng Vàng', 2850000.00, 12, 'CHIEC', 1),
(66, 54, 'TS-C06-P054-A', '41', 'Đen Đỏ', 2790000.00, 18, 'CHIEC', 1),
(67, 54, 'TS-C06-P054-B', '42', 'Đen Đỏ', 2790000.00, 12, 'CHIEC', 1),
(68, 55, 'TS-C06-P055-A', '41', 'Trắng Xanh', 2450000.00, 18, 'CHIEC', 1),
(69, 55, 'TS-C06-P055-B', '42', 'Trắng Xanh', 2450000.00, 12, 'CHIEC', 1),
(70, 56, 'TS-C06-P056-A', '41', 'Trắng Đen', 2350000.00, 18, 'CHIEC', 1),
(71, 56, 'TS-C06-P056-B', '42', 'Trắng Đen', 2350000.00, 12, 'CHIEC', 1),
(72, 57, 'TS-C06-P057-A', '41', 'Trắng Xanh Navy', 2590000.00, 18, 'CHIEC', 1),
(73, 57, 'TS-C06-P057-B', '42', 'Trắng Xanh Navy', 2590000.00, 12, 'CHIEC', 1),
(74, 58, 'TS-C06-P058-A', '42', 'Trắng Tím', 2890000.00, 18, 'CHIEC', 1),
(75, 58, 'TS-C06-P058-B', '40', 'Trắng Tím', 2890000.00, 12, 'CHIEC', 1),
(76, 59, 'TS-C06-P059-A', '41', 'Trắng Xanh Dương', 2550000.00, 18, 'CHIEC', 1),
(77, 59, 'TS-C06-P059-B', '42', 'Trắng Xanh Dương', 2550000.00, 12, 'CHIEC', 1),
(78, 60, 'TS-C06-P060-A', '41', 'Trắng Đỏ', 1390000.00, 1, 'CHIEC', 1),
(79, 61, 'TS-C07-P061-A', '41', 'Đỏ Cam', 2850000.00, 18, 'CHIEC', 1),
(80, 61, 'TS-C07-P061-B', '42', 'Đỏ Cam', 2850000.00, 12, 'CHIEC', 1),
(81, 62, 'TS-C07-P062-A', '41', 'Trắng Xanh', 2790000.00, 18, 'CHIEC', 1),
(82, 62, 'TS-C07-P062-B', '42', 'Trắng Xanh', 2790000.00, 12, 'CHIEC', 1),
(83, 63, 'TS-C07-P063-A', '41', 'Đen Trắng', 2890000.00, 18, 'CHIEC', 1),
(84, 63, 'TS-C07-P063-B', '42', 'Đen Trắng', 2890000.00, 12, 'CHIEC', 1),
(85, 64, 'TS-C07-P064-A', '41', 'Đen Đỏ Trắng', 3100000.00, 18, 'CHIEC', 1),
(86, 64, 'TS-C07-P064-B', '42', 'Đen Đỏ Trắng', 3100000.00, 12, 'CHIEC', 1),
(87, 65, 'TS-C07-P065-A', '41', 'Trắng Đỏ Xanh', 2950000.00, 18, 'CHIEC', 1),
(88, 65, 'TS-C07-P065-B', '42', 'Trắng Đỏ Xanh', 2950000.00, 12, 'CHIEC', 1),
(89, 66, 'TS-C07-P066-A', '41', 'Trắng Xanh Navy', 2690000.00, 18, 'CHIEC', 1),
(90, 66, 'TS-C07-P066-B', '42', 'Trắng Xanh Navy', 2690000.00, 12, 'CHIEC', 1),
(91, 67, 'TS-C07-P067-A', '41', 'Trắng Đỏ', 2990000.00, 18, 'CHIEC', 1),
(92, 67, 'TS-C07-P067-B', '42', 'Trắng Đỏ', 2990000.00, 12, 'CHIEC', 1),
(93, 68, 'TS-C07-P068-A', '41', 'Trắng Vàng', 2850000.00, 18, 'CHIEC', 1),
(94, 68, 'TS-C07-P068-B', '42', 'Trắng Vàng', 2850000.00, 12, 'CHIEC', 1),
(95, 69, 'TS-C07-P069-A', '41', 'Trắng Xanh', 850000.00, 18, 'CHIEC', 1),
(96, 69, 'TS-C07-P069-B', '42', 'Trắng Xanh', 850000.00, 12, 'CHIEC', 1),
(97, 70, 'TS-C07-P070-A', '41', 'Xanh Hồng', 1350000.00, 1, 'CHIEC', 1),
(98, 71, 'TS-C08-P071-A', '41', 'Trắng Xanh', 3650000.00, 18, 'CHIEC', 1),
(99, 71, 'TS-C08-P071-B', '42', 'Trắng Xanh', 3650000.00, 12, 'CHIEC', 1),
(100, 72, 'TS-C08-P072-A', '41', 'Trắng Cam', 3200000.00, 18, 'CHIEC', 1),
(101, 72, 'TS-C08-P072-B', '42', 'Trắng Cam', 3200000.00, 12, 'CHIEC', 1),
(102, 73, 'TS-C08-P073-A', '41', 'Trắng Đen', 3150000.00, 18, 'CHIEC', 1),
(103, 73, 'TS-C08-P073-B', '42', 'Trắng Đen', 3150000.00, 12, 'CHIEC', 1),
(104, 74, 'TS-C08-P074-A', '42', 'Trắng Đen Đỏ', 3690000.00, 18, 'CHIEC', 1),
(105, 74, 'TS-C08-P074-B', '40', 'Trắng Đen Đỏ', 3690000.00, 12, 'CHIEC', 1),
(106, 75, 'TS-C08-P075-A', '41', 'Trắng Xanh', 3490000.00, 18, 'CHIEC', 1),
(107, 75, 'TS-C08-P075-B', '42', 'Trắng Xanh', 3490000.00, 12, 'CHIEC', 1),
(108, 76, 'TS-C08-P076-A', '41', 'Trắng Navy', 2350000.00, 18, 'CHIEC', 1),
(109, 76, 'TS-C08-P076-B', '42', 'Trắng Navy', 2350000.00, 12, 'CHIEC', 1),
(110, 77, 'TS-C08-P077-A', '41', 'Xanh Đen', 3550000.00, 18, 'CHIEC', 1),
(111, 77, 'TS-C08-P077-B', '42', 'Xanh Đen', 3550000.00, 12, 'CHIEC', 1),
(112, 78, 'TS-C08-P078-A', '42', 'Trắng Đỏ', 3390000.00, 18, 'CHIEC', 1),
(113, 78, 'TS-C08-P078-B', '40', 'Trắng Đỏ', 3390000.00, 12, 'CHIEC', 1),
(114, 79, 'TS-C08-P079-A', '41', 'Trắng Đỏ Đen', 3290000.00, 18, 'CHIEC', 1),
(115, 79, 'TS-C08-P079-B', '42', 'Trắng Đỏ Đen', 3290000.00, 12, 'CHIEC', 1),
(116, 80, 'TS-C08-P080-A', '41', 'Trắng Xanh', 1850000.00, 1, 'CHIEC', 1),
(117, 81, 'TS-C19-P081-A', '41', 'Trắng Xanh', 2490000.00, 18, 'CHIEC', 1),
(118, 81, 'TS-C19-P081-B', '42', 'Trắng Xanh', 2490000.00, 12, 'CHIEC', 1),
(119, 82, 'TS-C19-P082-A', '41', 'Trắng Đỏ', 2590000.00, 18, 'CHIEC', 1),
(120, 82, 'TS-C19-P082-B', '42', 'Trắng Đỏ', 2590000.00, 12, 'CHIEC', 1),
(121, 83, 'TS-C19-P083-A', '41', 'Trắng Đen', 2790000.00, 18, 'CHIEC', 1),
(122, 83, 'TS-C19-P083-B', '42', 'Trắng Đen', 2790000.00, 12, 'CHIEC', 1),
(123, 84, 'TS-C19-P084-A', '41', 'Trắng Navy', 1650000.00, 18, 'CHIEC', 1),
(124, 84, 'TS-C19-P084-B', '42', 'Trắng Navy', 1650000.00, 12, 'CHIEC', 1),
(125, 85, 'TS-C19-P085-A', '41', 'Đen Trắng', 2650000.00, 18, 'CHIEC', 1),
(126, 85, 'TS-C19-P085-B', '42', 'Đen Trắng', 2650000.00, 12, 'CHIEC', 1),
(127, 86, 'TS-C19-P086-A', '41', 'Trắng Xanh', 2350000.00, 18, 'CHIEC', 1),
(128, 86, 'TS-C19-P086-B', '42', 'Trắng Xanh', 2350000.00, 12, 'CHIEC', 1),
(129, 87, 'TS-C19-P087-A', '41', 'Trắng Bạc', 1790000.00, 18, 'CHIEC', 1),
(130, 87, 'TS-C19-P087-B', '42', 'Trắng Bạc', 1790000.00, 12, 'CHIEC', 1),
(131, 88, 'TS-C19-P088-A', '41', 'Trắng Đỏ', 1590000.00, 18, 'CHIEC', 1),
(132, 88, 'TS-C19-P088-B', '42', 'Trắng Đỏ', 1590000.00, 12, 'CHIEC', 1),
(133, 89, 'TS-C19-P089-A', '41', 'Trắng Xanh Dương', 1950000.00, 18, 'CHIEC', 1),
(134, 89, 'TS-C19-P089-B', '42', 'Trắng Xanh Dương', 1950000.00, 12, 'CHIEC', 1),
(135, 90, 'TS-C19-P090-A', '41', 'Trắng Xanh', 1690000.00, 18, 'CHIEC', 1),
(136, 90, 'TS-C19-P090-B', '42', 'Trắng Xanh', 1690000.00, 12, 'CHIEC', 1),
(137, 91, 'TS-C10-P091-A', 'Ống 12 quả', 'Trắng', 890000.00, 18, 'LO', 12),
(138, 92, 'TS-C10-P092-A', 'Ống 12 quả', 'Trắng', 790000.00, 18, 'LO', 12),
(139, 93, 'TS-C10-P093-A', 'Ống 12 quả', 'Trắng', 720000.00, 18, 'LO', 12),
(140, 94, 'TS-C10-P094-A', 'Ống 12 quả', 'Trắng', 650000.00, 18, 'LO', 12),
(141, 95, 'TS-C10-P095-A', 'Ống 6 quả', 'Vàng', 350000.00, 18, 'LO', 6),
(142, 96, 'TS-C10-P096-A', 'Ống 12 quả', 'Trắng', 760000.00, 18, 'LO', 12),
(143, 97, 'TS-C10-P097-A', 'Ống 12 quả', 'Trắng', 560000.00, 18, 'LO', 12),
(144, 98, 'TS-C10-P098-A', 'Ống 12 quả', 'Trắng', 460000.00, 18, 'LO', 12),
(145, 99, 'TS-C10-P099-A', 'Ống 12 quả', 'Trắng', 750000.00, 18, 'LO', 12),
(146, 100, 'TS-C10-P100-A', 'Ống 12 quả', 'Trắng', 590000.00, 18, 'LO', 12),
(147, 101, 'TS-C11-P101-A', 'Size 5', 'Trắng Vàng Tím', 3200000.00, 18, 'CHIEC', 1),
(148, 102, 'TS-C11-P102-A', 'Size 5', 'Trắng Cam', 890000.00, 18, 'CHIEC', 1),
(149, 103, 'TS-C11-P103-A', 'Size 5', 'Trắng Xanh', 590000.00, 18, 'CHIEC', 1),
(150, 104, 'TS-C11-P104-A', 'Size 5', 'Trắng Ngôi Sao', 3450000.00, 18, 'CHIEC', 1),
(151, 105, 'TS-C11-P105-A', 'Size 5', 'Trắng Đa Sắc', 3290000.00, 18, 'CHIEC', 1),
(152, 106, 'TS-C11-P106-A', 'Size 5', 'Trắng Đen Đa Sắc', 3390000.00, 18, 'CHIEC', 1),
(153, 107, 'TS-C11-P107-A', 'Size 5', 'Trắng Đen', 1050000.00, 18, 'CHIEC', 1),
(154, 108, 'TS-C11-P108-A', 'Size 5', 'Trắng Xanh Đỏ', 520000.00, 18, 'CHIEC', 1),
(155, 109, 'TS-C11-P109-A', 'Size 4', 'Trắng Cam', 490000.00, 18, 'CHIEC', 1),
(156, 110, 'TS-C11-P110-A', 'Size 5', 'Trắng Đỏ Đen', 980000.00, 18, 'CHIEC', 1),
(157, 111, 'TS-C12-P111-A', 'Lon 3 quả', 'Vàng Chanh', 195000.00, 18, 'LO', 3),
(158, 112, 'TS-C12-P112-A', 'Lon 4 quả', 'Vàng Chanh', 245000.00, 18, 'LO', 4),
(159, 113, 'TS-C12-P113-A', 'Lon 3 quả', 'Vàng Chanh', 165000.00, 18, 'LO', 3),
(160, 114, 'TS-C12-P114-A', 'Lon 4 quả', 'Vàng Chanh', 255000.00, 18, 'LO', 4),
(161, 115, 'TS-C12-P115-A', 'Lon 4 quả', 'Vàng Chanh', 220000.00, 18, 'LO', 4),
(162, 116, 'TS-C12-P116-A', 'Lon 4 quả', 'Vàng Chanh', 235000.00, 18, 'LO', 4),
(163, 117, 'TS-C12-P117-A', 'Lon 3 quả', 'Vàng Chanh', 155000.00, 18, 'LO', 3),
(164, 118, 'TS-C12-P118-A', 'Lon 4 quả', 'Vàng Chanh', 260000.00, 18, 'LO', 4),
(165, 119, 'TS-C12-P119-A', 'Lon 3 quả', 'Vàng Chanh', 175000.00, 18, 'LO', 3),
(166, 120, 'TS-C12-P120-A', 'Lon 3 quả', 'Đỏ Vàng', 160000.00, 18, 'LO', 3),
(167, 121, 'TS-C13-P121-A', 'Hộp 3 quả', 'Vàng Neon', 250000.00, 18, 'LO', 3),
(168, 122, 'TS-C13-P122-A', 'Hộp 4 quả', 'Vàng Chanh', 340000.00, 18, 'LO', 4),
(169, 123, 'TS-C13-P123-A', 'Hộp 12 quả', 'Vàng Neon', 890000.00, 18, 'LO', 12),
(170, 124, 'TS-C13-P124-A', 'Hộp 3 quả', 'Cam Neon', 230000.00, 18, 'LO', 3),
(171, 125, 'TS-C13-P125-A', 'Hộp 4 quả', 'Vàng Chanh', 350000.00, 18, 'LO', 4),
(172, 126, 'TS-C13-P126-A', 'Hộp 12 quả', 'Vàng Chanh', 950000.00, 18, 'LO', 12),
(173, 127, 'TS-C13-P127-A', 'Hộp 3 quả', 'Xanh Vàng', 240000.00, 18, 'LO', 3),
(174, 128, 'TS-C13-P128-A', 'Thùng 100 quả', 'Vàng Chanh', 6800000.00, 18, 'LO', 100),
(175, 129, 'TS-C13-P129-A', 'Hộp 3 quả', 'Vàng Neon', 180000.00, 18, 'LO', 3),
(176, 130, 'TS-C13-P130-A', 'Hộp 6 quả', 'Vàng Cam', 330000.00, 18, 'LO', 6),
(177, 131, 'TS-C20-P131-A', 'Hộp 10 quả', 'Trắng', 195000.00, 18, 'LO', 10),
(178, 132, 'TS-C20-P132-A', 'Hộp 6 quả', 'Trắng', 240000.00, 18, 'LO', 6),
(179, 133, 'TS-C20-P133-A', 'Hộp 6 quả', 'Trắng', 165000.00, 18, 'LO', 6),
(180, 134, 'TS-C20-P134-A', 'Hộp 100 quả', 'Trắng', 690000.00, 18, 'LO', 100),
(181, 135, 'TS-C20-P135-A', 'Hộp 3 quả', 'Trắng', 135000.00, 18, 'LO', 3),
(182, 136, 'TS-C20-P136-A', 'Hộp 12 quả', 'Trắng', 490000.00, 18, 'LO', 12),
(183, 137, 'TS-C20-P137-A', 'Hộp 3 quả', 'Trắng', 145000.00, 18, 'LO', 3),
(184, 138, 'TS-C20-P138-A', 'Hộp 6 quả', 'Trắng', 110000.00, 18, 'LO', 6),
(185, 139, 'TS-C20-P139-A', 'Hộp 6 quả', 'Trắng', 155000.00, 18, 'LO', 6),
(186, 140, 'TS-C20-P140-A', 'Hộp 10 quả', 'Cam', 205000.00, 18, 'LO', 10),
(187, 141, 'TS-C15-P141-A', 'L', 'Trắng Đỏ', 690000.00, 18, 'CHIEC', 1),
(188, 141, 'TS-C15-P141-B', 'XL', 'Trắng Đỏ', 690000.00, 12, 'CHIEC', 1),
(189, 142, 'TS-C15-P142-A', 'L', 'Xanh Navy', 750000.00, 18, 'CHIEC', 1),
(190, 142, 'TS-C15-P142-B', 'XL', 'Xanh Navy', 750000.00, 12, 'CHIEC', 1),
(191, 143, 'TS-C15-P143-A', 'L', 'Đỏ Đen', 550000.00, 18, 'CHIEC', 1),
(192, 143, 'TS-C15-P143-B', 'XL', 'Đỏ Đen', 550000.00, 12, 'CHIEC', 1),
(193, 144, 'TS-C15-P144-A', 'L', 'Trắng Xanh', 590000.00, 18, 'CHIEC', 1),
(194, 144, 'TS-C15-P144-B', 'XL', 'Trắng Xanh', 590000.00, 12, 'CHIEC', 1),
(195, 145, 'TS-C15-P145-A', 'L', 'Xanh Đen', 950000.00, 18, 'CHIEC', 1),
(196, 145, 'TS-C15-P145-B', 'XL', 'Xanh Đen', 950000.00, 12, 'CHIEC', 1),
(197, 146, 'TS-C15-P146-A', 'L', 'Xanh Dương', 1890000.00, 18, 'CHIEC', 1),
(198, 146, 'TS-C15-P146-B', 'XL', 'Xanh Dương', 1890000.00, 12, 'CHIEC', 1),
(199, 147, 'TS-C15-P147-A', 'L', 'Trắng Đen', 1950000.00, 18, 'CHIEC', 1),
(200, 147, 'TS-C15-P147-B', 'XL', 'Trắng Đen', 1950000.00, 12, 'CHIEC', 1),
(201, 148, 'TS-C15-P148-A', 'L', 'Đen Trắng', 790000.00, 18, 'CHIEC', 1),
(202, 148, 'TS-C15-P148-B', 'XL', 'Đen Trắng', 790000.00, 12, 'CHIEC', 1),
(203, 149, 'TS-C15-P149-A', 'L', 'Xanh Ngọc', 320000.00, 18, 'CHIEC', 1),
(204, 149, 'TS-C15-P149-B', 'XL', 'Xanh Ngọc', 320000.00, 12, 'CHIEC', 1),
(205, 150, 'TS-C15-P150-A', 'L', 'Đen', 480000.00, 18, 'CHIEC', 1),
(206, 150, 'TS-C15-P150-B', 'XL', 'Đen', 480000.00, 12, 'CHIEC', 1),
(207, 151, 'TS-C16-P151-A', '6-9 vợt', 'Xanh Đen', 1650000.00, 18, 'CHIEC', 1),
(208, 152, 'TS-C16-P152-A', '2-3 vợt', 'Đen Xanh', 1450000.00, 18, 'CHIEC', 1),
(209, 153, 'TS-C16-P153-A', '6 vợt', 'Đen Vàng', 1390000.00, 18, 'CHIEC', 1),
(210, 154, 'TS-C16-P154-A', '2 vợt', 'Trắng Đen', 1190000.00, 18, 'CHIEC', 1),
(211, 155, 'TS-C16-P155-A', '6 vợt', 'Trắng Xanh', 1590000.00, 18, 'CHIEC', 1),
(212, 156, 'TS-C16-P156-A', '2 vợt', 'Đỏ Đen', 1490000.00, 18, 'CHIEC', 1),
(213, 157, 'TS-C16-P157-A', '9 vợt', 'Đỏ Wilson', 2850000.00, 18, 'CHIEC', 1),
(214, 158, 'TS-C16-P158-A', '3 vợt', 'Vàng Đen', 1890000.00, 18, 'CHIEC', 1),
(215, 159, 'TS-C16-P159-A', '4 vợt', 'Đen Xanh', 1750000.00, 18, 'CHIEC', 1),
(216, 160, 'TS-C16-P160-A', '60L', 'Đen Trắng', 1150000.00, 18, 'CHIEC', 1);

-- 7. Images (160 ảnh sản phẩm thật xác thực đúng tên & hãng)
INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `sort_order`) VALUES
(1, 1, '/frontend/assets/products/catalog/p001.webp', TRUE, 1),
(2, 2, '/frontend/assets/products/catalog/p002.jpg', TRUE, 1),
(3, 3, '/frontend/assets/products/catalog/p003.webp', TRUE, 1),
(4, 4, '/frontend/assets/products/catalog/p004.webp', TRUE, 1),
(5, 5, '/frontend/assets/products/catalog/p005.webp', TRUE, 1),
(6, 6, '/frontend/assets/products/catalog/p006.jpg', TRUE, 1),
(7, 7, '/frontend/assets/products/catalog/p007.webp', TRUE, 1),
(8, 8, '/frontend/assets/products/catalog/p008.webp', TRUE, 1),
(9, 9, '/frontend/assets/products/catalog/p009.webp', TRUE, 1),
(10, 10, '/frontend/assets/products/victor-auraspeed-90k-ii.png', TRUE, 1),
(11, 11, '/frontend/assets/products/catalog/p011.webp', TRUE, 1),
(12, 12, '/frontend/assets/products/catalog/p012.webp', TRUE, 1),
(13, 13, '/frontend/assets/products/catalog/p013.webp', TRUE, 1),
(14, 14, '/frontend/assets/products/catalog/p014.webp', TRUE, 1),
(15, 15, '/frontend/assets/products/catalog/p015.webp', TRUE, 1),
(16, 16, '/frontend/assets/products/catalog/p016.jpg', TRUE, 1),
(17, 17, '/frontend/assets/products/catalog/p017.webp', TRUE, 1),
(18, 18, '/frontend/assets/products/catalog/p018.jpg', TRUE, 1),
(19, 19, '/frontend/assets/products/catalog/p019.webp', TRUE, 1),
(20, 20, '/frontend/assets/products/catalog/p020.webp', TRUE, 1),
(21, 21, '/frontend/assets/products/catalog/p021.webp', TRUE, 1),
(22, 22, '/frontend/assets/products/catalog/p022.webp', TRUE, 1),
(23, 23, '/frontend/assets/products/catalog/p023.webp', TRUE, 1),
(24, 24, '/frontend/assets/products/catalog/p024.webp', TRUE, 1),
(25, 25, '/frontend/assets/products/catalog/p025.webp', TRUE, 1),
(26, 26, '/frontend/assets/products/catalog/p026.jpg', TRUE, 1),
(27, 27, '/frontend/assets/products/catalog/p027.webp', TRUE, 1),
(28, 28, '/frontend/assets/products/catalog/p028.jpg', TRUE, 1),
(29, 29, '/frontend/assets/products/catalog/p029.webp', TRUE, 1),
(30, 30, '/frontend/assets/products/catalog/p030.webp', TRUE, 1),
(31, 31, '/frontend/assets/products/catalog/p031.jpg', TRUE, 1),
(32, 32, '/frontend/assets/products/catalog/p032.webp', TRUE, 1),
(33, 33, '/frontend/assets/products/catalog/p033.jpg', TRUE, 1),
(34, 34, '/frontend/assets/products/catalog/p034.webp', TRUE, 1),
(35, 35, '/frontend/assets/products/catalog/p035.webp', TRUE, 1),
(36, 36, '/frontend/assets/products/catalog/p036.webp', TRUE, 1),
(37, 37, '/frontend/assets/products/catalog/p037.webp', TRUE, 1),
(38, 38, '/frontend/assets/products/catalog/p038.jpg', TRUE, 1),
(39, 39, '/frontend/assets/products/catalog/p039.webp', TRUE, 1),
(40, 40, '/frontend/assets/products/catalog/p040.webp', TRUE, 1),
(41, 41, '/frontend/assets/products/catalog/p041.webp', TRUE, 1),
(42, 42, '/frontend/assets/products/catalog/p042.webp', TRUE, 1),
(43, 43, '/frontend/assets/products/catalog/p043.webp', TRUE, 1),
(44, 44, '/frontend/assets/products/catalog/p044.webp', TRUE, 1),
(45, 45, '/frontend/assets/products/catalog/p045.jpg', TRUE, 1),
(46, 46, '/frontend/assets/products/catalog/p046.jpg', TRUE, 1),
(47, 47, '/frontend/assets/products/catalog/p047.jpg', TRUE, 1),
(48, 48, '/frontend/assets/products/catalog/p048.webp', TRUE, 1),
(49, 49, '/frontend/assets/products/catalog/p049.webp', TRUE, 1),
(50, 50, '/frontend/assets/products/catalog/p050.webp', TRUE, 1),
(51, 51, '/frontend/assets/products/catalog/p051.webp', TRUE, 1),
(52, 52, '/frontend/assets/products/catalog/p052.webp', TRUE, 1),
(53, 53, '/frontend/assets/products/catalog/p053.webp', TRUE, 1),
(54, 54, '/frontend/assets/products/catalog/p054.webp', TRUE, 1),
(55, 55, '/frontend/assets/products/catalog/p055.webp', TRUE, 1),
(56, 56, '/frontend/assets/products/catalog/p056.jpg', TRUE, 1),
(57, 57, '/frontend/assets/products/catalog/p057.jpg', TRUE, 1),
(58, 58, '/frontend/assets/products/catalog/p058.jpg', TRUE, 1),
(59, 59, '/frontend/assets/products/catalog/p059.webp', TRUE, 1),
(60, 60, '/frontend/assets/products/catalog/p060.webp', TRUE, 1),
(61, 61, '/frontend/assets/products/catalog/p061.jpg', TRUE, 1),
(62, 62, '/frontend/assets/products/catalog/p062.jpg', TRUE, 1),
(63, 63, '/frontend/assets/products/catalog/p063.jpg', TRUE, 1),
(64, 64, '/frontend/assets/products/catalog/p064.jpg', TRUE, 1),
(65, 65, '/frontend/assets/products/catalog/p065.jpg', TRUE, 1),
(66, 66, '/frontend/assets/products/catalog/p066.webp', TRUE, 1),
(67, 67, '/frontend/assets/products/catalog/p067.webp', TRUE, 1),
(68, 68, '/frontend/assets/products/catalog/p068.webp', TRUE, 1),
(69, 69, '/frontend/assets/products/catalog/p069.jpg', TRUE, 1),
(70, 70, '/frontend/assets/products/catalog/p070.jpg', TRUE, 1),
(71, 71, '/frontend/assets/products/catalog/p071.jpg', TRUE, 1),
(72, 72, '/frontend/assets/products/catalog/p072.jpg', TRUE, 1),
(73, 73, '/frontend/assets/products/catalog/p073.webp', TRUE, 1),
(74, 74, '/frontend/assets/products/catalog/p074.webp', TRUE, 1),
(75, 75, '/frontend/assets/products/catalog/p075.jpg', TRUE, 1),
(76, 76, '/frontend/assets/products/catalog/p076.webp', TRUE, 1),
(77, 77, '/frontend/assets/products/catalog/p077.jpg', TRUE, 1),
(78, 78, '/frontend/assets/products/catalog/p078.jpg', TRUE, 1),
(79, 79, '/frontend/assets/products/catalog/p079.jpg', TRUE, 1),
(80, 80, '/frontend/assets/products/catalog/p080.webp', TRUE, 1),
(81, 81, '/frontend/assets/products/catalog/p081.webp', TRUE, 1),
(82, 82, '/frontend/assets/products/catalog/p082.webp', TRUE, 1),
(83, 83, '/frontend/assets/products/catalog/p083.jpg', TRUE, 1),
(84, 84, '/frontend/assets/products/catalog/p084.webp', TRUE, 1),
(85, 85, '/frontend/assets/products/catalog/p085.webp', TRUE, 1),
(86, 86, '/frontend/assets/products/catalog/p086.jpg', TRUE, 1),
(87, 87, '/frontend/assets/products/catalog/p087.webp', TRUE, 1),
(88, 88, '/frontend/assets/products/catalog/p088.jpg', TRUE, 1),
(89, 89, '/frontend/assets/products/catalog/p089.webp', TRUE, 1),
(90, 90, '/frontend/assets/products/catalog/p090.webp', TRUE, 1),
(91, 91, '/frontend/assets/products/catalog/p091.jpg', TRUE, 1),
(92, 92, '/frontend/assets/products/catalog/p092.webp', TRUE, 1),
(93, 93, '/frontend/assets/products/catalog/p093.webp', TRUE, 1),
(94, 94, '/frontend/assets/products/catalog/p094.webp', TRUE, 1),
(95, 95, '/frontend/assets/products/catalog/p095.webp', TRUE, 1),
(96, 96, '/frontend/assets/products/catalog/p096.jpg', TRUE, 1),
(97, 97, '/frontend/assets/products/catalog/p097.webp', TRUE, 1),
(98, 98, '/frontend/assets/products/catalog/p098.webp', TRUE, 1),
(99, 99, '/frontend/assets/products/catalog/p099.webp', TRUE, 1),
(100, 100, '/frontend/assets/products/catalog/p100.webp', TRUE, 1),
(101, 101, '/frontend/assets/products/catalog/p101.webp', TRUE, 1),
(102, 102, '/frontend/assets/products/catalog/p102.webp', TRUE, 1),
(103, 103, '/frontend/assets/products/catalog/p103.jpg', TRUE, 1),
(104, 104, '/frontend/assets/products/catalog/p104.webp', TRUE, 1),
(105, 105, '/frontend/assets/products/catalog/p105.webp', TRUE, 1),
(106, 106, '/frontend/assets/products/catalog/p106.webp', TRUE, 1),
(107, 107, '/frontend/assets/products/catalog/p107.webp', TRUE, 1),
(108, 108, '/frontend/assets/products/catalog/p108.jpg', TRUE, 1),
(109, 109, '/frontend/assets/products/catalog/p109.jpg', TRUE, 1),
(110, 110, '/frontend/assets/products/catalog/p110.webp', TRUE, 1),
(111, 111, '/frontend/assets/products/catalog/p111.jpg', TRUE, 1),
(112, 112, '/frontend/assets/products/catalog/p112.webp', TRUE, 1),
(113, 113, '/frontend/assets/products/catalog/p113.webp', TRUE, 1),
(114, 114, '/frontend/assets/products/catalog/p114.jpg', TRUE, 1),
(115, 115, '/frontend/assets/products/catalog/p115.webp', TRUE, 1),
(116, 116, '/frontend/assets/products/catalog/p116.webp', TRUE, 1),
(117, 117, '/frontend/assets/products/catalog/p117.webp', TRUE, 1),
(118, 118, '/frontend/assets/products/catalog/p118.webp', TRUE, 1),
(119, 119, '/frontend/assets/products/catalog/p119.webp', TRUE, 1),
(120, 120, '/frontend/assets/products/catalog/p120.webp', TRUE, 1),
(121, 121, '/frontend/assets/products/catalog/p121.webp', TRUE, 1),
(122, 122, '/frontend/assets/products/catalog/p122.webp', TRUE, 1),
(123, 123, '/frontend/assets/products/catalog/p123.webp', TRUE, 1),
(124, 124, '/frontend/assets/products/catalog/p124.webp', TRUE, 1),
(125, 125, '/frontend/assets/products/catalog/p125.webp', TRUE, 1),
(126, 126, '/frontend/assets/products/catalog/p126.webp', TRUE, 1),
(127, 127, '/frontend/assets/products/catalog/p127.jpg', TRUE, 1),
(128, 128, '/frontend/assets/products/catalog/p128.webp', TRUE, 1),
(129, 129, '/frontend/assets/products/catalog/p129.webp', TRUE, 1),
(130, 130, '/frontend/assets/products/catalog/p130.webp', TRUE, 1),
(131, 131, '/frontend/assets/products/catalog/p131.jpg', TRUE, 1),
(132, 132, '/frontend/assets/products/catalog/p132.webp', TRUE, 1),
(133, 133, '/frontend/assets/products/catalog/p133.jpg', TRUE, 1),
(134, 134, '/frontend/assets/products/catalog/p134.webp', TRUE, 1),
(135, 135, '/frontend/assets/products/catalog/p135.jpg', TRUE, 1),
(136, 136, '/frontend/assets/products/catalog/p136.webp', TRUE, 1),
(137, 137, '/frontend/assets/products/catalog/p137.webp', TRUE, 1),
(138, 138, '/frontend/assets/products/catalog/p138.webp', TRUE, 1),
(139, 139, '/frontend/assets/products/catalog/p139.webp', TRUE, 1),
(140, 140, '/frontend/assets/products/catalog/p140.webp', TRUE, 1),
(141, 141, '/frontend/assets/products/catalog/p141.jpg', TRUE, 1),
(142, 142, '/frontend/assets/products/catalog/p142.webp', TRUE, 1),
(143, 143, '/frontend/assets/products/catalog/p143.jpg', TRUE, 1),
(144, 144, '/frontend/assets/products/catalog/p144.jpg', TRUE, 1),
(145, 145, '/frontend/assets/products/catalog/p145.jpg', TRUE, 1),
(146, 146, '/frontend/assets/products/catalog/p146.webp', TRUE, 1),
(147, 147, '/frontend/assets/products/catalog/p147.webp', TRUE, 1),
(148, 148, '/frontend/assets/products/catalog/p148.jpg', TRUE, 1),
(149, 149, '/frontend/assets/products/catalog/p149.jpg', TRUE, 1),
(150, 150, '/frontend/assets/products/catalog/p150.webp', TRUE, 1),
(151, 151, '/frontend/assets/products/catalog/p151.webp', TRUE, 1),
(152, 152, '/frontend/assets/products/catalog/p152.webp', TRUE, 1),
(153, 153, '/frontend/assets/products/catalog/p153.jpg', TRUE, 1),
(154, 154, '/frontend/assets/products/catalog/p154.jpg', TRUE, 1),
(155, 155, '/frontend/assets/products/catalog/p155.webp', TRUE, 1),
(156, 156, '/frontend/assets/products/catalog/p156.jpg', TRUE, 1),
(157, 157, '/frontend/assets/products/catalog/p157.webp', TRUE, 1),
(158, 158, '/frontend/assets/products/catalog/p158.webp', TRUE, 1),
(159, 159, '/frontend/assets/products/catalog/p159.webp', TRUE, 1),
(160, 160, '/frontend/assets/products/catalog/p160.webp', TRUE, 1);

-- 8. Courts
INSERT INTO `courts` (`id`, `sport_id`, `name`, `address`, `description`, `status`) VALUES
(1, 1, 'Sân Cầu Lông Đền Lừ Stadium', 'Khu đô thị Đền Lừ II, Hoàng Mai, Hà Nội', 'Cụm 10 sân thảm PVC tiêu chuẩn BWF, đèn LED chống chói, quạt trần công nghiệp.', 'ACTIVE'),
(2, 1, 'Sân Cầu Lông Cầu Giấy Arena', 'Số 35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội', 'Sân cầu lông có điều hòa, mặt thảm mới thay 2024, phòng tắm nóng lạnh miễn phí.', 'ACTIVE'),
(3, 4, 'Sân Pickleball D-Sport Complex', 'Số 168 Khuất Duy Tiến, Thanh Xuân, Hà Nội', 'Cụm 6 sân Pickleball ngoài trời có mái che, mặt sân sơn nhám giảm trơn trượt chuẩn USAPA.', 'ACTIVE'),
(4, 3, 'Sân Tennis Trung Kính Court', 'Ngõ 219 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội', 'Cụm 3 sân Tennis mặt cứng chuẩn giải đấu, có dàn đèn cao áp phục vụ đánh tối.', 'ACTIVE');

-- 9. Court Slots
INSERT INTO `court_slots` (`id`, `court_id`, `slot_name`, `start_time`, `end_time`, `price`, `status`) VALUES
(1, 1, 'Ca 1 (Sáng sớm)', '06:00:00', '08:00:00', 160000.00, 'ACTIVE'),
(2, 1, 'Ca 2 (Sáng)', '08:00:00', '10:00:00', 140000.00, 'ACTIVE'),
(3, 1, 'Ca 3 (Chiều mát)', '16:00:00', '18:00:00', 180000.00, 'ACTIVE'),
(4, 1, 'Ca 4 (Tối cao điểm)', '18:00:00', '20:00:00', 250000.00, 'ACTIVE'),
(5, 1, 'Ca 5 (Tối muộn)', '20:00:00', '22:00:00', 220000.00, 'ACTIVE'),
(6, 2, 'Ca 1 (Sáng)', '06:30:00', '08:30:00', 180000.00, 'ACTIVE'),
(7, 2, 'Ca 2 (Chiều)', '16:00:00', '18:00:00', 220000.00, 'ACTIVE'),
(8, 2, 'Ca 3 (Tối vàng)', '18:00:00', '20:00:00', 280000.00, 'ACTIVE'),
(9, 2, 'Ca 4 (Tối muộn)', '20:00:00', '22:00:00', 240000.00, 'ACTIVE'),
(10, 3, 'Ca 1 (Sáng sớm)', '06:00:00', '08:00:00', 180000.00, 'ACTIVE'),
(11, 3, 'Ca 2 (Sáng vui khỏe)', '08:00:00', '10:00:00', 150000.00, 'ACTIVE'),
(12, 3, 'Ca 3 (Chiều giao lưu)', '16:30:00', '18:30:00', 240000.00, 'ACTIVE'),
(13, 3, 'Ca 4 (Tối sôi động)', '18:30:00', '20:30:00', 300000.00, 'ACTIVE'),
(14, 4, 'Ca 1 (Sáng sớm)', '05:30:00', '07:30:00', 220000.00, 'ACTIVE'),
(15, 4, 'Ca 2 (Chiều thể thao)', '16:00:00', '18:00:00', 280000.00, 'ACTIVE'),
(16, 4, 'Ca 3 (Tối có đèn)', '18:00:00', '21:00:00', 450000.00, 'ACTIVE');

-- 10. Court Bookings
INSERT INTO `court_bookings` (`id`, `user_id`, `court_id`, `court_slot_id`, `booking_date`, `price_at_booking`, `status`) VALUES
(1, 2, 1, 4, '2026-11-10', 250000.00, 'XAC_NHAN'),
(2, 3, 1, 5, '2026-11-10', 220000.00, 'CHO_XAC_NHAN'),
(3, 4, 3, 13, '2026-11-11', 300000.00, 'XAC_NHAN'),
(4, 5, 2, 8, '2026-11-11', 280000.00, 'TU_CHOI'),
(5, 6, 4, 16, '2026-11-12', 450000.00, 'HUY'),
(6, 2, 3, 12, '2026-11-12', 240000.00, 'CHO_XAC_NHAN');

-- 11. Match Posts
INSERT INTO `match_posts` (`id`, `user_id`, `sport_id`, `match_time`, `location`, `skill_level`, `contact_info`, `status`) VALUES
(1, 2, 1, '2026-11-10 18:00:00', 'Sân Cầu Lông Đền Lừ - Sân số 3', 'Trung bình khá', '0912345678 (Zalo An)', 'OPEN'),
(2, 4, 4, '2026-11-11 18:30:00', 'Sân Pickleball D-Sport Khuất Duy Tiến', 'Mới chơi / Giao lưu vui vẻ', '0934567890 (Cường)', 'OPEN'),
(3, 5, 3, '2026-11-12 16:00:00', 'Sân Tennis Trung Kính Court', 'Khá (NTRP 3.0 - 3.5)', '0945678901 (Dung)', 'OPEN'),
(4, 6, 1, '2026-11-08 20:00:00', 'Sân Cầu Lông Cầu Giấy Arena', 'Trung bình', '0956789012 (Em)', 'CLOSED');

-- 12. Buyback Requests
INSERT INTO `buyback_requests` (`id`, `user_id`, `sport_id`, `brand_model`, `condition_detail`, `expected_price`, `images`, `offered_price`, `status`) VALUES
(1, 2, 1, 'Yonex Astrox 99 Pro Trắng Bạch Hổ', 'Vợt mua đập hộp 8 tháng, đánh phong trào giữ kỹ, xước 1 vết nhỏ góc 12h do vớt cầu sàn gỗ, không nứt.', 2500000.00, '["https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600"]', 2200000.00, 'ACCEPTED'),
(2, 3, 4, 'Joola Hyperion Ben Johns 16mm', 'Vợt đánh giải Pickleball được 2 tháng, nay muốn nâng cấp lên bản Perseus 3S nên pass lại.', 3200000.00, '["https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600"]', 3000000.00, 'OFFERED'),
(3, 4, 3, 'Wilson Pro Staff 97 V13 315g', 'Cán vợt hơi to so với tay nên đánh đau cổ tay, khung còn đẹp 90%, đã căng dây cước Luxilon 24kg.', 2900000.00, '["https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600"]', NULL, 'PENDING'),
(4, 5, 2, 'Giày Nike Mercurial Superfly 9 Academy TF Cổ Cao', 'Size 41 đi bị chật ngón chân cái, mới đá thử 1 hiệp rồi cất tủ.', 1400000.00, '["https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600"]', 1100000.00, 'COMPLETED');

-- 13. Carts
INSERT INTO `carts` (`id`, `user_id`) VALUES
(1, 2),
(2, 3),
(3, 4),
(4, 5),
(5, 6),
(6, 7);

-- 14. Cart Items
INSERT INTO `cart_items` (`id`, `cart_id`, `product_sku_id`, `quantity`) VALUES
(1, 1, 1, 1),
(2, 1, 16, 2),
(3, 2, 11, 1),
(4, 3, 41, 1),
(5, 3, 48, 3),
(6, 4, 25, 1);

-- 15. Orders
INSERT INTO `orders` (`id`, `order_code`, `user_id`, `receiver_name`, `receiver_phone`, `shipping_address`, `payment_method`, `shipping_fee`, `total_amount`, `status`) VALUES
(1, 'ORD-20261101-001', 2, 'Nguyễn Văn An', '0912345678', 'Số 15 Lê Duẩn, Hoàn Kiếm, Hà Nội', 'COD', 0.00, 5000000.00, 'COMPLETED'),
(2, 'ORD-20261103-002', 3, 'Trần Thị Bích', '0923456789', 'Phòng 802, Chung cư Skylight, Minh Khai, Hai Bà Trưng, Hà Nội', 'COD', 0.00, 2650000.00, 'SHIPPING'),
(3, 'ORD-20261105-003', 4, 'Lê Quang Cường', '0934567890', 'Tòa Landmark 81, Phường 22, Bình Thạnh, TP.HCM', 'COD', 0.00, 6200000.00, 'CONFIRMED'),
(4, 'ORD-20261106-004', 5, 'Phạm Thị Dung', '0945678901', 'Số 48 Ngô Quyền, Sơn Trà, Đà Nẵng', 'COD', 0.00, 2850000.00, 'PENDING'),
(5, 'ORD-20261107-005', 6, 'Hoàng Văn Em', '0956789012', 'Số 120 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', 'COD', 0.00, 850000.00, 'CANCELLED');

-- 16. Order Items
INSERT INTO `order_items` (`id`, `order_id`, `product_sku_id`, `quantity`, `price_at_order`, `condition_at_order`) VALUES
(1, 1, 1, 1, 4150000.00, 'MOI'),
(2, 1, 16, 1, 850000.00, 'MOI'),
(3, 2, 11, 1, 2650000.00, 'MOI'),
(4, 3, 43, 1, 6200000.00, 'MOI'),
(5, 4, 59, 1, 2850000.00, 'CU'),
(6, 5, 25, 1, 850000.00, 'MOI');



-- =============================================================================
-- HOÀN TẤT TOÀN BỘ KHỞI TẠO VÀ SEED DATABASE
-- =============================================================================

    COMMIT;
    SELECT 'SEEDED: 16 tables populated' AS seed_result;
END$$
CALL `seed_sport_store_demo`()$$
DROP PROCEDURE `seed_sport_store_demo`$$
DELIMITER ;
