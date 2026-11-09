-- Tạo database app_db + bảng items + dữ liệu mẫu.
-- Cách chạy bằng MySQL Workbench:
--   File > Open SQL Script... > chọn file này > bấm nút tia sét (Execute) > Refresh ô SCHEMAS.
-- Chạy lại nhiều lần không lỗi (đã có thì bỏ qua), chỉ là dữ liệu mẫu sẽ bị thêm lặp.

SET NAMES utf8mb4; -- để tiếng Việt không bị lỗi font

CREATE DATABASE IF NOT EXISTS app_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE app_db;

CREATE TABLE IF NOT EXISTS items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO items (name, description, price) VALUES
  ('Cơm rang dưa bò', 'Món mẫu để kiểm tra API', 45000),
  ('Trà đá', 'Dữ liệu mẫu số 2', 5000);

-- Module 1: Bảng users + Seed 1 Admin & 5 Khách hàng (Mật khẩu: Admin@123 / Customer@123)
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  address       TEXT NULL,
  role          ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  status        ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (email, password_hash, full_name, phone, address, role, status) VALUES
  ('admin@sportstore.vn', '$2b$12$RPAs/M37R.grVn0FRdN8huVpTYsAi0fxqZQlBmMHoGNySrbUYnpB2', 'Quản Trị Viên Hệ Thống', '0900000001', 'Tầng 5, Tòa nhà Thể Thao, Quận Cầu Giấy, Hà Nội', 'ADMIN', 'ACTIVE'),
  ('nguyenvanan@sportstore.vn', '$2b$12$tmseoXDOpLugMc1/n6Ixn.hEwcQOU1h5vk3xMLR0WA11S6nIknz76', 'Nguyễn Văn An', '0912345601', 'Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội', 'CUSTOMER', 'ACTIVE'),
  ('tranthibich@sportstore.vn', '$2b$12$tmseoXDOpLugMc1/n6Ixn.hEwcQOU1h5vk3xMLR0WA11S6nIknz76', 'Trần Thị Bích', '0912345602', 'Số 88 Láng Hạ, Quận Đống Đa, Hà Nội', 'CUSTOMER', 'ACTIVE'),
  ('lehoangnam@sportstore.vn', '$2b$12$tmseoXDOpLugMc1/n6Ixn.hEwcQOU1h5vk3xMLR0WA11S6nIknz76', 'Lê Hoàng Nam', '0912345603', 'Số 42 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội', 'CUSTOMER', 'ACTIVE'),
  ('phamminhtuan@sportstore.vn', '$2b$12$tmseoXDOpLugMc1/n6Ixn.hEwcQOU1h5vk3xMLR0WA11S6nIknz76', 'Phạm Minh Tuấn', '0912345604', 'Số 102 Giải Phóng, Quận Hai Bà Trưng, Hà Nội', 'CUSTOMER', 'ACTIVE'),
  ('hoangthimai@sportstore.vn', '$2b$12$tmseoXDOpLugMc1/n6Ixn.hEwcQOU1h5vk3xMLR0WA11S6nIknz76', 'Hoàng Thị Mai', '0912345605', 'Số 27 Nguyễn Văn Cừ, Quận Long Biên, Hà Nội', 'CUSTOMER', 'ACTIVE');
