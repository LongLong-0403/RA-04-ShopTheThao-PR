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

-- 2. Sports
INSERT INTO `sports` (`id`, `name`, `slug`, `description`, `status`) VALUES
(1, 'Cầu lông', 'cau-long', 'Môn thể thao dùng vợt đánh cầu lông phong trào và chuyên nghiệp', 'ACTIVE'),
(2, 'Bóng đá', 'bong-da', 'Môn thể thao vua với giày đinh sân cỏ nhân tạo và bóng thi đấu', 'ACTIVE'),
(3, 'Tennis', 'tennis', 'Quần vợt chuyên nghiệp với vợt trợ lực và bóng thi đấu nỉ cao cấp', 'ACTIVE'),
(4, 'Pickleball', 'pickleball', 'Môn thể thao xu hướng kết hợp bóng bàn, tennis và cầu lông', 'ACTIVE'),
(5, 'Bóng rổ', 'bong-ro', 'Môn thể thao bóng rổ trong nhà sàn gỗ và ngoài trời bê tông', 'ACTIVE');

-- 3. Categories
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `status`) VALUES
(1, NULL, 'Vợt thể thao', 'vot-the-thao', 'ACTIVE'),
(2, 1, 'Vợt cầu lông', 'vot-cau-long', 'ACTIVE'),
(3, 1, 'Vợt Tennis', 'vot-tennis', 'ACTIVE'),
(4, 1, 'Vợt Pickleball', 'vot-pickleball', 'ACTIVE'),
(5, NULL, 'Giày thể thao', 'giay-the-thao', 'ACTIVE'),
(6, 5, 'Giày cầu lông', 'giay-cau-long', 'ACTIVE'),
(7, 5, 'Giày bóng đá', 'giay-bong-da', 'ACTIVE'),
(8, 5, 'Giày Tennis & Pickleball', 'giay-tennis-pickleball', 'ACTIVE'),
(9, NULL, 'Bóng & Quả thi đấu', 'bong-va-qua-thi-dau', 'ACTIVE'),
(10, 9, 'Quả cầu lông', 'qua-cau-long', 'ACTIVE'),
(11, 9, 'Quả bóng đá', 'qua-bong-da', 'ACTIVE'),
(12, 9, 'Bóng Tennis', 'bong-tennis', 'ACTIVE'),
(13, 9, 'Bóng Pickleball', 'bong-pickleball', 'ACTIVE'),
(14, NULL, 'Trang phục & Balo', 'trang-phuc-balo', 'ACTIVE'),
(15, 14, 'Áo đấu & Trang phục', 'ao-dau-trang-phuc', 'ACTIVE'),
(16, 14, 'Túi vợt & Balo', 'tui-vot-balo', 'ACTIVE');

-- 4. Brands
INSERT INTO `brands` (`id`, `name`, `slug`, `logo_url`, `status`) VALUES
(1, 'Yonex', 'yonex', 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=120', 'ACTIVE'),
(2, 'Lining', 'lining', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120', 'ACTIVE'),
(3, 'Victor', 'victor', 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120', 'ACTIVE'),
(4, 'Nike', 'nike', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120', 'ACTIVE'),
(5, 'Adidas', 'adidas', 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=120', 'ACTIVE'),
(6, 'Wilson', 'wilson', 'https://images.unsplash.com/photo-1530915365347-e34b1e8df1db?w=120', 'ACTIVE'),
(7, 'Babolat', 'babolat', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=120', 'ACTIVE'),
(8, 'Selkirk', 'selkirk', 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=120', 'ACTIVE'),
(9, 'Joola', 'joola', 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=120', 'ACTIVE'),
(10, 'Mizuno', 'mizuno', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120', 'ACTIVE'),
(11, 'Kamito', 'kamito', 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120', 'ACTIVE');

-- 5. Products (38 sản phẩm: 30 Mới + 8 Cũ có wear_description)
INSERT INTO `products` (`id`, `sport_id`, `category_id`, `brand_id`, `name`, `description`, `specifications`, `condition_type`, `wear_description`, `status`) VALUES
(1, 1, 2, 1, 'Vợt cầu lông Yonex Astrox 88D Pro 2024', 'Dòng vợt tấn công đỉnh cao dành cho người chơi cầu sau, trợ lực đập smash cực mạnh.', '{"weight": "3U, 4U", "grip": "G5", "tension": "28 lbs", "balance": "Head Heavy", "material": "HM Graphite + Namd"}', 'MOI', NULL, 'ACTIVE'),
(2, 1, 2, 1, 'Vợt cầu lông Yonex Nanoflare 1000Z', 'Siêu phẩm tốc độ đẩy cầu, vung vợt chớp nhoáng với công nghệ Sonic Flare System.', '{"weight": "4U", "grip": "G5", "tension": "28 lbs", "balance": "Head Light", "material": "Ultra PE Fiber"}', 'MOI', NULL, 'ACTIVE'),
(3, 1, 2, 2, 'Vợt cầu lông Lining Axforce 90 Max Tiger', 'Vợt dành cho lối đánh uy lực như hổ săn mồi, thân vợt mỏng dẻo tạo lực nảy lớn.', '{"weight": "3U, 4U", "grip": "G5", "tension": "30 lbs", "balance": "Heavy Head", "material": "TB Nano + M50 Super"}', 'MOI', NULL, 'ACTIVE'),
(4, 1, 2, 2, 'Vợt cầu lông Lining Halbertec 8000', 'Cân bằng công thủ toàn diện, độ kiểm soát đường cầu chuẩn xác từng milimet.', '{"weight": "4U", "grip": "G5", "tension": "29 lbs", "balance": "Even Balance", "material": "High Resilient Carbon"}', 'MOI', NULL, 'ACTIVE'),
(5, 1, 2, 3, 'Vợt cầu lông Victor Thruster Ryuga II Pro', 'Cây vợt rồng lửa đồng hành cùng Lee Zii Jia, smash bộc phá cắm sân cực gắt.', '{"weight": "3U, 4U", "grip": "G5", "tension": "31 lbs", "balance": "Head Heavy", "material": "Pyrofil Carbon"}', 'MOI', NULL, 'ACTIVE'),
(6, 1, 6, 1, 'Giày cầu lông Yonex Power Cushion 65Z3', 'Đôi giày quốc dân êm ái, bám sân cực tốt và giảm chấn thương gót chân tối đa.', '{"outsole": "Radial Blade Sole", "midsole": "Power Cushion+", "upper": "Synthetic Fiber", "weight": "310g"}', 'MOI', NULL, 'ACTIVE'),
(7, 1, 6, 10, 'Giày cầu lông Mizuno Wave Claw 2', 'Form chân bè đặc thù châu Á, công nghệ đệm Wave giảm chấn và tăng tốc bước chân.', '{"outsole": "XG Rubber", "midsole": "Mizuno Wave", "upper": "Mesh + Da PU"}', 'MOI', NULL, 'ACTIVE'),
(8, 1, 10, 1, 'Ống quả cầu lông Yonex Aerosensa 50 (AS50)', 'Ống cầu lông tiêu chuẩn thi đấu Olympic, lông vũ ngỗng cao cấp đường bay ổn định.', '{"shuttle_type": "Lông ngỗng cao cấp", "speed": "77 (Tốc độ tiêu chuẩn VN)", "quantity": "12 quả / ống"}', 'MOI', NULL, 'ACTIVE'),
(9, 1, 10, 3, 'Ống quả cầu lông Victor Champion No.1', 'Được cấp phép thi đấu các giải quốc tế, độ bền cao và ít gãy lông khi đập mạnh.', '{"shuttle_type": "Lông vịt chọn lọc", "speed": "77", "quantity": "12 quả / ống"}', 'MOI', NULL, 'ACTIVE'),
(10, 1, 16, 1, 'Túi vợt cầu lông Yonex Pro Tournament 92231W', 'Túi đựng vợt cao cấp có ngăn cách nhiệt thermo, ngăn để giày riêng biệt.', '{"capacity": "6 cây vợt", "material": "Polyester 80% + PU 20%", "dimensions": "75 x 18 x 33 cm"}', 'MOI', NULL, 'ACTIVE'),
(11, 2, 7, 4, 'Giày bóng đá Nike Zoom Mercurial Vapor 15 Pro TF', 'Đế đinh dăm chuyên dụng cho sân cỏ nhân tạo, đệm Air Zoom phản hồi lực êm ái.', '{"upper": "Flyknit + Nikeskin", "outsole": "Đinh TF cao su", "collar": "Cổ thấp"}', 'MOI', NULL, 'ACTIVE'),
(12, 2, 7, 5, 'Giày bóng đá Adidas Predator Elite TF', 'Dòng giày kiểm soát bóng và sút xoáy hiểm hóc với gai cao su Strikeskin.', '{"upper": "HybridTouch 2.0", "outsole": "Đinh TF", "cushion": "Lightstrike"}', 'MOI', NULL, 'ACTIVE'),
(13, 2, 7, 11, 'Giày bóng đá Kamito TA11 Pro Sân Cỏ Nhân Tạo', 'Đồng sáng tạo cùng tiền vệ Tuấn Anh, form giày bè êm chân thiết kế riêng cho người Việt.', '{"upper": "Da mềm nhân tạo KA-FIBER", "outsole": "Đinh dăm TF kim cương", "weight": "240g"}', 'MOI', NULL, 'ACTIVE'),
(14, 2, 11, 4, 'Quả bóng đá Nike Flight Premier League Match Ball', 'Bóng thi đấu chính thức Ngoại Hạng Anh, công nghệ rãnh Aerowsculpt giảm liệng gió.', '{"size": "Size 5", "construction": "4 miếng nhiệt hàn", "bladder": "Cao su tăng cường giữ áp suất"}', 'MOI', NULL, 'ACTIVE'),
(15, 2, 11, 5, 'Quả bóng đá Adidas UCL Pro Match Ball Champions League', 'Bóng thi đấu Cúp C1 Châu Âu với hoa văn ngôi sao nhiệt hàn không đường may.', '{"size": "Size 5", "surface": "100% Polyurethane", "standard": "FIFA Quality Pro"}', 'MOI', NULL, 'ACTIVE'),
(16, 2, 15, 4, 'Áo đấu CLB Real Madrid Sân Nhà 2025/2026', 'Chất liệu vải Dri-FIT thoáng khí thấm hút mồ hôi, logo thêu sắc nét.', '{"material": "100% Polyester tái chế", "tech": "Dri-FIT ADV", "fit": "Slim fit"}', 'MOI', NULL, 'ACTIVE'),
(17, 3, 3, 6, 'Vợt Tennis Wilson Pro Staff 97 V14', 'Cây vợt huyền thoại mang phong cách của Roger Federer, độ kiểm soát bóng tối thượng.', '{"head_size": "97 sq in", "weight": "315g", "string_pattern": "16x19", "balance": "31cm (10 pts HL)"}', 'MOI', NULL, 'ACTIVE'),
(18, 3, 3, 7, 'Vợt Tennis Babolat Pure Aero 2023', 'Cỗ máy tạo xoáy topspin cực đại gắn liền với Rafael Nadal và Carlos Alcaraz.', '{"head_size": "100 sq in", "weight": "300g", "string_pattern": "16x19", "material": "Graphite + NF2-Tech"}', 'MOI', NULL, 'ACTIVE'),
(19, 3, 8, 4, 'Giày Tennis Nike Court Air Zoom Vapor 11', 'Thiết kế thấp sát mặt sân hỗ trợ bứt tốc nhanh, đệm Zoom Air mũi chân linh hoạt.', '{"outsole": "Hard Court Compound", "upper": "Molded Side Wall", "cushioning": "Zoom Air"}', 'MOI', NULL, 'ACTIVE'),
(20, 3, 12, 6, 'Hộp bóng Tennis Wilson US Open (Hộp 4 quả)', 'Bóng thi đấu chính thức giải Grand Slam US Open, lớp nỉ cao cấp giữ áp suất lâu.', '{"type": "Extra Duty Felt", "quantity": "4 quả / lon", "approved": "ITF & USTA Approved"}', 'MOI', NULL, 'ACTIVE'),
(21, 3, 16, 6, 'Balo Tennis Wilson Tour Backpack', 'Balo đa năng đựng vừa 2 cây vợt, có ngăn laptop và ngăn giày thông gió dưới đáy.', '{"dimensions": "30.5 x 20 x 44.5 cm", "material": "100% Polyester", "racket_capacity": "2 rackets"}', 'MOI', NULL, 'ACTIVE'),
(22, 4, 4, 8, 'Vợt Pickleball Selkirk Vanguard Power Air Invikta', 'Vợt không viền khí động học đỉnh cao, mang lại sức mạnh smash và độ xoáy cực khủng.', '{"core": "Polymer Honeycomb 13mm", "face": "QuadFlex 4 sợi Carbon", "weight": "7.8 - 8.2 oz", "grip": "4 1/4 in"}', 'MOI', NULL, 'ACTIVE'),
(23, 4, 4, 9, 'Vợt Pickleball Joola Ben Johns Perseus CFS 16', 'Vợt thi đấu của tay vợt số 1 thế giới Ben Johns, mặt Carbon nhám tối ưu độ xoáy.', '{"core": "Reactive Honeycomb 16mm", "face": "Carbon Friction Surface (CFS)", "weight": "8.0 oz", "length": "16.5 in"}', 'MOI', NULL, 'ACTIVE'),
(24, 4, 4, 9, 'Vợt Pickleball Joola Collin Johns Scorpeus CFS 16', 'Thiết kế mặt vợt bè rộng tối ưu diện tích điểm ngọt sweetspot cho lối đánh phòng thủ dink bóng.', '{"core": "Reactive Honeycomb 16mm", "face": "Charged Carbon Surface", "weight": "8.0 oz"}', 'MOI', NULL, 'ACTIVE'),
(25, 4, 8, 4, 'Giày Pickleball/Tennis Nike Court Air Zoom GP Challenge Pro', 'Đế cao su siêu bền bỉ chống mài mòn cao khi di chuyển ngang liên tục trên sân Pickleball.', '{"outsole": "Claybreaker / Hardcourt", "midsole": "Dual Air Zoom Units", "stability": "TPU Midfoot Shank"}', 'MOI', NULL, 'ACTIVE'),
(26, 4, 13, 9, 'Hộp 3 Quả bóng Pickleball Joola Primo Outdoor', 'Bóng ngoài trời chuẩn thi đấu USA Pickleball 40 lỗ khoan đều chính xác cao.', '{"holes": "40 lỗ khoan", "diameter": "74mm", "quantity": "3 quả / hộp", "standard": "USAPA Approved"}', 'MOI', NULL, 'ACTIVE'),
(27, 4, 13, 8, 'Hộp 12 Quả bóng Pickleball Selkirk Pro S1', 'Độ bền gấp 3 lần bóng thông thường, hạn chế méo mó khi thi đấu dưới nhiệt độ cao.', '{"holes": "38 lỗ chuẩn lực", "quantity": "12 quả / hộp", "durability": "Chống nứt nẻ 1 năm"}', 'MOI', NULL, 'ACTIVE'),
(28, 5, 9, 6, 'Quả bóng rổ Wilson NBA Official Game Ball', 'Bóng da bò thật thi đấu chính thức tại giải nhà nghề Mỹ NBA, cảm giác bám tay chân thực.', '{"material": "100% Genuine Leather Da thật", "size": "Size 7 Tiêu chuẩn nam", "air_retention": "NBA Pro Seam"}', 'MOI', NULL, 'ACTIVE'),
(29, 5, 9, 5, 'Quả bóng rổ Adidas 3-Stripes All Court', 'Bóng rổ đa năng chơi tốt trên cả sân bê tông ngoài trời và sàn gỗ trong nhà.', '{"material": "Cao su tổng hợp bền", "size": "Size 7", "channel": "Deep Channel Grip"}', 'MOI', NULL, 'ACTIVE'),
(30, 1, 15, 1, 'Áo cầu lông Yonex Tournament Pro Khô Thoáng', 'Áo thể thao nam nữ giải nhiệt TruBreeze công nghệ làm mát giảm 3 độ C.', '{"material": "100% Polyester", "tech": "TruBreeze giải nhiệt", "color": "Trắng Đỏ"}', 'MOI', NULL, 'ACTIVE'),
-- CÁC SẢN PHẨM CŨ (CONDITION_TYPE = 'CU') CÓ MÔ TẢ HAO MÒN CHI TIẾT
(31, 1, 2, 1, 'Vợt cầu lông Yonex Astrox 100ZZ Kurenai (Đã qua sử dụng 92%)', 'Cây vợt cựu số 1 Viktor Axelsen, đũa vợt siêu mỏng trợ lực tấn công mạnh.', '{"weight": "4U", "grip": "G5", "tension_current": "26.5 lbs BG65Ti", "condition_grade": "92%"}', 'CU', 'Khung vợt xước nhẹ 2 vết góc 2h và 10h do cạch cầu, không nứt lún cacbon, gen vợt đã thay mới, nước sơn đỏ Kurenai còn bóng đẹp, đũa vợt nguyên bản.', 'ACTIVE'),
(32, 1, 2, 3, 'Vợt cầu lông Victor Auraspeed 90K II (Đã qua sử dụng 95%)', 'Vợt tốc độ phản tạt đôi nam cực thoát tay, ngoại hình còn rất mới.', '{"weight": "3U", "grip": "G5", "tension_current": "27 lbs VBS-66N", "condition_grade": "95%"}', 'CU', 'Ngoại hình như mới 95%, chỉ xước dăm li ti ở nắp chụp cán vợt, khung chưa từng va chạm mạnh, tem phân phối chính hãng còn nguyên.', 'ACTIVE'),
(33, 1, 6, 1, 'Giày cầu lông Yonex Comfort Z3 Wide (Đã qua sử dụng 90%)', 'Dòng giày siêu êm ái đệm Power Cushion toàn bàn chân form chân bè 4E.', '{"size": "41", "width": "4E Wide", "usage_time": "3 tháng (đánh 2 buổi/tuần)"}', 'CU', 'Đế giày mòn nhẹ góc ngoài gót chân khoảng 10%, da upper và mũi giày nguyên vẹn không rách, lót giày trong còn nguyên đệm khí êm.', 'ACTIVE'),
(34, 2, 7, 4, 'Giày đá bóng Nike Phantom GX Pro TF (Đã qua sử dụng 88%)', 'Dòng giày chuyền bóng dính chân với công nghệ sợi Gripknit trên bề mặt.', '{"size": "41", "outsole": "Đinh TF sân cỏ nhân tạo", "usage_time": "Đá khoảng 10 trận sân 7"}', 'CU', 'Đinh dăm đế giày còn bám tốt mòn khoảng 12%, mũi giày có vết trầy nhẹ do chùi bóng, chưa bung keo chỉ dán zin 100%.', 'ACTIVE'),
(35, 3, 3, 6, 'Vợt Tennis Wilson Clash 100 V2 (Đã qua sử dụng 90%)', 'Cây vợt thân thiện nhất cho cánh tay với độ dẻo đàn hồi cao FreeFlex.', '{"head_size": "100 sq in", "weight": "295g", "string": "Cước Luxilon Alu Power 23kg"}', 'CU', 'Vành bảo vệ cước đầu vợt (bumper guard) trầy xước do chạm đất khi cứu bóng, thân vợt đẹp bóng không rạn nứt.', 'ACTIVE'),
(36, 4, 4, 9, 'Vợt Pickleball Joola Hyperion CFS 16 Swift (Đã qua sử dụng 93%)', 'Mẫu vợt bán chạy nhất của Joola với lõi carbon giảm rung chấn tuyệt hảo.', '{"core": "16mm Reactive Core", "face": "Carbon Friction Surface", "weight": "7.9 oz"}', 'CU', 'Mặt nhám carbon còn độ bám xoáy tốt 90%, viền cạnh vợt có vết cọ nhẹ do đỡ bóng thấp sát sàn, cán cuốn mới 100%.', 'ACTIVE'),
(37, 4, 4, 8, 'Vợt Pickleball Selkirk SLK Halo Power Max (Đã qua sử dụng 89%)', 'Dòng vợt phổ thông cao cấp của Selkirk thiết kế mặt T700 Raw Carbon.', '{"core": "Rev-Core Power 13mm", "face": "T700 Raw Carbon", "weight": "8.0 oz"}', 'CU', 'Ngoại hình xước dăm quanh viền bảo vệ, mặt carbon đánh sạch sẽ không bị lún hay nứt lõi polymer tổ ong.', 'ACTIVE'),
(38, 1, 16, 2, 'Bao vợt cầu lông Lining National Team 9 ngăn (Đã qua sử dụng 95%)', 'Túi đựng chuyên dụng của đội tuyển quốc gia Trung Quốc, lớp bạc cách nhiệt tối ưu.', '{"capacity": "9 cây vợt", "material": "Da bóng PU trượt nước", "compartments": "3 ngăn lớn + ngăn giày"}', 'CU', 'Khóa kéo kim loại trơn tru 100%, đáy túi có vết bẩn nhẹ do đặt sàn nhà thi đấu lau sạch được, lớp cách nhiệt nguyên vẹn không rách.', 'ACTIVE');

-- 6. SKUs
INSERT INTO `product_skus` (`id`, `product_id`, `sku_code`, `size`, `color`, `price`, `stock`, `unit`, `quantity_per_lot`) VALUES
(1, 1, 'AX88DP-4UG5-BK', '4U/G5', 'Đen/Bạc', 4150000.00, 25, 'CHIEC', 1),
(2, 1, 'AX88DP-3UG5-BK', '3U/G5', 'Đen/Bạc', 4150000.00, 15, 'CHIEC', 1),
(3, 2, 'NF1000Z-4UG5-YL', '4U/G5', 'Vàng Tia Chớp', 4350000.00, 18, 'CHIEC', 1),
(4, 2, 'NF1000Z-3UG5-YL', '3U/G5', 'Vàng Tia Chớp', 4350000.00, 10, 'CHIEC', 1),
(5, 3, 'AX90T-4U-RD', '4U', 'Đỏ Hổ', 3950000.00, 20, 'CHIEC', 1),
(6, 3, 'AX90T-3U-RD', '3U', 'Đỏ Hổ', 3950000.00, 12, 'CHIEC', 1),
(7, 4, 'HB8000-4U-GR', '4U', 'Xanh Hồng', 3800000.00, 14, 'CHIEC', 1),
(8, 5, 'TK-RYUGA2-4U-PR', '4U/G5', 'Tím Rồng', 3700000.00, 16, 'CHIEC', 1),
(9, 5, 'TK-RYUGA2-3U-PR', '3U/G5', 'Tím Rồng', 3700000.00, 8, 'CHIEC', 1),
(10, 6, '65Z3-WH-40', '40', 'Trắng Đỏ', 2650000.00, 20, 'CHIEC', 1),
(11, 6, '65Z3-WH-41', '41', 'Trắng Đỏ', 2650000.00, 30, 'CHIEC', 1),
(12, 6, '65Z3-WH-42', '42', 'Trắng Đỏ', 2650000.00, 25, 'CHIEC', 1),
(13, 7, 'MWC2-BL-40', '40', 'Xanh Navy', 2300000.00, 15, 'CHIEC', 1),
(14, 7, 'MWC2-BL-41', '41', 'Xanh Navy', 2300000.00, 18, 'CHIEC', 1),
(15, 7, 'MWC2-BL-42', '42', 'Xanh Navy', 2300000.00, 12, 'CHIEC', 1),
(16, 8, 'YONEX-AS50-TUBE', 'Tiêu chuẩn', 'Trắng', 850000.00, 80, 'LO', 12),
(17, 9, 'VIC-CHAMP1-TUBE', 'Tiêu chuẩn', 'Trắng', 520000.00, 100, 'LO', 12),
(18, 10, 'BAG-92231W-BK', 'Standard', 'Đen Vàng', 1550000.00, 22, 'CHIEC', 1),
(19, 11, 'VAPOR15-TF-40', '40', 'Đỏ Cam Hồng', 2850000.00, 15, 'CHIEC', 1),
(20, 11, 'VAPOR15-TF-41', '41', 'Đỏ Cam Hồng', 2850000.00, 20, 'CHIEC', 1),
(21, 11, 'VAPOR15-TF-42', '42', 'Đỏ Cam Hồng', 2850000.00, 18, 'CHIEC', 1),
(22, 12, 'PRED-ELITE-40', '40', 'Đen Đỏ Trắng', 3100000.00, 10, 'CHIEC', 1),
(23, 12, 'PRED-ELITE-41', '41', 'Đen Đỏ Trắng', 3100000.00, 15, 'CHIEC', 1),
(24, 13, 'TA11-PRO-39', '39', 'Trắng Xanh', 850000.00, 30, 'CHIEC', 1),
(25, 13, 'TA11-PRO-40', '40', 'Trắng Xanh', 850000.00, 45, 'CHIEC', 1),
(26, 13, 'TA11-PRO-41', '41', 'Trắng Xanh', 850000.00, 50, 'CHIEC', 1),
(27, 13, 'TA11-PRO-42', '42', 'Trắng Xanh', 850000.00, 35, 'CHIEC', 1),
(28, 14, 'NIKE-FLIGHT-SZ5', 'Size 5', 'Trắng/Xanh Neon', 3200000.00, 15, 'CHIEC', 1),
(29, 15, 'UCL-PRO-SZ5', 'Size 5', 'Trắng Ngôi Sao', 3450000.00, 12, 'CHIEC', 1),
(30, 16, 'RMA-HOME-M', 'M', 'Trắng Vàng', 450000.00, 25, 'CHIEC', 1),
(31, 16, 'RMA-HOME-L', 'L', 'Trắng Vàng', 450000.00, 30, 'CHIEC', 1),
(32, 16, 'RMA-HOME-XL', 'XL', 'Trắng Vàng', 450000.00, 20, 'CHIEC', 1),
(33, 17, 'PS97-V14-G2', 'Grip 2 (4 1/4)', 'Đồng Đen Hạt Ánh', 5600000.00, 10, 'CHIEC', 1),
(34, 17, 'PS97-V14-G3', 'Grip 3 (4 3/8)', 'Đồng Đen Hạt Ánh', 5600000.00, 8, 'CHIEC', 1),
(35, 18, 'PAERO23-G2', 'Grip 2 (4 1/4)', 'Vàng Đen', 5200000.00, 14, 'CHIEC', 1),
(36, 18, 'PAERO23-G3', 'Grip 3 (4 3/8)', 'Vàng Đen', 5200000.00, 12, 'CHIEC', 1),
(37, 19, 'VAPOR11-TN-41', '41', 'Trắng Xanh Mint', 3500000.00, 10, 'CHIEC', 1),
(38, 19, 'VAPOR11-TN-42', '42', 'Trắng Xanh Mint', 3500000.00, 14, 'CHIEC', 1),
(39, 20, 'USOPEN-BALL-CAN4', 'Lon 4 quả', 'Vàng Chanh', 195000.00, 150, 'LO', 4),
(40, 21, 'WR8011301-BK', 'Standard', 'Đỏ Đen Wilson', 1450000.00, 20, 'CHIEC', 1),
(41, 22, 'SELKIRK-VANGUARD-RD', 'Tiêu chuẩn', 'Đỏ Năng Lượng', 5900000.00, 15, 'CHIEC', 1),
(42, 22, 'SELKIRK-VANGUARD-BL', 'Tiêu chuẩn', 'Xanh Biển', 5900000.00, 12, 'CHIEC', 1),
(43, 23, 'JOOLA-PERSEUS-16MM', '16mm', 'Đen Bạc Nhám', 6200000.00, 20, 'CHIEC', 1),
(44, 24, 'JOOLA-SCORPEUS-16MM', '16mm', 'Xanh Dương/Đen', 5800000.00, 18, 'CHIEC', 1),
(45, 25, 'GP-CHALLENGE-40', '40', 'Trắng Cam', 3200000.00, 10, 'CHIEC', 1),
(46, 25, 'GP-CHALLENGE-41', '41', 'Trắng Cam', 3200000.00, 16, 'CHIEC', 1),
(47, 25, 'GP-CHALLENGE-42', '42', 'Trắng Cam', 3200000.00, 14, 'CHIEC', 1),
(48, 26, 'JOOLA-PRIMO-3PK', 'Hộp 3 quả', 'Vàng Chanh Neon', 250000.00, 200, 'LO', 3),
(49, 27, 'SELKIRK-S1-12PK', 'Hộp 12 quả', 'Vàng Chuối', 890000.00, 60, 'LO', 12),
(50, 28, 'NBA-OFFICIAL-SZ7', 'Size 7', 'Nâu Cam Cổ Điển', 4200000.00, 10, 'CHIEC', 1),
(51, 29, 'ADIDAS-BASKET-SZ7', 'Size 7', 'Cam Đen', 650000.00, 40, 'CHIEC', 1),
(52, 30, 'YONEX-TEE-M', 'M', 'Trắng Đỏ', 390000.00, 30, 'CHIEC', 1),
(53, 30, 'YONEX-TEE-L', 'L', 'Trắng Đỏ', 390000.00, 45, 'CHIEC', 1),
(54, 30, 'YONEX-TEE-XL', 'XL', 'Trắng Đỏ', 390000.00, 25, 'CHIEC', 1),
(55, 31, 'USED-AX100ZZ-4U', '4U/G5', 'Đỏ Kurenai', 2700000.00, 1, 'CHIEC', 1),
(56, 32, 'USED-ARS90K2-3U', '3U/G5', 'Đen Xanh Trắng', 2400000.00, 1, 'CHIEC', 1),
(57, 33, 'USED-CFZ3-41', '41', 'Trắng Đen', 1450000.00, 1, 'CHIEC', 1),
(58, 34, 'USED-PHANTOM-41', '41', 'Xanh Biển/Hồng', 1350000.00, 1, 'CHIEC', 1),
(59, 35, 'USED-CLASH100-G2', 'Grip 2', 'Đỏ Đen Nhám', 2850000.00, 1, 'CHIEC', 1),
(60, 36, 'USED-HYPERION-16', '16mm', 'Đen Viền Xám', 3400000.00, 1, 'CHIEC', 1),
(61, 37, 'USED-SLK-HALO-13', '13mm', 'Nâu Gỗ Tự Nhiên', 1950000.00, 1, 'CHIEC', 1),
(62, 38, 'USED-BAG-LN-9R', 'Tiêu chuẩn', 'Đỏ Vàng Rồng', 850000.00, 1, 'CHIEC', 1);

-- 7. Images
INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `sort_order`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', TRUE, 0),
(2, 1, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', FALSE, 1),
(3, 2, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', TRUE, 0),
(4, 2, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', FALSE, 1),
(5, 3, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', TRUE, 0),
(6, 4, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', TRUE, 0),
(7, 5, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', TRUE, 0),
(8, 6, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', TRUE, 0),
(9, 6, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', FALSE, 1),
(10, 7, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', TRUE, 0),
(11, 8, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', TRUE, 0),
(12, 9, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', TRUE, 0),
(13, 10, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', TRUE, 0),
(14, 11, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600', TRUE, 0),
(15, 11, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', FALSE, 1),
(16, 12, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', TRUE, 0),
(17, 13, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', TRUE, 0),
(18, 14, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600', TRUE, 0),
(19, 15, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600', TRUE, 0),
(20, 16, 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600', TRUE, 0),
(21, 17, 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600', TRUE, 0),
(22, 17, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600', FALSE, 1),
(23, 18, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600', TRUE, 0),
(24, 19, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', TRUE, 0),
(25, 20, 'https://images.unsplash.com/photo-1530915365347-e34b1e8df1db?w=600', TRUE, 0),
(26, 21, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', TRUE, 0),
(27, 22, 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600', TRUE, 0),
(28, 22, 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600', FALSE, 1),
(29, 23, 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600', TRUE, 0),
(30, 24, 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600', TRUE, 0),
(31, 25, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', TRUE, 0),
(32, 26, 'https://images.unsplash.com/photo-1530915365347-e34b1e8df1db?w=600', TRUE, 0),
(33, 27, 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600', TRUE, 0),
(34, 28, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600', TRUE, 0),
(35, 29, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600', TRUE, 0),
(36, 30, 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600', TRUE, 0),
(37, 31, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', TRUE, 0),
(38, 32, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', TRUE, 0),
(39, 33, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', TRUE, 0),
(40, 34, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600', TRUE, 0),
(41, 35, 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600', TRUE, 0),
(42, 36, 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600', TRUE, 0),
(43, 37, 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600', TRUE, 0),
(44, 38, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', TRUE, 0);

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
